import React from "react";

type MicButtonProps = {
  listening: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export default function MicButton({ listening, disabled, onToggle }: MicButtonProps) {
  return (
    <button
      type="button"
      className="button secondary"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={listening}
    >
      {listening ? "Stop Mic" : "Start Mic"}
    </button>
  );
}
