import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiFetch } from "../api/api";
import ReadingLens from "./ReadingLens";
import { computeVisualHesitationScore } from "../utils/visionUtils";
import {
  applyBrushToKeys,
  getTargetsWithinBrush,
} from "./brushUtils";
import {
  initializeEyeTracking,
  startSegment,
  endSegment,
  getSegmentMetrics,
  shutdownEyeTracking,
} from "../utils/eyeTrackingController";
import {
  splitIntoSyllables,
  getGoogleStylePronunciation,
  speakSyllables,
  speakSentenceBreakdown,
  speakText,
  speakWordBreakdown,
} from "../utils/syllabify";

function SentenceLevel() {
  const outletContext = useOutletContext();
  const readingStyle = outletContext?.readingStyle;
  const setLivePreference = outletContext?.setLivePreference;
  const isBrushDown = outletContext?.isBrushDown;
  const setIsBrushDown = outletContext?.setIsBrushDown;
  const brushState = outletContext?.brushState;
  const clearHighlightsVersion = outletContext?.clearHighlightsVersion;
  const [sentence, setSentence] = useState(null);
  const [sentenceId, setSentenceId] = useState(null);
  const [focusWords, setFocusWords] = useState([]);
  const [sourceDocTitle, setSourceDocTitle] = useState("");
  const [spoken, setSpoken] = useState("");
  const [shownAt, setShownAt] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedWord, setSelectedWord] = useState("");
  const [selectedSyllables, setSelectedSyllables] = useState([]);
  const [selectedPronunciation, setSelectedPronunciation] = useState("");
  const [paintedWords, setPaintedWords] = useState({});

  const spokenRef = useRef("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const sentenceIdRef = useRef(null);
  const sentenceRef = useRef(null);
  const shownAtRef = useRef(null);
  const videoRef = useRef(null);
  const lensAreaRef = useRef(null);
  const wordRefs = useRef({});

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        console.log("Initializing eye tracking...");
        initializeEyeTracking(videoRef.current);
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      shutdownEyeTracking();
    };
  }, []);

  useEffect(() => {
    sentenceIdRef.current = sentenceId;
    sentenceRef.current = sentence;
    shownAtRef.current = shownAt;
  }, [sentenceId, sentence, shownAt]);

  /* =========================
     Varied Feedback Messages
  ========================== */
  const getSuccessFeedback = () => {
    const messages = [
      "Excellent work! Keep it up!",
      "Perfect! You nailed it!",
      "Fantastic! You're doing great!",
      "Amazing job! Keep going!",
      "Superb! You're on fire!",
      "Outstanding! Well done!",
      "Brilliant! That was perfect!",
      "Wonderful! You've got this!",
      "Incredible! Keep that momentum!",
      "Great job! You're improving!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getMotivatingFeedback = () => {
    const messages = [
      "You're so close! Try again!",
      "Almost there! You can do it!",
      "You're getting better! Keep trying!",
      "Nice effort! You're almost perfect!",
      "Keep going! You're improving!",
      "You're near! One more time!",
      "Great attempt! Try once more!",
      "You're on the right track!",
      "So close! Don't give up!",
      "You're doing well! Keep practicing!",
      "Almost perfect! You've got this!",
      "Good try! You're getting there!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  /* =========================
     Load next sentence (Bandit)
  ========================== */
  const loadSentence = async () => {
    try {
      const res = await apiFetch("/api/sentences/next");
      console.log("✅ Sentence loaded:", res);
      setSentence(res.sentence);
      setPaintedWords({});
      setSentenceId(res.sentenceId);
      setFocusWords(res.focusWords || []);
      setSourceDocTitle(res.sourceDocTitle || "");
      setFeedback(null);
      setSpoken("");
      setSelectedWord("");
      setSelectedSyllables([]);
      setSelectedPronunciation("");
      spokenRef.current = "";
      startSegment();
      setShownAt(Date.now());
    } catch (error) {
      console.error("❌ Failed to load sentence:", error);
      setSentence("Error loading sentence. Please refresh.");
    }
  };

  useEffect(() => {
    loadSentence();
  }, []);

  useEffect(() => {
    setPaintedWords({});
  }, [clearHighlightsVersion]);

  const handleWordClick = async (clickedWord) => {
    const syllableParts = await splitIntoSyllables(clickedWord);
    setSelectedWord(clickedWord);
    setSelectedSyllables(syllableParts);
    setSelectedPronunciation(getGoogleStylePronunciation(syllableParts));
  };

  const applyBrushAtPoint = (clientX, clientY) => {
    const keys = getTargetsWithinBrush(
      wordRefs.current,
      { x: clientX, y: clientY },
      brushState?.size || readingStyle?.brushSize || 24
    );

    applyBrushToKeys(
      keys,
      brushState?.mode || "paint",
      brushState?.color || readingStyle?.brushColor || readingStyle?.colors.ink,
      setPaintedWords
    );
  };

  const paintWordKey = (key) => {
    applyBrushToKeys(
      [key],
      brushState?.mode || "paint",
      brushState?.color || readingStyle?.brushColor || readingStyle?.colors.ink,
      setPaintedWords
    );
  };

  /* =========================
     Audio Feedback
  ========================== */
  const speakFeedback = (feedback) => {
    if (!("speechSynthesis" in window)) return;

    const text = feedback.sentenceCorrect
      ? getSuccessFeedback()
      : getMotivatingFeedback();
    speakText(text, { rate: 0.8, pitch: 1.05 });
  };

  /* =========================
     Submit Attempt → Bandit
  ========================== */
  const submitAttempt = async (audioBlob) => {
    console.log("📤 submitAttempt called");

    if (!sentenceIdRef.current || !sentenceRef.current || !shownAtRef.current) {
      console.log("❌ Missing data, aborting submit");
      return;
    }

    endSegment();

    const metrics = getSegmentMetrics();
    const responseTimeMs = Date.now() - shownAtRef.current;

    let visionResult = { usable: false, score: 0, isHard: false };

    if (responseTimeMs >= 2000) {
      // sentences need longer threshold
      visionResult = computeVisualHesitationScore(metrics);
    }

    console.log("=== SENTENCE VISION DEBUG ===");
    console.log("Response Time:", responseTimeMs);
    console.log("Samples:", metrics.samples);
    console.log("Fixations:", metrics.fixationCount);
    console.log("Mean Duration:", metrics.meanFixationDuration);
    console.log("Score:", visionResult.score);
    console.log("IsHard:", visionResult.isHard);

    try {
      const form = new FormData();
      form.append("sentenceId", sentenceIdRef.current);
      form.append("expected", sentenceRef.current);
      form.append("responseTimeMs", Date.now() - shownAtRef.current);
      form.append("visualScore", visionResult.score);
      form.append("visualIsHard", visionResult.isHard);
      if (spokenRef.current) {
        form.append("spoken", spokenRef.current);
      }
      if (audioBlob) {
        form.append("audio", audioBlob, "sentence.webm");
      }

      const res = await apiFetch("/api/sentences/attempt", {
        method: "POST",
        body: form,
      });

      console.log("✅ API Response:", res);
      setSpoken(res.transcript || spokenRef.current || "");

      // Add varied feedback message
      const feedbackMessage = res.sentenceCorrect
        ? getSuccessFeedback()
        : getMotivatingFeedback();

      setFeedback({
        ...res,
        transcript: res.transcript || spokenRef.current || "",
        displayMessage: feedbackMessage,
      });

      speakFeedback(res);

      if (res?.canAdvance) {
        setTimeout(() => {
          console.log("⏭️ Loading next sentence...");
          loadSentence();
        }, 1600);
      }
    } catch (error) {
      console.error("❌ Failed to submit attempt:", error);
      setFeedback({
        sentenceCorrect: false,
        displayMessage: "Connection error. Please try again.",
      });
    }
  };

  /* =========================
     Cleanup speech synthesis
  ========================== */
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      try {
        streamRef.current?.getTracks().forEach((track) => track.stop());
      } catch (_) {
        // ignore cleanup failure
      }
    };
  }, []);

  /* =========================
     Controls
  ========================== */
  const startRecording = async () => {
    console.log("▶️ START button clicked");

    setSpoken("");
    spokenRef.current = "";
    setFeedback(null);
    setShownAt(Date.now());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          streamRef.current?.getTracks().forEach((track) => track.stop());
        } catch (_) {
          // ignore stop failure
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await submitAttempt(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recorder.start();
      console.log("🎙️ Recording started");
    } catch (error) {
      console.error("❌ Start error:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    console.log("⏹️ STOP button clicked");
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
      console.log("❌ No active recorder");
      return;
    }

    try {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("🎙️ Stopping recording...");
    } catch (error) {
      console.error("❌ Stop error:", error);
    }
  };

  const moveToNextSentence = async () => {
    setFeedback(null);
    setSpoken("");
    spokenRef.current = "";
    await loadSentence();
  };

  /* =========================
     UI
  ========================== */
  if (!sentence)
    return (
      <div
        style={{
          ...styles.loading,
          color: readingStyle?.colors.muted || styles.loading.color,
          fontFamily: readingStyle?.fontFamily || styles.page.fontFamily,
        }}
      >
        Preparing your session...
      </div>
    );

  return (
    <div
      style={{
        ...styles.page,
        background: readingStyle?.colors.page || styles.page.background,
        color: readingStyle?.colors.ink || "#1e293b",
        fontFamily: readingStyle?.fontFamily || styles.page.fontFamily,
      }}
    >
      <div
        style={{
          ...styles.card,
          background: readingStyle?.colors.card || styles.card.background,
          border: `1px solid ${readingStyle?.colors.border || "#dbe4f0"}`,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ display: "none" }}
        />

        <p
          style={{
            ...styles.subtitle,
            color: readingStyle?.colors.ink || styles.subtitle.color,
            fontFamily: readingStyle?.fontFamily || styles.page.fontFamily,
            fontSize: `${22 * (readingStyle?.fontScale || 1)}px`,
            letterSpacing: readingStyle?.letterSpacing || "0.08em",
            wordSpacing: readingStyle?.wordSpacing || "0.18em",
            lineHeight: readingStyle?.lineHeight || 1.65,
          }}
        >
          Read this sentence clearly
        </p>

        <div
          ref={lensAreaRef}
          onPointerDown={(event) => {
            if (!readingStyle?.paintbrushEnabled) return;
            setIsBrushDown?.(true);
            applyBrushAtPoint(event.clientX, event.clientY);
          }}
          onPointerMove={(event) => {
            if (!readingStyle?.paintbrushEnabled || !isBrushDown) return;
            applyBrushAtPoint(event.clientX, event.clientY);
          }}
          style={{
            ...styles.sentenceWrap,
            background: readingStyle?.colors.card || styles.sentenceWrap.background,
            color: readingStyle?.colors.ink || styles.sentenceWrap.color,
            border: `2px solid ${readingStyle?.colors.border || "#c7d2fe"}`,
            boxShadow: "none",
            touchAction: readingStyle?.paintbrushEnabled ? "none" : "auto",
            userSelect: readingStyle?.paintbrushEnabled ? "none" : "text",
          }}
        >
          <h1
            style={{
              ...styles.sentence,
              fontFamily: readingStyle?.fontFamily || styles.page.fontFamily,
              fontSize: `${36 * (readingStyle?.fontScale || 1)}px`,
              letterSpacing: readingStyle?.letterSpacing || "0.08em",
              wordSpacing: readingStyle?.wordSpacing || "0.18em",
              lineHeight: readingStyle?.lineHeight || 1.65,
            }}
          >
            {(sentence || "").split(" ").map((w, i) => (
              <span
                key={`${w}-${i}`}
                ref={(element) => {
                  const key = `${w}-${i}`;
                  if (element) {
                    wordRefs.current[key] = element;
                  } else {
                    delete wordRefs.current[key];
                  }
                }}
                onPointerDown={() => {
                  if (!readingStyle?.paintbrushEnabled) return;
                  setIsBrushDown?.(true);
                  paintWordKey(`${w}-${i}`);
                }}
                onPointerEnter={() => {
                  if (!readingStyle?.paintbrushEnabled || !isBrushDown) return;
                  paintWordKey(`${w}-${i}`);
                }}
                style={{
                  ...styles.wordChip,
                  background:
                    selectedWord === w
                      ? readingStyle?.focusColor || "#ffe28a"
                      : "transparent",
                  color:
                    paintedWords[`${w}-${i}`] ||
                    readingStyle?.colors.ink ||
                    styles.sentenceWrap.color,
                  transform:
                    readingStyle?.magnifierEnabled && selectedWord === w
                      ? "scale(1.12)"
                      : "scale(1)",
                  transition: "transform 0.18s ease, background 0.18s ease, color 0.18s ease",
                  borderRadius: 12,
                  padding: "0 6px",
                }}
                onClick={() => {
                  if (readingStyle?.paintbrushEnabled) return;
                  handleWordClick(w);
                }}
              >
                {w}{" "}
              </span>
            ))}
          </h1>
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

        {(sourceDocTitle || focusWords.length > 0) && (
          <p
            style={{
              ...styles.trainingMeta,
              color: readingStyle?.colors.muted || styles.trainingMeta.color,
              fontFamily: readingStyle?.fontFamily || styles.page.fontFamily,
              letterSpacing: readingStyle?.letterSpacing || "0.08em",
              wordSpacing: readingStyle?.wordSpacing || "0.18em",
              lineHeight: readingStyle?.lineHeight || 1.65,
            }}
          >
            {sourceDocTitle ? `Doc: ${sourceDocTitle}. ` : ""}
            {focusWords.length > 0 ? `Focus words: ${focusWords.join(", ")}` : ""}
          </p>
        )}
        {sentence && (
          <div style={styles.controls}>
            <button
              onClick={() => speakSentenceBreakdown(sentence, focusWords)}
              style={styles.stopBtn}
            >
              Hear Sentence
            </button>
          </div>
        )}
        {selectedWord && (
          <div
            style={{
              ...styles.spokenCard,
              background: readingStyle?.colors.card || styles.spokenCard.background,
              border: `1px solid ${readingStyle?.colors.border || "#dbe4f0"}`,
            }}
          >
            <span style={styles.label}>Word Breakdown</span>
            <p
              style={{
                ...styles.spokenText,
                color: readingStyle?.colors.ink || styles.spokenText.color,
                fontFamily: readingStyle?.fontFamily || styles.page.fontFamily,
                fontSize: `${18 * (readingStyle?.fontScale || 1)}px`,
                letterSpacing: readingStyle?.letterSpacing || "0.08em",
                wordSpacing: readingStyle?.wordSpacing || "0.18em",
                lineHeight: readingStyle?.lineHeight || 1.65,
                background: readingStyle?.focusColor || "transparent",
                borderRadius: 10,
                display: "inline-block",
                padding: "6px 10px",
                transform: readingStyle?.magnifierEnabled ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.18s ease, background 0.18s ease",
              }}
            >
              <strong>{selectedWord}</strong>
            </p>
            <p
              style={{
                ...styles.spokenText,
                color: readingStyle?.colors.ink || styles.spokenText.color,
                fontFamily: readingStyle?.fontFamily || styles.page.fontFamily,
                fontSize: `${18 * (readingStyle?.fontScale || 1)}px`,
                letterSpacing: readingStyle?.letterSpacing || "0.08em",
                wordSpacing: readingStyle?.wordSpacing || "0.18em",
                lineHeight: readingStyle?.lineHeight || 1.65,
              }}
            >
              Syllables: {selectedSyllables.join(" - ")}
            </p>
            <p
              style={{
                ...styles.spokenText,
                color: readingStyle?.colors.ink || styles.spokenText.color,
                fontFamily: readingStyle?.fontFamily || styles.page.fontFamily,
                fontSize: `${18 * (readingStyle?.fontScale || 1)}px`,
                letterSpacing: readingStyle?.letterSpacing || "0.08em",
                wordSpacing: readingStyle?.wordSpacing || "0.18em",
                lineHeight: readingStyle?.lineHeight || 1.65,
              }}
            >
              Pronunciation: {selectedPronunciation}
            </p>
            <button
              style={{ ...styles.stopBtn, marginTop: 10 }}
              onClick={() => speakWordBreakdown(selectedWord, selectedSyllables)}
            >
              Hear Word Breakdown
            </button>
            <button
              style={{ ...styles.stopBtn, marginTop: 10 }}
              onClick={() => speakSyllables(selectedSyllables)}
            >
              Hear Syllables Only
            </button>
          </div>
        )}

        <div style={styles.controls}>
          <button
            onClick={startRecording}
            disabled={isRecording}
            style={{
              ...styles.micBtn,
              ...(isRecording ? styles.micActive : {}),
            }}
          >
            {isRecording ? "🔴" : "🎤"}
          </button>

          <button
            onClick={stopRecording}
            disabled={!isRecording}
            style={styles.stopBtn}
          >
            Stop
          </button>

          <button
            onClick={moveToNextSentence}
            disabled={isRecording}
            style={styles.nextBtn}
          >
            Next Sentence
          </button>
        </div>

        {spoken && (
          <div
            style={{
              ...styles.spokenCard,
              background: readingStyle?.colors.card || styles.spokenCard.background,
              border: `1px solid ${readingStyle?.colors.border || "#dbe4f0"}`,
            }}
          >
            <span style={styles.label}>You said</span>
            <p
              style={{
                ...styles.spokenText,
                color: readingStyle?.colors.ink || styles.spokenText.color,
                fontFamily: readingStyle?.fontFamily || styles.page.fontFamily,
                fontSize: `${18 * (readingStyle?.fontScale || 1)}px`,
                letterSpacing: readingStyle?.letterSpacing || "0.08em",
                wordSpacing: readingStyle?.wordSpacing || "0.18em",
                lineHeight: readingStyle?.lineHeight || 1.65,
              }}
            >
              {spoken}
            </p>
          </div>
        )}

        {feedback && (
          <div
            style={{
              ...styles.feedback,
              background: feedback.sentenceCorrect
                ? "linear-gradient(135deg,#ecfeff,#d1fae5)"
                : "linear-gradient(135deg,#fff7ed,#ffe4b5)",
            }}
          >
            <strong style={styles.feedbackMessage}>
              {feedback.displayMessage || feedback.message}
            </strong>

            {feedback.problemLetters?.length > 0 && (
              <p style={styles.coach}>
                💡 Focus on:{" "}
                <strong>{feedback.problemLetters.join(", ")}</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
   Styles
========================== */
const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #eef2ff 0%, #f8fafc 60%)",
    display: "flex",
    justifyContent: "center",
    paddingTop: 80,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: 820,
    background: "white",
    borderRadius: 24,
    padding: "48px",
    boxShadow: "0 30px 60px rgba(15,23,42,0.12)",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 36,
    color: "#1e293b",
  },
  sentenceWrap: {
    position: "relative",
    padding: "48px",
    borderRadius: 24,
    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    color: "white",
    marginBottom: 56,
    boxShadow: "0 10px 30px rgba(30,64,175,0.3)",
  },
  sentence: {
    fontSize: 36,
    fontWeight: 800,
    lineHeight: 1.4,
  },
  wordChip: {
    cursor: "pointer",
  },
  trainingMeta: {
    marginTop: 10,
    color: "#475569",
    fontSize: 13,
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    gap: 24,
    marginBottom: 30,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    border: "none",
    fontSize: 32,
    background: "#1e40af",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(30,64,175,0.4)",
  },
  micActive: {
    background: "#dc2626",
    animation: "pulse 1.5s infinite",
  },
  stopBtn: {
    padding: "16px 28px",
    borderRadius: 14,
    border: "1px solid #c7d2fe",
    background: "white",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  nextBtn: {
    padding: "16px 28px",
    borderRadius: 14,
    border: "none",
    background: "#0f172a",
    color: "white",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 700,
    transition: "all 0.2s ease",
  },
  spokenCard: {
    background: "#f1f5f9",
    borderRadius: 14,
    padding: 20,
    textAlign: "left",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  spokenText: {
    fontSize: 18,
    marginTop: 8,
    color: "#1e293b",
  },
  feedback: {
    marginTop: 24,
    padding: 22,
    borderRadius: 16,
    border: "2px solid rgba(0,0,0,0.05)",
  },
  feedbackMessage: {
    fontSize: 20,
    color: "#1e293b",
  },
  coach: {
    marginTop: 12,
    fontSize: 15,
    color: "#475569",
  },
  loading: {
    marginTop: 120,
    fontSize: 20,
    textAlign: "center",
    color: "#64748b",
  },
};

export default SentenceLevel;
