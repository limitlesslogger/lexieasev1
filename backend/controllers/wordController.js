import WordState from "../models/WordState.js";
import LetterState from "../models/LetterState.js";
import { selectNextState } from "../src/bandit/selectNext.js";
import { updateBanditState } from "../src/bandit/updateState.js";
import { WORDS } from "../data/words.js";

// Chooses the next word based on the student's weakest letters (2–3)
export const getNextWord = async (req, res) => {
  try {
    const studentId = req.user._id;
    
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

    const rankedWords = WORDS
      .map(w => ({
        ...w,
        score: scoreWord(w.text, weakLetters),
      }))
      .filter(w => w.score > 0);

    // Fallback: if no word stresses weak letters
    const finalWords =
      rankedWords.length > 0
        ? rankedWords
        : WORDS.map(w => ({ ...w, score: 1 }));

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
    const chosenWord = WORDS.find(
      w => w.id === chosenState.wordId
    );

    return res.json({
      success: true,
      wordId: chosenWord.id,
      word: chosenWord.text,
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

// Evaluates word attempt and reinforces letter learning
export const logWordAttempt = async (req, res) => {
  console.log("HIT /words/attempt", req.body);
  try {
    const studentId = req.user._id;
    const { wordId, expected, spoken, responseTimeMs } = req.body;

    if (!wordId || !expected || !spoken || responseTimeMs === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Verify active word
    const wordState = await WordState.findOne({
      studentId,
      wordId,
    });
    console.log("ATTEMPT UPDATE", {
      wordId,
      expected,
      studentId,
    });

    if (!wordState) {
      return res.status(409).json({
        success: false,
        error: "No active word or word mismatch",
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

    // Word-level correctness
    const wordCorrect = expectedNorm === spokenNorm;

    // Extract letter-level errors
    const problemLetters = new Set();

    const minLen = Math.min(expectedNorm.length, spokenNorm.length);

    for (let i = 0; i < minLen; i++) {
      const expChar = expectedNorm[i];
      const spkChar = spokenNorm[i];

      if (expChar !== spkChar) {
        if (expChar >= "a" && expChar <= "z") {
          problemLetters.add(expChar);
        }
      }
    }

    // Update WordState
    const fluencyScore = Math.min(1, 3000 / responseTimeMs);

    const wordReward =
      0.6 * (wordCorrect ? 1 : 0) +
      0.4 * fluencyScore;

    console.log("REWARD DEBUG", {
      responseTimeMs,
      fluencyScore,
      wordCorrect,
      wordReward,
    });

    await updateBanditState(wordState, wordReward);
    wordState.isActive = false;
    await wordState.save();

    // Reinforce LetterState
    for (const letter of problemLetters) {
      const letterState = await LetterState.findOne({
        studentId,
        letter,
      });

      if (!letterState) continue;

      // Small penalty, not harsh
      const letterPenalty = 0.2;

      updateBanditState(letterState, -letterPenalty);
      await letterState.save();
    }

    // Respond
    return res.json({
      success: true,
      wordCorrect,
      problemLetters: Array.from(problemLetters),
      message: wordCorrect
        ? "Good job! Keep going."
        : "Nice try! Focus on the highlighted sounds.",
    });

  } catch (err) {
    console.error("logWordAttempt error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
