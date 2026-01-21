
import express from "express";
import multer from "multer";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { geminiLetter } from "../controllers/Geminiletter.js";


const router = express.Router();
const execAsync = promisify(exec);

// Configure multer
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token"
      });
    }

    // Add JWT verification if you have it set up
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Not authorized, invalid token"
    });
  }
};

// Simple letter matching algorithm
function calculateLetterScore(expected, transcribed) {
  if (!transcribed) return 0;
  
  const expectedLetter = expected.toUpperCase().trim();
  const transcribedText = transcribed.toUpperCase().trim();
  
  // Exact match
  if (transcribedText === expectedLetter) return 100;
  
  // Contains the letter
  if (transcribedText.includes(expectedLetter)) return 90;
  
  // Phonetic variations
  const phonetics = {
    'A': ['AY', 'EH', 'AYE'],
    'B': ['BEE', 'BE', 'BEA'],
    'C': ['SEE', 'SEA', 'SI', 'CEE'],
    'D': ['DEE', 'DE', 'DI'],
    'E': ['EE', 'EA', 'IH'],
    'F': ['EFF', 'EF'],
    'G': ['GEE', 'JEE', 'GE'],
    'H': ['AYCH', 'AITCH', 'EICH'],
    'I': ['EYE', 'AY', 'AYE', 'AI'],
    'J': ['JAY', 'JEH'],
    'K': ['KAY', 'KAH'],
    'L': ['ELL', 'EL'],
    'M': ['EMM', 'EM'],
    'N': ['ENN', 'EN'],
    'O': ['OH', 'OW', 'OHH'],
    'P': ['PEE', 'PE', 'PEA'],
    'Q': ['CUE', 'QUE', 'KYU'],
    'R': ['ARR', 'ARE', 'AR'],
    'S': ['ESS', 'ES'],
    'T': ['TEE', 'TE', 'TEA'],
    'U': ['YOU', 'YU', 'YOO'],
    'V': ['VEE', 'VE'],
    'W': ['DOUBLE U', 'DOUBLEYOU', 'DOUBLEU'],
    'X': ['EKS', 'EX', 'ECKS'],
    'Y': ['WHY', 'WYE', 'WAI'],
    'Z': ['ZEE', 'ZED', 'ZI']
  };
  
  const variants = phonetics[expectedLetter] || [];
  for (const variant of variants) {
    if (transcribedText.includes(variant)) {
      return 85;
    }
  }
  
  // Some attempt
  return transcribedText.length > 0 ? 30 : 0;
}

// OPTION 1: Using ffmpeg + vosk (offline speech recognition)
// You'll need to install: npm install vosk-api
// And download a vosk model from https://alphacephei.com/vosk/models

// OPTION 2: Using Google Speech-to-Text
// Install: npm install @google-cloud/speech
// Requires Google Cloud credentials

// OPTION 3: Using AssemblyAI (simpler alternative to OpenAI)
// Install: npm install assemblyai

// For now, here's a simple version that uses client-side processing
// The transcription should happen on the frontend using Web Speech API
router.post("/gemini-letter", verifyToken, upload.single("audio"), geminiLetter);
router.post("/simple-letter", verifyToken, async (req, res) => {
  try {
    const { letter, transcribed } = req.body;
    
    if (!letter || !transcribed) {
      return res.status(400).json({
        success: false,
        message: "Letter and transcribed text are required"
      });
    }

    const score = calculateLetterScore(letter, transcribed);
    
    let message;
    if (score >= 90) {
      message = "✅ Perfect! You said it correctly!";
    } else if (score >= 70) {
      message = "👍 Good job! Almost there!";
    } else if (score >= 50) {
      message = "🔄 Not quite right. Try again!";
    } else {
      message = "❌ That doesn't match. Give it another try!";
    }

    res.json({
      success: true,
      score,
      message,
      transcribed,
      expected: letter
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process letter",
      error: error.message
    });
  }
});

export default router;