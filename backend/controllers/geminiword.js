import { initializeAI } from "./Geminiletter.js";
import WordState from "../models/WordState.js";
import LetterState from "../models/LetterState.js";
import { selectNextState } from "../src/bandit/selectNext.js";
import { updateBanditState } from "../src/bandit/updateState.js";
import { getTrainingCorpusForStudent } from "../services/trainingContentService.js";

// Chooses the next word based on the student's weakest letters (2–3)
export const getNextWord = async (req, res) => {
  try {
    const studentId = req.user._id;
    const corpus = await getTrainingCorpusForStudent(studentId);
    const availableWords = corpus.words;
    
    // Get weakest letters
    const weakLetterStates = await LetterState.find({ studentId })
      .sort({ avgReward: 1 }) // lowest = hardest
      .limit(3);

    let weakLetters = weakLetterStates.map(ls => ls.letter);

    // Fallback for new users
    if (weakLetters.length === 0) {
      weakLetters = ["a", "e", "i"];
    }

    // Score words
    const scoreWord = (wordText, letters) => {
      const text = wordText.toLowerCase();
      let score = 0;

      for (const letter of letters) {
        score += text.split(letter).length - 1;
      }

      return score;
    };

    const rankedWords = availableWords
      .map(w => ({
        ...w,
        score: scoreWord(w.text, weakLetters),
      }))
      .filter(w => w.score > 0);

    // Fallback: if no word stresses weak letters
    const finalWords =
      rankedWords.length > 0
        ? rankedWords
        : availableWords.map(w => ({ ...w, score: 1 }));

    // Ensure WordState exists
    await Promise.all(
      finalWords.map(word =>
        WordState.findOneAndUpdate(
          { studentId, wordId: word.id },
          {},
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    // Fetch candidate states
    const candidateStates = await WordState.find({
      studentId,
      wordId: { $in: finalWords.map(w => w.id) },
    });

    if (candidateStates.length === 0) {
      return res.status(500).json({
        success: false,
        error: "No word states available",
      });
    }

    const RECENT_WINDOW_MS = 30 * 1000; // 30 seconds

    const now = Date.now();

    const filteredStates = candidateStates.filter(state => {
      if (!state.lastShownAt) return true;
      return now - new Date(state.lastShownAt).getTime() > RECENT_WINDOW_MS;
    });

    // fallback if all filtered out
    const selectionPool =
      filteredStates.length > 0 ? filteredStates : candidateStates;

    const chosenState = selectNextState(selectionPool);
    // BEFORE activating chosenState
    await WordState.updateMany(
      {
        studentId,
        isActive: true,
        wordId: { $ne: chosenState.wordId },
      },
      { isActive: false }
    );

    // Bandit selection
    chosenState.isActive = true;
    chosenState.lastShownAt = new Date();
    await chosenState.save();

    // Return word
    const chosenWord = availableWords.find(
      w => w.id === chosenState.wordId
    );
    if (!chosenWord) {
      return res.status(500).json({
        success: false,
        error: "Selected word not found in training corpus",
      });
    }

    return res.json({
      success: true,
      wordId: chosenWord.id,
      word: chosenWord.text,
      sourceSentence: chosenWord.sourceSentence || null,
      sourceDocTitle: chosenWord.sourceDocTitle || null,
      trainingSource: corpus.source,
      targetLetters: weakLetters,
    });

  } catch (err) {
    console.error("getNextWord error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const geminiWordAttempt = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { wordId, expected, responseTimeMs, visualScore, visionHard } = req.body;
    const audio = req.file;

    if (!wordId || !expected || !audio || responseTimeMs === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for word attempt",
      });
    }

    const wordState = await WordState.findOne({ studentId, wordId });

    if (!wordState) {
      return res.status(409).json({
        success: false,
        message: "No active word or word mismatch",
      });
    }

    const audioBuffer = audio.buffer;
    const base64Audio = audioBuffer.toString("base64");

    const geminiAI = initializeAI();
    const response = await geminiAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: audio.mimetype || "audio/webm",
                data: base64Audio,
              },
            },
            {
              text:
                "Listen to this audio and transcribe ONLY the spoken word. Return only the text.",
            },
          ],
        },
      ],
    });

    const spoken = response.text.toLowerCase().trim();

    const normalize = (text) =>
      text
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const expectedNorm = normalize(expected);
    const spokenNorm = normalize(spoken);

    const wordCorrect = expectedNorm === spokenNorm;
    const comparedLength = Math.max(expectedNorm.length, 1);
    const positionalMatches = expectedNorm
      .split("")
      .reduce(
        (count, char, index) => count + (char === (spokenNorm[index] || "") ? 1 : 0),
        0
      );
    const partialCorrect =
      !wordCorrect && positionalMatches / comparedLength >= 0.5;
    const canAdvance = wordCorrect || partialCorrect;

    console.log("HIT /words/attempt-audio", {
      wordId,
      expected,
      spoken,
      responseTimeMs,
    });

    console.log("ATTEMPT UPDATE", {
      wordId,
      expected,
      studentId,
    });

    const problemLetters = new Set();
    const letterAdjustments = new Map();
    const expectedChars = expectedNorm.split("");
    const spokenChars = spokenNorm.split("");

    for (let i = 0; i < expectedChars.length; i++) {
      const expChar = expectedChars[i];
      const spkChar = spokenChars[i] || "";

      if (!(expChar >= "a" && expChar <= "z")) continue;

      if (expChar === spkChar) {
        const currentReward = letterAdjustments.get(expChar) || 0;
        // Small positive reinforcement when the student pronounces this letter correctly in a word.
        letterAdjustments.set(expChar, currentReward + 0.1);
      } else {
        problemLetters.add(expChar);
        const currentReward = letterAdjustments.get(expChar) || 0;
        letterAdjustments.set(expChar, currentReward - 0.2);
      }
    }

    const fluencyScore = Math.min(1, 3000 / Number(responseTimeMs));
    const visualScoreValue = Math.max(0, Number(visualScore || 0));
    const visionPenalty = visualScoreValue * 0.2;
    const wordReward = 0.6 * (wordCorrect ? 1 : 0) + 0.4 * fluencyScore;
    const finalReward = Math.max(0, wordReward - visionPenalty);

    console.log("REWARD DEBUG", {
      responseTimeMs,
      fluencyScore,
      wordCorrect,
      wordReward,
      visualScore: visualScoreValue,
      visionHard,
      visionPenalty,
      finalReward,
    });

    await updateBanditState(wordState, finalReward);
    wordState.isActive = false;
    await wordState.save();

    for (const [letter, rewardDelta] of letterAdjustments.entries()) {
      const letterState = await LetterState.findOneAndUpdate(
        { studentId, letter },
        {},
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      updateBanditState(letterState, rewardDelta);
      await letterState.save();
    }

    return res.json({
      success: true,
      wordCorrect,
      partialCorrect,
      canAdvance,
      problemLetters: Array.from(problemLetters),
      transcript: spoken,
      message: wordCorrect
        ? "Good job! Keep going."
        : partialCorrect
        ? "Almost there. Try the same word once more."
        : "Nice try! Focus on the highlighted sounds.",
    });
  } catch (err) {
    console.error("Gemini word attempt error:", err);
    return res.status(500).json({ success: false, message: "Gemini word evaluation failed" });
  }
};
