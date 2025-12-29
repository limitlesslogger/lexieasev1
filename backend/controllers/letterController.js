import LetterState from "../models/LetterState.js";
import axios from "axios";
import FormData from "form-data";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const EPSILON = 0.3; //30% exploration, 70% exploitation
const T_MAX = 4000; //Max expected response time in ms

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
  try {
    const studentId = req.user._id;
    const{ letter, responseTimeMs } = req.body;

    if (!letter || responseTimeMs === undefined) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields" });
    }

    let correct;

    //Determine correctness
    if (req.file) {
      try {
        //ML path (audio file provided)
        const form = new FormData();
        form.append("audio", req.file.buffer, "audio.wav");
        form.append("letter", letter);

        const mlRes = await axios.post(
          "http://localhost:6000/analyze",
          form,
          { headers: form.getHeaders(), timeout: 5000 }
        );

        //When audio was not captured properly or other ML error
        if (mlRes.data?.error) {
          return res.status(422).json({
            success: false,
            reason: "invalid_attempt",
            message: mlRes.data.error,
          });
        }

        correct = mlRes.data.correct;

      } catch (mlErr) {
        return res.status(422).json({
          success: false,
          reason: "ml_unavailable",
          message: "Could not analyze audio. Please try again.",
        });
      }
    } else {
      //Non-ML path (no audio, use provided correctness)
      correct = req.body.correct;
    }

    if (typeof correct !== "boolean") {
      return res.status(422).json({ 
        success: false,
        reason: "invalid_attempt",
        message: "Could not determine correctness, Please retry." 
      });
    }

    const reward = computeReward({ correct, responseTimeMs });

    const state = await LetterState.findOne({ studentId, letter });
    if (!state) {
      return res.status(404).json({ 
        success: false,
        error: "Letter state not found",
      });
    }

    state.pulls += 1; //number of attempts on a given letter
    state.totalReward += reward;
    state.avgReward = state.totalReward / state.pulls;

    await state.save();

    res.json({
      success: true,
      letter,
      correct,
      reward,
      avgReward: state.avgReward,
    });

  } catch (err) {
    console.error("logLetterAttempt error:", err);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" ,
    });
  }
};