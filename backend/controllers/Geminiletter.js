import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate API key before initializing
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ CRITICAL ERROR: GEMINI_API_KEY not found in environment variables");
  console.error("Please add to your .env file:");
  console.error("GEMINI_API_KEY=your-api-key-here");
  console.error("Get your free API key from: https://aistudio.google.com/");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

export const geminiLetter = async (req, res) => {
  try {
    console.log("📝 Gemini request received");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { letter } = req.body;
    const audio = req.file;

    if (!letter || !audio) {
      console.error("Missing data - letter:", letter, "audio:", !!audio);
      return res.status(400).json({ 
        message: "Missing audio or letter",
        received: { letter: !!letter, audio: !!audio }
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ Gemini API key not configured");
      return res.status(500).json({ 
        message: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file. Get it from https://aistudio.google.com/" 
      });
    }

    console.log(`🎤 Processing audio for letter: ${letter}`);
    console.log(`📁 Audio file path: ${audio.path}`);

    // Read the audio file as base64
    const audioBuffer = fs.readFileSync(audio.path);
    const base64Audio = audioBuffer.toString('base64');

    // Determine MIME type based on file extension
    const fileExt = audio.originalname.split('.').pop().toLowerCase();
    const mimeTypes = {
      'wav': 'audio/wav',
      'mp3': 'audio/mp3',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'aiff': 'audio/aiff'
    };
    const mimeType = mimeTypes[fileExt] || 'audio/wav';

    console.log(`🎵 Audio MIME type: ${mimeType}`);

    // Transcribe audio using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio
              }
            },
            {
              text: "Listen to this audio and transcribe ONLY the letter that is spoken. Return just the letter or the phonetic sound (like 'bee', 'see', etc.). Do not include any other text, explanation, or punctuation."
            }
          ]
        }
      ]
    });

    const spoken = response.text.toLowerCase().trim();
    console.log(`🗣️ Transcript: "${spoken}"`);

    const expected = letter.toLowerCase();
    const variants = LETTER_MAP[expected] || [];

    console.log(`✓ Expected letter: ${expected}`);
    console.log(`✓ Valid variants: ${variants.join(", ")}`);

    // Calculate score
    let score = 0;
    let matched = false;

    for (const variant of variants) {
      if (spoken === variant || spoken.includes(variant)) {
        score = 100;
        matched = true;
        console.log(`✅ Match found: "${variant}"`);
        break;
      }
    }

    if (!matched && spoken.length > 0) {
      score = 30;
      console.log(`⚠️ Partial credit: spoke something but didn't match`);
    }

    // Clean up audio file
    try {
      fs.unlinkSync(audio.path);
      console.log(`🗑️ Cleaned up audio file`);
    } catch (err) {
      console.error("Warning: Could not delete audio file:", err);
    }

    const result = {
      transcript: spoken,
      score,
      message: score >= 80 ? "🎉 Correct!" : "❌ Try again",
      expected: variants,
    };

    console.log(`📊 Result:`, result);
    res.json(result);

  } catch (err) {
    console.error("❌ Gemini error:", err);
    
    // Clean up audio file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error("Could not clean up file on error:", cleanupErr);
      }
    }

    res.status(500).json({ 
      message: "Gemini transcription failed",
      error: err.message 
    });
  }
};