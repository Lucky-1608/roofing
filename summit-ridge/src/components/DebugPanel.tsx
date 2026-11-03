import { useEffect, useState } from "react";

/** Shows fired pixel events on screen when the URL has ?debug=1 (for the screen recording). */
export function DebugPanel() {
  const [, tick] = useState(0);
  const on = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
  useEffect(() => { const f = () => tick((n) => n + 1); window.addEventListener("track-log", f); return () => window.removeEventListener("track-log", f); }, []);
  if (!on) return null;
  return (
    <aside className="debug"><strong>whop.track</strong>
      {(window.__trackLog ?? []).slice(-8).map((e, i) => <div key={i}>{e.t} · {e.name}</div>)}
    </aside>
  );
}
