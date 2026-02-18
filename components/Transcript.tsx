import React from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type TranscriptProps = {
  messages: Message[];
  suggestions: string[];
  onSuggestion: (text: string) => void;
};

export default function Transcript({ messages, suggestions, onSuggestion }: TranscriptProps) {
  return (
    <div className="transcript" role="log" aria-live="polite">
      {messages.length === 0 && (
        <div className="notice">Start by asking a question about the webinar topic.</div>
      )}
      {messages.map((message, index) => (
        <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
          <div className="role">{message.role}</div>
          <div>{message.content}</div>
        </div>
      ))}
      {suggestions.length > 0 && (
        <div className="suggestions" aria-label="Suggested prompts">
          {suggestions.map((suggestion, index) => (
            <button key={`${suggestion}-${index}`} onClick={() => onSuggestion(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
