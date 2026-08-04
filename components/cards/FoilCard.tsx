"use client";

import type { CSSProperties, PointerEvent, ReactNode } from "react";

type FoilCardProps = {
  children: ReactNode;
  className?: string;
  active?: boolean;
};

function setTilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === "touch") {
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  const rx = Math.max(-5, Math.min(5, (0.5 - y) * 10));
  const ry = Math.max(-6, Math.min(6, (x - 0.5) * 12));

  event.currentTarget.style.setProperty("--rx", `${rx}deg`);
  event.currentTarget.style.setProperty("--ry", `${ry}deg`);
  event.currentTarget.style.setProperty("--mx", `${x * 100}%`);
  event.currentTarget.style.setProperty("--my", `${y * 100}%`);
}

function resetTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--rx", "0deg");
  event.currentTarget.style.setProperty("--ry", "0deg");
  event.currentTarget.style.setProperty("--mx", "50%");
  event.currentTarget.style.setProperty("--my", "50%");
}

export function FoilCard({ children, className = "", active = false }: FoilCardProps) {
  return (
    <div
      className={`foil-card ${className}`}
      data-active={active ? "true" : undefined}
      onPointerMove={setTilt}
      onPointerLeave={resetTilt}
      style={
        {
          "--rx": "0deg",
          "--ry": "0deg",
          "--mx": "50%",
          "--my": "50%"
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
