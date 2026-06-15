import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

import LetterState from "../models/LetterState.js";
import { selectNextState } from "../src/bandit/selectNext.js";
import { updateBanditState } from "../src/bandit/updateState.js";

dotenv.config();

let ai = null;

// Lazy initialization of Gemini API
const initializeAI = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return ai;
};

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const EPSILON = 0.3;

export const getNextLetter = async (req, res) => {
  const studentId = req.user._id;

  // Deactivate any previous active letter
  await LetterState.updateMany(
    { studentId, isActive: true },
    { isActive: false },
  );

  // Cold start: ensure all letters exist
  //Every student has all 26 letters initialized
  await Promise.all(
    LETTERS.map((letter) =>
      LetterState.findOneAndUpdate(
        { studentId, letter },
        {},
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      ),
    ),
  );
  //Now we have 26 states
  const states = await LetterState.find({ studentId });

  const chosen = selectNextState(states, EPSILON);

  chosen.isActive = true;
  await chosen.save();

  res.json({ letter: chosen.letter });
};

export const geminiLetterAttempt = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { letter } = req.body;
    const audio = req.file;

    if (!letter || !audio) {
      return res.status(400).json({
        success: false,
        message: "Missing letter or audio",
      });
    }

    // 🔒 Enforce active letter
    const state = await LetterState.findOne({
      studentId,
      letter,
      isActive: true,
    });

    if (!state) {
      return res.status(409).json({
        success: false,
        message: "No active letter to attempt",
      });
    }

    /* =====================
       Gemini Transcription
    ====================== */

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
                mimeType: audio.mimetype || "audio/wav",
                data: base64Audio,
              },
            },
            {
              text:
                "Listen to this audio and transcribe ONLY the spoken letter " +
                "(or phonetic form like 'bee', 'see'). Return only the text.",
            },
          ],
        },
      ],
    });

    const spoken = response.text.toLowerCase().trim();

    /* =====================
       Scoring (Gemini → reward)
    ====================== */

    const LETTER_MAP = {
      a: ["a", "eh", "ay"],
      b: ["b", "bee", "be"],
      c: ["c", "see", "sea"],
      d: ["d", "dee"],
      e: ["e", "ee"],
      f: ["f", "ef"],
      g: ["g", "gee", "jee"],
      h: ["h", "aitch"],
      i: ["i", "eye"],
      j: ["j", "jay"],
      k: ["k", "kay"],
      l: ["l", "el"],
      m: ["m", "em"],
      n: ["n", "en"],
      o: ["o", "oh"],
      p: ["p", "pee"],
      q: ["q", "cue"],
      r: ["r", "are", "ar"],
      s: ["s", "ess"],
      t: ["t", "tee"],
      u: ["u", "you"],
      v: ["v", "vee"],
      w: ["w", "double u", "double you"],
      x: ["x", "ex"],
      y: ["y", "why"],
      z: ["z", "zee", "zed"],
    };

    const variants = LETTER_MAP[letter] || [];

    let score = 0;
    let matched = false;

    for (const v of variants) {
      if (spoken === v || spoken.includes(v)) {
        score = 100;
        matched = true;
        break;
      }
    }

    if (!matched && spoken.length > 0) score = 0;

    // 🎯 Normalize Gemini output → bandit reward
    const reward = score >= 80 ? 1 : 0;

    /* =====================
       Bandit Update
    ====================== */

    await updateBanditState(state, reward);
    state.isActive = false;
    await state.save();

    res.json({
      success: true,
      letter,
      transcript: spoken,
      score,
      reward,
      avgReward: state.avgReward,
      message: reward >= 1 ? "🎉 Correct!" : "❌ Try again",
    });
  } catch (err) {
    console.error("Gemini letter attempt error:", err);

    res.status(500).json({
      success: false,
      message: "Gemini letter evaluation failed",
    });
  }
};

// Export initializer so other controllers can reuse Gemini client
export { initializeAI };
