import React from "react";

type OrbState = "idle" | "listening" | "thinking" | "speaking" | "error";

type OrbProps = {
  state: OrbState;
};

const stateLabels: Record<OrbState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  error: "Error",
};

export default function Orb({ state }: OrbProps) {
  return (
    <div className="orb-wrap" aria-live="polite">
      <div className={`orb ${state}`} role="img" aria-label={`Orb is ${state}`}>
        <div className="orb-glow" />
      </div>
      <div className="orb-state-label">{stateLabels[state]}</div>
    </div>
  );
}
