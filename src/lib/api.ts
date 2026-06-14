export async function fetchToday() {
  const res = await fetch("/api/session/today");
  if (!res.ok) throw new Error("Failed to fetch today session");
  return res.json();
}

export async function startSession(category?: string) {
  const res = await fetch("/api/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to start session");
  return data;
}

export async function respondToSession(session_id: string, user_message: string) {
  const res = await fetch("/api/session/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, user_message })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to respond");
  return data;
}

export async function fetchResult(session_id: string) {
  const res = await fetch(`/api/session/result?session_id=${session_id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to fetch result");
  return data;
}

export async function fetchHistory() {
  const res = await fetch("/api/history");
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function getMe() {
  const res = await fetch("/api/me");
  if (!res.ok) return null;
  return res.json();
}
