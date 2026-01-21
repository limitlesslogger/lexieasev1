import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/api";

export default function WordLevel() {
  const [word, setWord] = useState(null);
  const [wordId, setWordId] = useState(null);
  const [spoken, setSpoken] = useState("");
  const [shownAt, setShownAt] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef(null);
  const spokenRef = useRef("");
  
  /* =========================
     Load next word
  ========================== */
  const loadWord = async () => {
    const res = await apiFetch("/api/words/next");
    setWord(res.word);
    setWordId(res.wordId);
    setFeedback(null);
    setSpoken("");
    setShownAt(Date.now());
  };

  useEffect(() => {
    loadWord();
  }, []);

  /* =========================
     Setup Web Speech API
  ========================== */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      spokenRef.current = transcript;
      setSpoken(transcript);
    };

    recognition.onerror = (err) => {
      console.error("Speech error:", err);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  /* =========================
     Recording controls
  ========================== */
  const startRecording = () => {
    if (!recognitionRef.current) return;

    setSpoken("");
    setFeedback(null);
    setShownAt(Date.now());
    setIsRecording(true);
    recognitionRef.current.start();
  };

  const stopRecording = async () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsRecording(false);

    const currentWordId = wordId;
    const currentWord = word;
    const currentSpoken = spokenRef.current;
    const currentShownAt = shownAt;

    if (!currentSpoken) {
      alert("Speech not captured. Please try again.");
      return;
    }

    const responseTimeMs = Date.now() - currentShownAt;

    const res = await apiFetch("/api/words/attempt", {
      method: "POST",
      body: JSON.stringify({
        wordId: currentWordId,
        expected: currentWord,
        spoken: currentSpoken,
        responseTimeMs,
      }),
    });

    setFeedback(res);

    setTimeout(() => {
      loadWord();
    }, 1500);
  };

  /* =========================
     Render
  ========================== */
  if (!word) return <div>Loading...</div>;

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h2>Say the word aloud</h2>

      <h1 style={{ margin: "30px 0", fontSize: 60 }}>{word}</h1>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={startRecording}
          disabled={isRecording}
          style={{ marginRight: 10, padding: 15 }}
        >
          Start Recording
        </button>

        <button
          onClick={stopRecording}
          disabled={!isRecording}
          style={{ padding: 15 }}
        >
          Stop
        </button>
      </div>

      {spoken && (
        <p>
          <strong>You said:</strong> {spoken}
        </p>
      )}

      {feedback && (
        <div style={{ marginTop: 15 }}>
          <p
            style={{
              color: feedback.wordCorrect ? "green" : "orange",
              fontWeight: "bold",
            }}
          >
            {feedback.message}
          </p>

          {feedback.problemLetters?.length > 0 && (
            <p>
              Focus on:{" "}
              <strong>{feedback.problemLetters.join(", ")}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
