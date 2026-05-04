import { apiFetch } from "../api/api";

const VOWELS = "aeiouy";
const LS_PREFIX = "syllables:";

const normalizeWord = (word = "") => word.toLowerCase().replace(/[^a-z]/g, "");

const heuristicSplit = (word = "") => {
  const clean = normalizeWord(word);
  if (!clean) return [];

  const out = [];
  let chunk = "";

  for (let i = 0; i < clean.length; i++) {
    chunk += clean[i];
    const cur = clean[i];
    const next = clean[i + 1];
    const curIsVowel = VOWELS.includes(cur);
    const nextIsVowel = next ? VOWELS.includes(next) : false;

    if (curIsVowel && (!next || !nextIsVowel)) {
      out.push(chunk);
      chunk = "";
    }
  }

  if (chunk) {
    if (out.length === 0) out.push(chunk);
    else out[out.length - 1] += chunk;
  }

  return out.filter(Boolean);
};

export const splitIntoSyllables = async (word = "") => {
  const clean = normalizeWord(word);
  if (!clean) return [];

  const key = `${LS_PREFIX}${clean}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (_) {
      // ignore invalid cache entries
    }
  }

  try {
    const res = await apiFetch(`/api/syllables/${encodeURIComponent(clean)}`);
    if (res?.success && Array.isArray(res.syllables) && res.syllables.length) {
      localStorage.setItem(key, JSON.stringify(res.syllables));
      return res.syllables;
    }
  } catch (_) {
    // ignore API errors and use fallback
  }

  const fallback = heuristicSplit(clean);
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
};

export const getStressedSyllables = (syllables = []) =>
  syllables.map((s, i) => (i === 0 ? `ˈ${s}` : s));

export const getGoogleStylePronunciation = (syllables = []) =>
  getStressedSyllables(syllables).join("·");

const getPreferredVoice = () => {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  return (
    voices.find((voice) => /en(-|_)?(us|gb)/i.test(voice.lang)) ||
    voices.find((voice) => /english/i.test(voice.name)) ||
    voices[0] ||
    null
  );
};

export const speakText = (
  text = "",
  { rate = 0.82, pitch = 1, volume = 1 } = {}
) => {
  if (!("speechSynthesis" in window) || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;
  const voice = getPreferredVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
};

export const speakSequence = (
  parts = [],
  { rate = 0.8, pitch = 1, volume = 1 } = {}
) => {
  if (!("speechSynthesis" in window) || !parts.length) return;
  window.speechSynthesis.cancel();
  const voice = getPreferredVoice();

  parts
    .filter(Boolean)
    .forEach((part) => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    });
};

export const speakSyllables = (syllables = []) => {
  if (!syllables.length) return;

  const intro =
    syllables.length === 1
      ? "One syllable."
      : `${syllables.length} syllables.`;

  speakSequence([intro, ...syllables], { rate: 0.72, pitch: 1.02 });
};

export const speakWordBreakdown = (word = "", syllables = []) => {
  const cleanWord = normalizeWord(word);
  if (!cleanWord || !syllables.length) return;

  const intro = `Listen carefully. The word is ${cleanWord}.`;
  const countText =
    syllables.length === 1
      ? "It has one syllable."
      : `It has ${syllables.length} syllables.`;
  const breakdown = syllables.join(" ... ");
  const closing =
    syllables.length === 1
      ? `Say it smoothly: ${cleanWord}.`
      : `Blend the syllables together: ${cleanWord}.`;

  speakSequence([intro, countText, breakdown, closing], {
    rate: 0.7,
    pitch: 1.02,
  });
};

export const buildWordFeedbackSpeech = ({ word = "", syllables = [], feedback }) => {
  if (!feedback) return "";

  if (feedback.wordCorrect) {
    return `Clear pronunciation. Nice work saying ${word}.`;
  }

  if (syllables.length > 1) {
    return `Try again. Break ${word} into syllables: ${syllables.join(
      ", "
    )}. Then say ${word} smoothly.`;
  }

  return `Try again. Listen to the word ${word} and say it slowly and clearly.`;
};

export const speakSentenceBreakdown = (sentence = "", focusWords = []) => {
  const cleanSentence = String(sentence || "").trim();
  if (!cleanSentence) return;

  const intro = "Listen to the whole sentence.";
  const focus =
    focusWords.length > 0
      ? `Focus words: ${focusWords.join(", ")}.`
      : "";
  const closing = "Now say the full sentence clearly.";

  speakSequence([intro, cleanSentence, focus, closing], {
    rate: 0.72,
    pitch: 1.01,
  });
};
