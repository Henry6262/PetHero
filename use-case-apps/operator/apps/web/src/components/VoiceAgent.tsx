import { useEffect, useRef, useState } from "react";

// Minimal Web Speech API surface for the demo component.
// Using any for the constructor keeps the file portable across TS lib configs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = any;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

interface VoiceAgentProps {
  className?: string;
}

export default function VoiceAgent({ className }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: { results: { transcript: string }[][] }) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(text);
      void handleQuery(text);
    };

    recognition.onerror = (event: { error: string }) => {
      setIsListening(false);
      if (event.error === "no-speech") {
        setError("No speech detected. Try again.");
      } else if (event.error === "audio-capture") {
        setError("Microphone not available.");
      } else {
        setError(`Speech error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch {
      // Already started.
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleQuery = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/voice/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("Voice query failed");
      const data = await res.json();
      setResponse(data.response ?? "No response");
      speak(data.response ?? "No response");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    "Where is the enemy?",
    "Status of the payload",
    "Dispatch the scout",
    "What is my next waypoint?",
    "Pause mission",
  ];

  if (!supported) {
    return (
      <div
        className={className}
        style={{
          color: "#9ca3af",
          fontSize: 12,
        }}
      >
        Voice not supported in this browser. Use Chrome or Edge for the live demo.
      </div>
    );
  }

  return (
    <div className={className} style={{ color: "#e5e7eb" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isListening ? "#ef4444" : "#22c55e",
            boxShadow: isListening ? "0 0 8px #ef4444" : "none",
          }}
        />
      </div>

      <button
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 0",
          fontSize: 14,
          fontWeight: 600,
          color: "#e5e7eb",
          background: isListening ? "#7f1d1d" : "#0e5c3b",
          border: `1px solid ${isListening ? "#b91c1c" : "#1a9c66"}`,
          borderRadius: 6,
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        {isListening ? "Listening..." : loading ? "Thinking..." : "Hold to speak"}
      </button>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {quickQueries.map((q) => (
          <button
            key={q}
            onClick={() => handleQuery(q)}
            disabled={loading}
            style={{
              padding: "4px 8px",
              fontSize: 11,
              color: "#9ca3af",
              background: "#0b0f14",
              border: "1px solid #1f2937",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {transcript && (
        <div style={{ marginBottom: 8, fontSize: 12, color: "#6b7280" }}>
          You: <span style={{ color: "#e5e7eb" }}>{transcript}</span>
        </div>
      )}

      {response && (
        <div
          style={{
            padding: 10,
            background: "#0b0f14",
            borderRadius: 6,
            fontSize: 13,
            color: "#e5e7eb",
            borderLeft: "3px solid #00a8dc",
          }}
        >
          {response}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#f87171" }}>{error}</div>
      )}
    </div>
  );
}
