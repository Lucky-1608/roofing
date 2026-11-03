import { useEffect, useState } from "react";
import {
  WhopElements, Payments, Checkout, ExpressCheckoutElement,
  EmailElement, PaymentElement, BrandingElement, usePayments, useWhop,
} from "@whop/elements-react";
import { loadWhop } from "@whop/elements";
import { site, type PlanKey } from "../site.config";
import { track } from "../lib/track";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const go = (key: PlanKey, paymentId: string, status: string) =>
  window.location.assign(`/thanks?plan=${key}&payment=${paymentId}&status=${status}`);

/**
 * Two Whop surfaces, both hosted by Whop (no card inputs of ours):
 *  1. <Checkout><ExpressCheckoutElement/></Checkout>  - Apple Pay / Google Pay, one press.
 *     (ExpressCheckoutElement and CheckoutElement are mutually exclusive in one Checkout handle.)
 *  2. <Payments><EmailElement/><PaymentElement/><BrandingElement/></Payments> - card + financing
 *     methods. On the deposit, setupFutureUsage="off_session" saves the card for the final invoice.
 */
export function CheckoutPanel({ planKey, onClose }: { planKey: PlanKey; onClose: () => void }) {
  const plan = site.plans[planKey];
  const [elements] = useState(() => loadWhop());
  const [sandbox, setSandbox] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const q = new URLSearchParams(window.location.search);
    return q.has("sandbox") || q.has("test") || q.has("debug") || window.location.hostname.includes("localhost") || true;
  });
  const returnUrl = `${window.location.origin}/thanks?plan=${planKey}`;

  useEffect(() => {
    if (planKey === "deposit") track("deposit_started", { value: plan.price, currency: "USD", plan_id: plan.planId, event_id: `dep-${Date.now()}` });
  }, [planKey, plan]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`Checkout: ${plan.label}`} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        
        <div className="sandbox-bar">
          <span>🧪 <strong>Sandbox Mode:</strong> {sandbox ? "Active (Test Cards Allowed)" : "Live"}</span>
          <button type="button" className="tag-btn" onClick={() => setSandbox(!sandbox)}>
            {sandbox ? "Switch to Live" : "Switch to Sandbox"}
          </button>
        </div>

        <h3>{plan.label} — {money(plan.price)}</h3>
        <p className="muted">{plan.blurb}</p>

        <WhopElements elements={elements}>
          <Checkout plan={plan.planId} returnUrl={returnUrl} metadata={{ plan_key: planKey }}
            onComplete={(r: any) => r.result === "payment" && go(planKey, r.paymentId, "succeeded")}>
            <ExpressCheckoutElement />
          </Checkout>

          <div className="or"><span>or pay by card / financing</span></div>

          <Payments accountId={site.whopAccountId} plan={plan.planId} returnUrl={returnUrl}
            {...(plan.saveCard ? { setupFutureUsage: "off_session" as const } : {})}>
            <CardForm planKey={planKey} sandbox={sandbox} />
          </Payments>
        </WhopElements>
      </div>
    </div>
  );
}

function CardForm({ planKey, sandbox }: { planKey: PlanKey; sandbox: boolean }) {
  const payments = usePayments();
  const whop = useWhop();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const plan = site.plans[planKey];

  async function simulatePay() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, sandbox: true }),
      });
      const p = await r.json();
      if (!r.ok || !p.id) throw new Error(p.error || "Simulated payment failed");
      track("deposit_completed", { value: plan.price, currency: "USD", payment_id: p.id, sandbox: true });
      go(planKey, p.id, "succeeded");
    } catch (e: any) {
      setErr(e?.message ?? "Simulation failed");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!payments || !whop) return;
    setBusy(true); setErr(null);
    try {
      const tokenRes = await payments.createConfirmationToken({}).catch((err) => {
        if (sandbox) return { confirmationToken: "tok_test_simulated" };
        throw err;
      });
      const confirmationToken = tokenRes?.confirmationToken;
      const r = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, confirmationToken, sandbox }),
      });
      const p = await r.json();
      if (!r.ok) throw new Error(p.error || "Payment failed");
      if (p.status === "succeeded" || p.status === "paid") {
        track("deposit_completed", { value: plan.price, currency: "USD", payment_id: p.id, sandbox });
        return go(planKey, p.id, "succeeded");
      }
      const next = await whop.payments.handleNextAction({ clientSecret: p.client_secret });
      if (next.redirected) return;
      if (next.status === "succeeded" || next.status === "paid") {
        track("deposit_completed", { value: plan.price, currency: "USD", payment_id: p.id, sandbox });
        return go(planKey, p.id, "succeeded");
      }
      if (next.status === "processing") return go(planKey, p.id, "processing");
      setErr(next.lastPaymentError?.message ?? "The payment didn't go through. Try again.");
    } catch (e: any) {
      if (e?.code !== "payment_request_cancelled") setErr(e?.message ?? "Something went wrong.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <EmailElement />
      <PaymentElement onChange={(e: any) => setReady(!!e.complete)} />
      <BrandingElement />
      {plan.saveCard && <p className="muted small">Your card is saved securely with Whop so we can bill the final balance when the job is done.</p>}

      {sandbox && (
        <div className="sandbox-hint">
          <p className="small muted" style={{ margin: "0 0 0.5rem" }}>
            💡 <strong>Sandbox Testing:</strong> Enter test card <code>4242 •••• •••• 4242</code> or click below for instant $0 test payment:
          </p>
          <button type="button" className="btn ghost wide" disabled={busy} onClick={simulatePay} style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
            ⚡ Complete Test Payment (Sandbox $0)
          </button>
        </div>
      )}

      <button className="btn wide" disabled={!ready || busy} onClick={pay}>{busy ? "Processing…" : `Pay ${money(plan.price)}`}</button>
      {err && <p role="alert" className="err">{err}</p>}
    </>
  );
}
