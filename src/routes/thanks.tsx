import { createFileRoute } from "@tanstack/react-router";
import { site, type PlanKey } from "../site.config";
import "../styles.css";

export const Route = createFileRoute("/thanks")({ component: Thanks });

// Whop appends `status` on off-site/3DS returns. Never show success unless it says so.
function Thanks() {
  const q = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const status = q.get("status");
  const plan = site.plans[q.get("plan") as PlanKey];
  const payment = q.get("payment");
  const isSandbox = payment?.startsWith("pay_test_");
  const ok = status === "succeeded", pending = status === "processing";

  return (
    <main className="wrap" style={{ padding: "4rem 0" }}>
      <div className="card" style={{ maxWidth: 580, margin: "0 auto", textAlign: "center" }}>
        {isSandbox && (
          <div style={{ display: "inline-block", background: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: "999px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem" }}>
            🧪 Sandbox Test Payment Verified ($0 Charged)
          </div>
        )}
        <h1 style={{ margin: "0.25rem 0 1rem" }}>{ok ? "Payment received" : pending ? "Payment processing" : "Payment not completed"}</h1>
        <p className="muted" style={{ fontSize: "1.1rem" }}>
          {ok
            ? `Thanks! Your ${plan?.label.toLowerCase() ?? "payment"} is confirmed and a receipt is on its way.`
            : pending
            ? "Your bank is still confirming. We'll email you when it clears."
            : "No charge was completed. You can go back and try again."}
        </p>
        {payment && (
          <p className="small muted" style={{ fontFamily: "monospace", margin: "1.25rem 0" }}>
            Confirmation Ref: {payment}
          </p>
        )}
        <div style={{ marginTop: "1.5rem" }}>
          <a className="btn" href="/">Back to {site.brand.name}</a>
        </div>
      </div>
    </main>
  );
}
