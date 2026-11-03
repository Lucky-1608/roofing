import { createFileRoute } from "@tanstack/react-router";
import { site, type PlanKey } from "../site.config";
import "../styles.css";

export const Route = createFileRoute("/thanks")({ component: Thanks });

// Whop appends `status` on off-site/3DS returns. Never show success unless it says so.
function Thanks() {
  const q = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const status = q.get("status"); const plan = site.plans[q.get("plan") as PlanKey];
  const ok = status === "succeeded", pending = status === "processing";
  return (
    <main className="wrap" style={{ padding: "4rem 0" }}>
      <div className="card">
        <h1>{ok ? "Payment received" : pending ? "Payment processing" : "Payment not completed"}</h1>
        <p>{ok ? `Thanks! Your ${plan?.label.toLowerCase() ?? "payment"} is confirmed and a receipt is on its way.` : pending ? "Your bank is still confirming. We'll email you when it clears." : "No charge was completed. You can go back and try again."}</p>
        <a className="btn" href="/">Back to {site.brand.name}</a>
      </div>
    </main>
  );
}
