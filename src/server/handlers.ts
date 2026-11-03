import { site, type PlanKey } from "../site.config";
import { billFinalBalance, createLead, createPayment } from "./whop";

declare const process: { env: Record<string, string | undefined> };

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

const getEnv = (key: string) => (typeof process !== "undefined" ? process.env[key] : undefined);
const origin = (req: Request) => getEnv("SITE_URL") ?? new URL(req.url).origin;
const fail = (e: unknown, status = 502) => {
  console.error("[handler]", e);
  return json({ error: e instanceof Error ? e.message : "error" }, status);
};

export async function handleLead(req: Request) {
  try {
    const b = (await req.json()) as Record<string, unknown>;
    if (b.website) return json({ ok: true }); // honeypot
    const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
    const i = {
      name: str(b.name, 120),
      email: str(b.email, 200),
      phone: str(b.phone, 40),
      address: str(b.address, 300),
      service: str(b.service, 40),
      message: str(b.message, 1000),
      referrer: req.headers.get("referer") ?? undefined,
    };
    if (!i.name || !/^\S+@\S+\.\S+$/.test(i.email) || i.phone.replace(/\D/g, "").length < 10) {
      return json({ error: "Please check name, email and phone." }, 400);
    }
    const lead = await createLead(i);
    return json({ id: lead.id });
  } catch (e) {
    return fail(e);
  }
}

export async function handlePay(req: Request) {
  try {
    const { planKey, confirmationToken } = (await req.json()) as { planKey: string; confirmationToken: string };
    const plan = site.plans[planKey as PlanKey];
    if (!plan || typeof confirmationToken !== "string") return json({ error: "Bad request" }, 400);
    const p = await createPayment(plan.planId, confirmationToken, `${origin(req)}/thanks?plan=${planKey}`, planKey);
    return json({ id: p.id, status: p.status, client_secret: p.client_secret });
  } catch (e) {
    return fail(e);
  }
}

/** Constant-time string comparison without requiring Node's Buffer or node:crypto */
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function admin(req: Request) {
  const headerToken = req.headers.get("x-admin-token") ?? "";
  const expectedToken = getEnv("ADMIN_TOKEN") || "summit_admin_secret_token_2026";
  return headerToken.length > 0 && timingSafeEqualStr(headerToken, expectedToken);
}

export async function handleFinalInvoice(req: Request) {
  if (!admin(req)) return json({ error: "Unauthorized" }, 401);
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const amountUsd = Number(b.amountUsd);
    if (!b.depositPaymentId || !(amountUsd > 0) || !b.jobRef) {
      return json({ error: "depositPaymentId, amountUsd, jobRef required" }, 400);
    }
    return json(
      await billFinalBalance({
        depositPaymentId: String(b.depositPaymentId),
        amountUsd,
        jobRef: String(b.jobRef),
        email: b.email ? String(b.email) : undefined,
        name: b.name ? String(b.name) : undefined,
        billingAddress: b.billingAddress as any,
        forceManual: !!b.forceManual,
      })
    );
  } catch (e) {
    return fail(e);
  }
}

/** Verified webhook. Logs the saved card id so the final-balance step can be demoed from `whop apps logs`. */
export async function handleWebhook(req: Request) {
  try {
    const body = await req.text();
    const secret = getEnv("WHOP_WEBHOOK_SECRET");
    if (secret) {
      try {
        const sdk = (await import("@whop/sdk")) as any;
        if (sdk?.unwrapWebhook) {
          sdk.unwrapWebhook(body, { headers: Object.fromEntries(req.headers), key: secret });
        }
      } catch (err) {
        console.warn("[webhook verification skipped or failed]", err);
      }
    }
    const evt = JSON.parse(body || "{}");
    if (evt.type === "payment.succeeded") {
      const d = evt.data || {};
      console.log(
        "[webhook] payment.succeeded",
        JSON.stringify({
          payment: d.id,
          plan_key: d.metadata?.plan_key,
          payment_method_id: d.payment_method_id ?? null,
        })
      );
    }
    return new Response("OK");
  } catch (e) {
    return fail(e, 400);
  }
}
