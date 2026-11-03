import { useState } from "react";
import { site } from "../site.config";
import { track } from "../lib/track";

export function EstimateForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending"); setErr(null);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Couldn't send your request.");
      // Fire where the action completes. event_id = lead id so a retry can't double count.
      track("estimate_requested", { event_id: j.id, service: String(body.service) });
      track("lead", { event_id: `lead-${j.id}` });
      setState("done");
    } catch (x: any) { setErr(x.message); setState("idle"); }
  }

  if (state === "done") return <div className="card"><h3>Request received</h3><p>Thanks! We'll contact you shortly to schedule your free estimate.</p></div>;
  return (
    <form className="card form" onSubmit={submit}>
      <label>Name<input name="name" required autoComplete="name" /></label>
      <label>Phone<input name="phone" type="tel" required autoComplete="tel" /></label>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Property address<input name="address" autoComplete="street-address" /></label>
      <label>Service
        <select name="service" defaultValue="replacement">
          {site.services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </label>
      <label className="full">What's going on?<textarea name="message" rows={3} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      {err && <p role="alert" className="err full">{err}</p>}
      <button className="btn full" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Request an Estimate"}</button>
    </form>
  );
}
