import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../api/api";
import { useOutletContext } from "react-router-dom";
import ReadingLens from "./ReadingLens";

export default function LetterLevelGemini() {
  const outletContext = useOutletContext();
  const readingStyle = outletContext?.readingStyle;
  const setLivePreference = outletContext?.setLivePreference;
  const isBrushDown = outletContext?.isBrushDown;
  const setIsBrushDown = outletContext?.setIsBrushDown;
  const brushState = outletContext?.brushState;
  const clearHighlightsVersion = outletContext?.clearHighlightsVersion;
  const [letter, setLetter] = useState("");
  const [painted, setPainted] = useState(false);
  const [status, setStatus] = useState("");
  const [score, setScore] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const lensAreaRef = useRef(null);

  /* =========================
     Check browser support
  ========================== */
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setStatus("❌ Microphone recording not supported in this browser.");
    }
  }, []);

  /* =========================
     Fetch next letter (Bandit)
  ========================== */
  const fetchNextLetter = async () => {
    try {
      const data = await apiFetch("/api/letters/next");

      if (!data?.letter) {
        throw new Error("No letter returned");
      }

      setLetter(data.letter.toUpperCase());
      setPainted(false);
      setScore(null);
      setStatus("");
    } catch (err) {
      console.error("fetchNextLetter error:", err);
      setStatus("❌ Could not load next letter");
      setLetter("");
    }
  };

  useEffect(() => {
    fetchNextLetter();
  }, []);

  useEffect(() => {
    setPainted(false);
  }, [clearHighlightsVersion]);

  const applyBrush = () => {
    if (!readingStyle?.paintbrushEnabled) return;
    setPainted(brushState?.mode === "erase" ? false : true);
  };

  /* =========================
     Recording logic
  ========================== */
  const startRecording = async () => {
    if (!isSupported) return;

    try {
      setScore(null);
      setStatus("🎤 Listening...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await submitAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      setTimeout(stopRecording, 3000);
    } catch (err) {
      console.error(err);
      setStatus("❌ Microphone access error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /* =========================
     Submit audio → Gemini → Bandit
  ========================== */
  const submitAudio = async (audioBlob) => {
    try {
      setStatus("⏳ Processing with Gemini AI...");

      const formData = new FormData();
      formData.append("letter", letter.toLowerCase());
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("http://localhost:5001/api/letters/attempt", {
        method: "POST",
        body: formData,
        credentials: "include", // 🔑 REQUIRED
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Attempt failed");
      }

      const data = await res.json();

      setScore(data.score);
      setStatus(data.message);

      speakFeedback(data.score);

      console.log(
        `Expected: ${letter}, Heard: ${data.transcript}, Score: ${data.score}`
      );

      setTimeout(fetchNextLetter, 1200);
    } catch (err) {
      console.error(err);
      setStatus(`❌ ${err.message}`);
      setScore(null);
    }
  };

  /* =========================
     Speech feedback
  ========================== */
  const speakFeedback = (score) => {
    if (!("speechSynthesis" in window)) return;

    let text =
      score >= 90
        ? "Excellent work! Congratulations."
        : score >= 75
        ? "Well done. You are very close."
        : score >= 55
        ? "Good effort. Relax and try again."
        : "Don't worry. Take your time and keep trying.";

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  /* =========================
     UI (UNCHANGED)
  ========================== */
  return (
    <div
      style={{
        ...styles.container,
        background: readingStyle?.colors.page || styles.container.background,
        fontFamily: readingStyle?.fontFamily || styles.container.fontFamily,
      }}
    >
      <div
        style={{
          ...styles.card,
          backgroundColor: readingStyle?.colors.card || styles.card.backgroundColor,
          border: `1px solid ${readingStyle?.colors.border || "#e5e7eb"}`,
        }}
      >
        <h2 style={styles.title}>🔤 Letter Practice</h2>

        <div ref={lensAreaRef} style={styles.lensArea}>
          <div
            onPointerDown={() => {
              if (!readingStyle?.paintbrushEnabled) return;
              setIsBrushDown?.(true);
              applyBrush();
            }}
            onPointerMove={() => {
              if (!readingStyle?.paintbrushEnabled || !isBrushDown) return;
              applyBrush();
            }}
            onPointerEnter={() => {
              if (!readingStyle?.paintbrushEnabled || !isBrushDown) return;
              applyBrush();
            }}
            style={{
              ...styles.letterDisplay,
              color: painted
                ? brushState?.color || readingStyle?.brushColor || readingStyle?.colors.ink
                : readingStyle?.colors.ink || styles.letterDisplay.color,
              fontFamily: readingStyle?.fontFamily || styles.letterDisplay.fontFamily,
              fontSize: `${120 * (readingStyle?.fontScale || 1)}px`,
              letterSpacing: readingStyle?.letterSpacing || "0.08em",
              lineHeight: readingStyle?.lineHeight || 1.2,
              background: readingStyle?.focusColor || "transparent",
              transform: "scale(1)",
              transition: "color 0.18s ease, background 0.18s ease",
              borderRadius: 18,
              display: "inline-block",
              padding: "8px 22px",
              touchAction: readingStyle?.paintbrushEnabled ? "none" : "auto",
              userSelect: readingStyle?.paintbrushEnabled ? "none" : "text",
            }}
          >
            {letter}
          </div>
          <ReadingLens
            visible={readingStyle?.magnifierEnabled}
            containerRef={lensAreaRef}
            size={readingStyle?.lensSize || 180}
            zoom={readingStyle?.lensZoom || 1.35}
            shape={readingStyle?.lensShape || "rounded"}
            opacity={readingStyle?.lensOpacity ?? 0.18}
            onZoomIn={() =>
              setLivePreference(
                "lensZoom",
                Math.min(2.2, Number(((readingStyle?.lensZoom || 1.35) + 0.1).toFixed(2)))
              )
            }
            onZoomOut={() =>
              setLivePreference(
                "lensZoom",
                Math.max(1, Number(((readingStyle?.lensZoom || 1.35) - 0.1).toFixed(2)))
              )
            }
            onResizeUp={() =>
              setLivePreference(
                "lensSize",
                Math.min(280, (readingStyle?.lensSize || 180) + 20)
              )
            }
            onResizeDown={() =>
              setLivePreference(
                "lensSize",
                Math.max(120, (readingStyle?.lensSize || 180) - 20)
              )
            }
            onResizeTo={(nextSize) => setLivePreference("lensSize", nextSize)}
            onClose={() => setLivePreference("magnifierEnabled", false)}
          />
        </div>

        <div
          style={{
            ...styles.instructions,
            color: readingStyle?.colors.muted || styles.instructions.color,
            fontFamily: readingStyle?.fontFamily || styles.instructions.fontFamily,
            fontSize: `${18 * (readingStyle?.fontScale || 1)}px`,
            letterSpacing: readingStyle?.letterSpacing || "0.08em",
            wordSpacing: readingStyle?.wordSpacing || "0.18em",
            lineHeight: readingStyle?.lineHeight || 1.65,
          }}
        >
          Click the microphone and clearly say: <strong>"{letter}"</strong>
        </div>

        <div style={styles.buttonContainer}>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isSupported}
            style={{
              ...styles.recordButton,
              backgroundColor: isRecording ? "#ef4444" : "#3b82f6",
              opacity: !isSupported ? 0.6 : 1,
            }}
          >
            {isRecording ? "🔴 Stop (3s max)" : "🎤 Speak"}
          </button>
        </div>

        {status && <p style={styles.status}>{status}</p>}
      </div>
    </div>
  );
}

/* =========================
   Styles (unchanged)
========================== */
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #f8fafc, #ffffff)",
    padding: "24px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    maxWidth: "600px",
    width: "100%",
  },
  lensArea: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 220,
    margin: "10px 0 18px",
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    textAlign: "center",
    marginBottom: "12px",
  },
  letterDisplay: {
    fontSize: "120px",
    fontWeight: 700,
    color: "#1e40af",
    margin: "28px 0",
    textAlign: "center",
  },
  instructions: {
    fontSize: "18px",
    color: "#6b7280",
    marginBottom: "30px",
    textAlign: "center",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  recordButton: {
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  status: {
    fontSize: "18px",
    textAlign: "center",
    margin: "20px 0",
  },
};
