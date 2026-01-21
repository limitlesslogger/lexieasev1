import React, { useState, useRef, useEffect } from "react";

export default function LetterLevelGemini() {
  const [letter, setLetter] = useState("A");
  const [status, setStatus] = useState("");
  const [score, setScore] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Check if MediaRecorder is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setStatus("❌ Microphone recording not supported in this browser.");
    }
  }, []);

  const startRecording = async () => {
    if (!isSupported) {
      setStatus("❌ Recording not supported");
      return;
    }

    try {
      setScore(null);
      setStatus("🎤 Starting microphone...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      // Use webm format if supported, otherwise use default
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/ogg';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        await submitAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus("🎤 Listening... Say the letter clearly");

      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          stopRecording();
        }
      }, 3000);

    } catch (error) {
      console.error("Microphone error:", error);
      setIsRecording(false);
      if (error.name === 'NotAllowedError') {
        setStatus("❌ Microphone access denied. Please allow microphone access.");
      } else {
        setStatus(`❌ Error: ${error.message}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAudio = async (audioBlob) => {
    try {
      setStatus("⏳ Processing with Gemini AI...");
      
      const token = localStorage.getItem("token");
      
      // Create FormData to send audio file
      const formData = new FormData();
      formData.append("letter", letter);
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("http://localhost:5001/api/letters/gemini-letter", {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setScore(data.score);
      setStatus(data.message);
      
      // Show what was heard
      console.log(`Expected: ${letter}, Heard: ${data.transcript}, Score: ${data.score}`);
      
    } catch (error) {
      console.error("Submit error:", error);
      setStatus(`❌ Error: ${error.message}`);
      setScore(null);
    }
  };

  const nextLetter = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const currentIndex = letters.indexOf(letter);
    const nextIndex = (currentIndex + 1) % 26;
    setLetter(letters[nextIndex]);
    setScore(null);
    setStatus("");
  };

  const randomLetter = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let newLetter;
    do {
      newLetter = letters[Math.floor(Math.random() * 26)];
    } while (newLetter === letter);
    
    setLetter(newLetter);
    setScore(null);
    setStatus("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔤 Letter Pronunciation Practice</h2>
        <div style={styles.badge}>Powered by Gemini AI ✨</div>
        
        <div style={styles.letterDisplay}>
          {letter}
        </div>

        <div style={styles.instructions}>
          Click the microphone and clearly say: <strong>"{letter}"</strong>
        </div>

        <div style={styles.buttonContainer}>
          <button 
            onClick={isRecording ? stopRecording : startRecording} 
            disabled={!isSupported}
            style={{
              ...styles.recordButton,
              opacity: !isSupported ? 0.6 : 1,
              cursor: !isSupported ? "not-allowed" : "pointer",
              backgroundColor: isRecording ? "#ef4444" : "#3b82f6"
            }}
          >
            {isRecording ? "🔴 Stop (3s max)" : "🎤 Speak"}
          </button>
          
          <button 
            onClick={nextLetter} 
            style={styles.nextButton}
            title="Next letter in sequence"
          >
            ➡️ Next
          </button>
          
          <button 
            onClick={randomLetter} 
            style={styles.randomButton}
            title="Random letter"
          >
            🔄 Random
          </button>
        </div>

        {status && (
          <p style={styles.status}>{status}</p>
        )}
        
        {score !== null && (
          <div style={{
            ...styles.scoreContainer,
            backgroundColor: score >= 80 ? "#d1fae5" : "#fee2e2"
          }}>
            <p style={{
              ...styles.score,
              color: score >= 80 ? "#059669" : "#dc2626"
            }}>
              Score: {score}/100
            </p>
            {score >= 90 ? (
              <p style={styles.feedback}>🎉 Excellent!</p>
            ) : score >= 70 ? (
              <p style={styles.feedback}>👍 Good job!</p>
            ) : score >= 50 ? (
              <p style={styles.feedback}>🔄 Keep trying!</p>
            ) : (
              <p style={styles.feedback}>💪 Try again!</p>
            )}
          </div>
        )}

        <div style={styles.tips}>
          <h4 style={styles.tipsTitle}>💡 Tips for better recognition:</h4>
          <ul style={styles.tipsList}>
            <li>Speak clearly and at normal volume</li>
            <li>Say just the letter name (e.g., "Ay" for A, "Bee" for B)</li>
            <li>Reduce background noise</li>
            <li>Allow microphone access when prompted</li>
            <li>Recording auto-stops after 3 seconds</li>
          </ul>
        </div>

        <div style={styles.apiInfo}>
          <p style={styles.apiText}>
            🌟 Using Google Gemini API - Free tier available!
            <br />
            <small>More accurate and cost-effective than OpenAI</small>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    padding: "20px"
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    maxWidth: "600px",
    width: "100%"
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "10px",
    textAlign: "center"
  },
  badge: {
    fontSize: "14px",
    color: "#8b5cf6",
    textAlign: "center",
    marginBottom: "20px",
    fontWeight: "600"
  },
  letterDisplay: {
    fontSize: "140px",
    fontWeight: "bold",
    color: "#3b82f6",
    margin: "30px 0",
    fontFamily: "Georgia, serif",
    textAlign: "center",
    textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
  },
  instructions: {
    fontSize: "18px",
    color: "#6b7280",
    marginBottom: "30px",
    textAlign: "center"
  },
  buttonContainer: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  recordButton: {
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    border: "none",
    borderRadius: "8px",
    transition: "all 0.2s",
    minWidth: "140px"
  },
  nextButton: {
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  randomButton: {
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  status: {
    fontSize: "18px",
    color: "#4b5563",
    margin: "20px 0",
    textAlign: "center",
    minHeight: "30px"
  },
  scoreContainer: {
    marginTop: "20px",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center"
  },
  score: {
    fontSize: "36px",
    fontWeight: "bold",
    margin: "0 0 10px 0"
  },
  feedback: {
    fontSize: "24px",
    margin: "10px 0 0 0"
  },
  tips: {
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    textAlign: "left"
  },
  tipsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "10px"
  },
  tipsList: {
    fontSize: "14px",
    color: "#6b7280",
    paddingLeft: "20px",
    margin: 0
  },
  apiInfo: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#ede9fe",
    borderRadius: "8px",
    textAlign: "center"
  },
  apiText: {
    fontSize: "14px",
    color: "#6b21a8",
    margin: 0
  }
};