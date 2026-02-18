\"use client\";

import React from \"react\";
import \"@lottiefiles/dotlottie-wc\";

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
      <div className={`orb-lottie ${state}`} role="img" aria-label={`Orb is ${state}`}>
        <dotlottie-wc
          src="https://lottie.host/e5f5b4e7-6f60-4cb1-819d-005ec90ae6bc/y3o3RMdJmt.lottie"
          autoplay
          loop
          background="transparent"
          speed="1"
        />
      </div>
      <div className="orb-state-label">{stateLabels[state]}</div>
    </div>
  );
}
