"use client";

import { useEffect, useState } from "react";

function timeToMidnightWIB(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 3600 * 1000);
  const h = 23 - wib.getUTCHours();
  const m = 59 - wib.getUTCMinutes();
  const s = 59 - wib.getUTCSeconds();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function Countdown({ className = "" }: { className?: string }) {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    setT(timeToMidnightWIB());
    const id = setInterval(() => setT(timeToMidnightWIB()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={className}>
      Mosi baru dalam <span className="font-mono font-semibold">{t}</span>
    </span>
  );
}
