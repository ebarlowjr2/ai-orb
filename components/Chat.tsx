"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Orb from "./Orb";
import MicButton from "./MicButton";
import Transcript from "./Transcript";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ApiResponse = {
  assistantText: string;
  suggestions?: string[];
  error?: string;
};

type OrbState = "idle" | "listening" | "thinking" | "speaking" | "error";

const MAX_INPUT_CHARS = 1200;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [interim, setInterim] = useState("");
  const [notice, setNotice] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  const orbState: OrbState = hasError
    ? "error"
    : speaking
    ? "speaking"
    : thinking
    ? "thinking"
    : listening
    ? "listening"
    : "idle";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionImpl =
      (window as typeof window & {
        SpeechRecognition?: typeof SpeechRecognition;
        webkitSpeechRecognition?: typeof SpeechRecognition;
      }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setNotice("");
      setHasError(false);
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognition.onerror = () => {
      setHasError(true);
      setListening(false);
      setNotice("Voice input requires Chrome/Edge and mic permission.");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      setInterim(interimText);
      if (finalText.trim()) {
        void handleSend(finalText.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!voiceEnabled) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    }
  }, [voiceEnabled]);

  const canUseSpeechRecognition = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      (window as typeof window & {
        SpeechRecognition?: typeof SpeechRecognition;
        webkitSpeechRecognition?: typeof SpeechRecognition;
      }).SpeechRecognition ||
        (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
          .webkitSpeechRecognition
    );
  }, []);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !voiceEnabled) return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const preferred =
      voices.find((voice) => voice.name.toLowerCase().includes("google us english")) ||
      voices.find((voice) => voice.lang === "en-US") ||
      voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setHasError(true);
    };

    synth.speak(utterance);
  };

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;
    if (text.length > MAX_INPUT_CHARS) {
      setNotice(`Message too long. Limit is ${MAX_INPUT_CHARS} characters.`);
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setInput("");
    setInterim("");
    setNotice("");
    setHasError(false);
    setSuggestions([]);

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setThinking(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          sessionId,
        }),
      });

      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Something went wrong.");
      }

      const assistantText = payload.assistantText || "(No response)";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      setSuggestions(payload.suggestions || []);

      if (voiceEnabled) {
        speak(assistantText);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error.";
      setNotice(message);
      setHasError(true);
    } finally {
      setThinking(false);
    }
  };

  const handleToggleMic = () => {
    if (!canUseSpeechRecognition) {
      setNotice("Voice input requires Chrome/Edge and mic permission.");
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }

    try {
      recognition.start();
    } catch {
      setNotice("Unable to start voice input.");
    }
  };

  const handleReset = () => {
    window.speechSynthesis?.cancel();
    setMessages([]);
    setSuggestions([]);
    setInput("");
    setInterim("");
    setNotice("");
    setThinking(false);
    setSpeaking(false);
    setHasError(false);
  };

  const handleStopVoice = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  return (
    <div className="app-shell">
      <div className="hero">
        <h1>Talking Orb</h1>
        <p>Ask anything about the webinar topic. The orb listens, answers, and speaks back.</p>
      </div>

      <Orb state={orbState} />

      <div className="controls">
        <Transcript
          messages={messages}
          suggestions={suggestions}
          onSuggestion={handleSuggestion}
        />

        <div className="controls-row">
          <div className="input-wrap">
            <input
              type="text"
              placeholder={listening ? "Listening..." : "Type your question"}
              value={input}
              maxLength={MAX_INPUT_CHARS}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSend();
                }
              }}
            />
            <button type="button" onClick={() => void handleSend()} disabled={thinking}>
              Send
            </button>
          </div>
        </div>

        {interim && <div className="notice">Listening: {interim}</div>}

        <div className="actions">
          <MicButton listening={listening} onToggle={handleToggleMic} disabled={thinking} />
          <button type="button" className="button" onClick={handleStopVoice}>
            Stop voice
          </button>
          <label className="toggle">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(event) => setVoiceEnabled(event.target.checked)}
            />
            Voice output
          </label>
          <button type="button" className="button" onClick={handleReset}>
            Reset conversation
          </button>
        </div>

        {notice && <div className="notice">{notice}</div>}
      </div>
    </div>
  );
}
