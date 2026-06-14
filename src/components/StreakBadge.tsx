"use client";

export function StreakBadge({
  count,
  animate = false,
}: {
  count: number;
  animate?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
      <span className={animate ? "animate-flame inline-block" : "inline-block"}>
        🔥
      </span>
      {count}
    </span>
  );
}
