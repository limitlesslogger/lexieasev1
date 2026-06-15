import SentenceState from "../models/SentenceState.js";
import LetterState from "../models/LetterState.js";
import { selectNextState } from "../src/bandit/selectNext.js";
import { updateBanditState } from "../src/bandit/updateState.js";
import { getTrainingCorpusForStudent } from "../services/trainingContentService.js";
import { initializeAI } from "./Geminiletter.js";

// Chooses the next sentence based on the student's weakest letters (2–3)
export const getNextSentence = async (req, res) => {
  try {
    const studentId = req.user._id;
    const corpus = await getTrainingCorpusForStudent(studentId);
    const availableSentences = corpus.sentences;
    
    // Get weakest letters
    const weakLetterStates = await LetterState.find({ studentId })
      .sort({ avgReward: 1 }) // lowest = hardest
      .limit(3);

    let weakLetters = weakLetterStates.map(ls => ls.letter);

    // Fallback for new users
    if (weakLetters.length === 0) {
      weakLetters = ["a", "e", "i"];
    }

    // Score sentences
    const scoreSentence = (sentenceText, letters) => {
      const text = sentenceText.toLowerCase();
      let score = 0;

      for (const letter of letters) {
        score += text.split(letter).length - 1;
      }

      return score;
    };

    const rankedSentences = availableSentences
      .map(s => ({
        ...s,
        score: scoreSentence(s.text, weakLetters),
      }))
      .filter(s => s.score > 0);

    // Fallback: if no sentence stresses weak letters
    const finalSentences =
      rankedSentences.length > 0
        ? rankedSentences
        : availableSentences.map(s => ({ ...s, score: 1 }));

    // Ensure SentenceState exists
    await Promise.all(
      finalSentences.map(sentence =>
        SentenceState.findOneAndUpdate(
          { studentId, sentenceId: sentence.id },
          {},
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    // Fetch candidate states
    const candidateStates = await SentenceState.find({
      studentId,
      sentenceId: { $in: finalSentences.map(s => s.id) },
    });

    if (candidateStates.length === 0) {
      return res.status(500).json({
        success: false,
        error: "No sentence states available",
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
    await SentenceState.updateMany(
    {
        studentId,
        isActive: true,
        sentenceId: { $ne: chosenState.sentenceId },
    },
    { isActive: false }
    );

    // Bandit selection
    //const chosenState = selectNextState(candidateStates);

    chosenState.isActive = true;
    chosenState.lastShownAt = new Date();
    await chosenState.save();

    // Return sentence
    const chosenSentence = availableSentences.find(
      s => s.id === chosenState.sentenceId
    );
    if (!chosenSentence) {
      return res.status(500).json({
        success: false,
        error: "Selected sentence not found in training corpus",
      });
    }

    return res.json({
      success: true,
      sentenceId: chosenSentence.id,
      sentence: chosenSentence.text,
      focusWords: chosenSentence.focusWords || [],
      sourceDocTitle: chosenSentence.sourceDocTitle || null,
      trainingSource: corpus.source,
      targetLetters: weakLetters,
    });

  } catch (err) {
    console.error("getNextSentence error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

//Evaluates sentence attempt and reinforces letter learning
export const logSentenceAttempt = async (req, res) => {
  console.log("HIT /sentences/attempt", req.body);
  try {
    const studentId = req.user._id;
    const { sentenceId, expected, responseTimeMs, visualScore, visualIsHard } = req.body;
    let { spoken } = req.body;

    if ((!spoken || !String(spoken).trim()) && req.file) {
      const audioBuffer = req.file.buffer;
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
                  mimeType: req.file.mimetype || "audio/webm",
                  data: base64Audio,
                },
              },
              {
                text:
                  "Listen to this audio and transcribe ONLY the spoken sentence. Return only the text.",
              },
            ],
          },
        ],
      });

      spoken = response.text?.toLowerCase().trim() || "";
    }

    if (!sentenceId || !expected || !spoken || responseTimeMs === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Verify active sentence
    const sentenceState = await SentenceState.findOne({
      studentId,
      sentenceId,
    });
    console.log("ATTEMPT UPDATE", {
    sentenceId,
    expected,
    studentId,
    });

    if (!sentenceState) {
      return res.status(409).json({
        success: false,
        error: "No active sentence or sentence mismatch",
      });
    }

    // Normalize text
    const normalize = (text) =>
      text
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const expectedNorm = normalize(expected);
    const spokenNorm = normalize(spoken);

    const expectedWords = expectedNorm.split(" ");
    const spokenWords = spokenNorm.split(" ");

    // Sentence-level correctness   
    const matchedWords = expectedWords.filter((word) =>
      spokenWords.includes(word)
    );

    const sentenceAccuracy =
      matchedWords.length / expectedWords.length;

    const sentenceCorrect = sentenceAccuracy >= 0.7;
    const partialCorrect = !sentenceCorrect && sentenceAccuracy >= 0.4;
    const canAdvance = sentenceCorrect || partialCorrect;

    // Extract letter-level errors   
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
        // Small positive reinforcement when a letter is pronounced correctly inside a sentence.
        letterAdjustments.set(expChar, currentReward + 0.05);
      } else {
        problemLetters.add(expChar);
        const currentReward = letterAdjustments.get(expChar) || 0;
        letterAdjustments.set(expChar, currentReward - 0.2);
      }
    }

    // Update SentenceState   
    const fluencyScore = Math.min(1, 3000 / responseTimeMs);
    const visualScoreValue = Number(visualScore || 0);
    // const visualScoreValue =
    // typeof visualScore === "number" ? visualScore : 0;
    const visionPenalty = visualScoreValue * 0.2;

    const sentenceReward =
      0.6 * (sentenceCorrect ? 1 : 0) +
      0.4 * fluencyScore;

    const finalReward = Math.max(0, sentenceReward - visionPenalty);

    console.log("REWARD DEBUG", {
      responseTimeMs,
      fluencyScore,
      sentenceCorrect,
      sentenceReward,
      visualScore: visualScoreValue,
      visualIsHard,
      visionPenalty,
      finalReward,
    });

    await updateBanditState(sentenceState, finalReward);
    
    // Store the attempt with spoken response
    sentenceState.attempts = sentenceState.attempts || [];
    // sentenceState.attempts.push({
    //   spoken: spoken || "",
    //   expected: expected || "",
    //   accuracy: Math.round(sentenceAccuracy * 100),
    //   responseTime: responseTimeMs,
    //   timestamp: new Date(),
    // });
    sentenceState.attempts.push({
    spoken: spoken || "",
    expected: expected || "",
    accuracy: Math.round(sentenceAccuracy * 100),
    responseTime: responseTimeMs,
    visualScore: visualScoreValue,
    timestamp: new Date(),
  });
    
    sentenceState.isActive = false;
    await sentenceState.save();

    // Reinforce LetterState in both directions so sentence practice teaches the same
    // underlying letter weaknesses that drive future filtering.
    for (const [letter, rewardDelta] of letterAdjustments.entries()) {
      const letterState = await LetterState.findOneAndUpdate(
        { studentId, letter },
        {},
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      updateBanditState(letterState, rewardDelta);
      await letterState.save();
    }

    // Respond
    return res.json({
      success: true,
      sentenceCorrect,
      partialCorrect,
      canAdvance,
      sentenceAccuracy,
      transcript: spoken,
      problemLetters: Array.from(problemLetters),
      message: sentenceCorrect
        ? "Good job! Keep going."
        : partialCorrect
        ? "Almost there. Try the same sentence once more."
        : "Nice try! Focus on the highlighted sounds.",
    });

  } catch (err) {
    console.error("logSentenceAttempt error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
  
};
