import { useEffect, useState } from "react";

const STORAGE_KEY = "reading-support-preferences";

const defaultPreferences = {
  fontPreset: "dyslexic",
  backgroundPreset: "warm",
  readingMode: "focus",
  magnifierEnabled: false,
  lensShape: "rounded",
  lensOpacity: 0.18,
  focusColor: "#ffe28a",
  lensSize: 180,
  lensZoom: 1.35,
  paintbrushEnabled: false,
  brushColor: "#ffd54f",
  brushOpacity: 0.55,
  brushSize: 24,
  brushMode: "paint",
  fontScale: 1,
  letterSpacing: 0.08,
  wordSpacing: 0.18,
  lineHeight: 1.65,
};

export const fontPresets = {
  dyslexic:
    '"OpenDyslexic", "Atkinson Hyperlegible", "Trebuchet MS", Verdana, sans-serif',
  clear:
    '"Atkinson Hyperlegible", "Trebuchet MS", Verdana, sans-serif',
  rounded:
    '"Arial Rounded MT Bold", "Century Gothic", "Trebuchet MS", sans-serif',
  classic: '"Georgia", "Times New Roman", serif',
};

export const backgroundPresets = {
  warm: {
    page: "linear-gradient(180deg, #f6f0dc 0%, #fbf7ea 100%)",
    card: "#fffdf6",
    border: "#e5d9b6",
    ink: "#2f2412",
    muted: "#6b5a39",
  },
  mint: {
    page: "linear-gradient(180deg, #edf6f0 0%, #f7fcf8 100%)",
    card: "#fbfffc",
    border: "#c9ddcf",
    ink: "#163127",
    muted: "#4d665a",
  },
  sky: {
    page: "linear-gradient(180deg, #eef5fb 0%, #f8fbfe 100%)",
    card: "#ffffff",
    border: "#d3deea",
    ink: "#14273d",
    muted: "#53657a",
  },
  rose: {
    page: "linear-gradient(180deg, #fbf0ef 0%, #fff9f8 100%)",
    card: "#fffdfc",
    border: "#e8d4cf",
    ink: "#3a201c",
    muted: "#7a5550",
  },
};

export const readingModes = {
  focus: {
    fontScale: 1,
    letterSpacing: 0.08,
    wordSpacing: 0.18,
    lineHeight: 1.65,
  },
  steady: {
    fontScale: 1.08,
    letterSpacing: 0.11,
    wordSpacing: 0.24,
    lineHeight: 1.82,
  },
  comfort: {
    fontScale: 1.18,
    letterSpacing: 0.14,
    wordSpacing: 0.3,
    lineHeight: 1.95,
  },
};

export const focusColors = [
  { id: "amber", value: "#ffe28a", label: "Amber" },
  { id: "mint", value: "#bbf7d0", label: "Mint" },
  { id: "sky", value: "#bfdbfe", label: "Sky" },
  { id: "peach", value: "#fdba74", label: "Peach" },
];

export const brushColors = [
  { id: "sun", value: "#ffd54f", label: "Sun" },
  { id: "mint", value: "#86efac", label: "Mint" },
  { id: "sky", value: "#93c5fd", label: "Sky" },
  { id: "rose", value: "#f9a8d4", label: "Rose" },
];

const loadPreferences = () => {
  if (typeof window === "undefined") return defaultPreferences;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultPreferences;
  }
};

export function useReadingPreferences() {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [draftPreferences, setDraftPreferences] = useState(loadPreferences);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  return {
    preferences,
    draftPreferences,
    setDraftPreference: (key, value) =>
      setDraftPreferences((prev) => ({ ...prev, [key]: value })),
    setLivePreference: (key, value) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
      setDraftPreferences((prev) => ({ ...prev, [key]: value }));
    },
    applyPreferences: () => setPreferences(draftPreferences),
    resetPreferences: () => {
      setPreferences(defaultPreferences);
      setDraftPreferences(defaultPreferences);
    },
    discardDraft: () => setDraftPreferences(preferences),
  };
}

export function getReadingStyle(preferences = defaultPreferences) {
  const colors =
    backgroundPresets[preferences.backgroundPreset] || backgroundPresets.warm;

  return {
    colors,
    fontFamily: fontPresets[preferences.fontPreset] || fontPresets.dyslexic,
    fontScale: Number(preferences.fontScale || 1),
    letterSpacing: `${Number(preferences.letterSpacing || 0.08)}em`,
    wordSpacing: `${Number(preferences.wordSpacing || 0.18)}em`,
    lineHeight: Number(preferences.lineHeight || 1.65),
    focusColor: preferences.focusColor || "#ffe28a",
    magnifierEnabled: Boolean(preferences.magnifierEnabled),
    lensShape: preferences.lensShape || "rounded",
    lensOpacity: Number(preferences.lensOpacity ?? 0.18),
    lensSize: Number(preferences.lensSize || 180),
    lensZoom: Number(preferences.lensZoom || 1.35),
    paintbrushEnabled: Boolean(preferences.paintbrushEnabled),
    brushColor: preferences.brushColor || "#ffd54f",
    brushOpacity: Number(preferences.brushOpacity ?? 0.55),
    brushSize: Number(preferences.brushSize || 24),
    brushMode: preferences.brushMode || "paint",
  };
}
