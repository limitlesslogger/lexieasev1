import LetterState from "../models/LetterState.js";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const EPSILON = 0.3;
const T_MAX = 4000;

const normalizeTime = (ms) => Math.min(ms / T_MAX, 1);

const computeReward = ({ correct, responseTimeMs }) => {
  return 0.6 * (correct ? 1 : 0) + 0.4 * (1 - normalizeTime(responseTimeMs));
};

/* =====================
   GET NEXT LETTER (Bandit)
===================== */
export const getNextLetter = async (req, res) => {
  const studentId = req.user._id;

  // Ensure state exists for all letters (cold start)
  await Promise.all(
    LETTERS.map((letter) =>
      LetterState.findOneAndUpdate(
        { studentId, letter },
        {},
        { upsert: true, new: true }
      )
    )
  );

  const states = await LetterState.find({ studentId });

  let chosen;

  // Exploration
  if (Math.random() < EPSILON) {
    chosen = states[Math.floor(Math.random() * states.length)];
  }
  // Exploitation (pick lowest avgReward = hardest)
  else {
    chosen = states.reduce((a, b) => (a.avgReward < b.avgReward ? a : b));
  }

  res.json({ letter: chosen.letter });
};

/* =====================
   LOG ATTEMPT & UPDATE BANDIT
===================== */
export const logLetterAttempt = async (req, res) => {
  const studentId = req.user._id;
  const { letter, correct, responseTimeMs } = req.body;

  const reward = computeReward({ correct, responseTimeMs });

  const state = await LetterState.findOne({ studentId, letter });

  const pulls = state.pulls + 1;
  const totalReward = state.totalReward + reward;
  const avgReward = totalReward / pulls;

  state.pulls = pulls;
  state.totalReward = totalReward;
  state.avgReward = avgReward;

  await state.save();

  res.json({ success: true, reward, avgReward });
};
