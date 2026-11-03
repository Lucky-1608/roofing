import { site } from "../site.config";

declare const process: { env: Record<string, string | undefined> };

const getEnv = (key: string) => (typeof process !== "undefined" ? process.env[key] : undefined);
const BASE = getEnv("WHOP_API_BASE") ?? "https://api.whop.com/api/v1";
// Prefer a company API key stored as an app secret; fall back to the key the runtime injects.
const key = () => getEnv("WHOP_COMPANY_API_KEY") ?? getEnv("WHOP_API_KEY") ?? "";

export async function whop<T = any>(method: string, path: string, body?: unknown, idem?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key()}`,
      "Api-Version-Date": "2026-10-24", // required for the native invoices API
      "Content-Type": "application/json",
      ...(idem ? { "Idempotency-Key": idem } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${data?.error?.type ?? res.status}: ${data?.error?.message ?? "Whop API error"}`);
  return data as T;
}

/** Standard UUID v4 generation compatible with Web Crypto and Node */
export const getUUID = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

/** Deterministic hash for idempotency keys without external crypto modules */
export const stableKey = (s: string): string => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, "0");
};

/** Estimate request -> Whop Lead. Contact details travel in metadata. */
export async function createLead(i: {
  name: string; email: string; phone: string; address: string; service: string; message: string; referrer?: string; user_id?: string;
}) {
  const productId = (site.plans as any)[i.service]?.productId; // optional: ties lead to a product when the service maps to one
  return whop<{ id: string }>(
    "POST",
    "/leads",
    {
      account_id: site.whopAccountId,
      product_id: productId,
      user_id: i.user_id || "user_6YxoHJksZKOs1",
      referrer: i.referrer,
      metadata: {
        source: "estimate_form", name: i.name, email: i.email, phone: i.phone,
        address: i.address, service: i.service, message: i.message.slice(0, 500),
      },
    },
    getUUID(),
  );
}

/** Deposit/inspection/flat-rate charge from a confirmation token. Amounts come from the plan, never the client. */
export async function createPayment(planId: string, confirmationToken: string, returnUrl: string, planKey: string) {
  return whop<{ id: string; status: string; client_secret?: string }>(
    "POST",
    "/payments",
    { account_id: site.whopAccountId, variant_id: planId, confirmation_token: confirmationToken, return_url: returnUrl, metadata: { plan_key: planKey } },
    stableKey(confirmationToken), // a double-click can't double charge
  );
}

/**
 * Final balance. If the deposit left a saved card, issue the invoice (Whop charges it off session).
 * Otherwise send it, and the customer pays on Whop's hosted checkout.
 */
export async function billFinalBalance(i: {
  depositPaymentId: string; amountUsd: number; jobRef: string; email?: string; name?: string;
  billingAddress?: { line1: string; city: string; state: string; postal_code: string; country: string };
  forceManual?: boolean;
}) {
  let paymentMethodId: string | undefined;
  let memberId: string | undefined;
  let email: string | undefined = i.email;

  if (i.depositPaymentId && i.depositPaymentId.startsWith("pay_")) {
    try {
      const dep = await whop<any>("GET", `/payments/${i.depositPaymentId}`);
      paymentMethodId = dep.payment_method_id ?? undefined;
      memberId = dep.member_id ?? dep.member?.id;
      email = email ?? dep.customer_email ?? dep.email_address;
    } catch (e) {
      console.warn("Could not fetch deposit payment:", e);
    }
  }
  const auto = !!paymentMethodId && !i.forceManual;

  const draft = await whop<any>(
    "POST",
    "/invoices",
    {
      account_id: site.whopAccountId,
      ...(memberId ? { member_id: memberId } : { email_address: email || "customer@example.com", customer_name: i.name || "Customer" }),
      items: [{ quantity: 1, variant: { product_id: site.invoice.productId, billing_type: "one_time", initial_price: i.amountUsd, currency: "usd" } }],
      due_at: new Date(Date.now() + site.invoice.dueInDays * 864e5).toISOString(),
      ...(i.billingAddress ? { billing_address: i.billingAddress } : {}),
      ...(auto ? { payment_method_id: paymentMethodId } : {}),
      metadata: { job_ref: i.jobRef, deposit_payment_id: i.depositPaymentId },
    },
    stableKey(`inv:${i.jobRef}:${i.depositPaymentId || Date.now()}`),
  );

  let status = "draft";
  let payUrl: string | undefined = draft.checkout_link || (draft.id ? `https://whop.com/checkout/${draft.id}` : undefined);

  try {
    const done = await whop<any>("POST", `/invoices/${draft.id}/${auto ? "issue" : "send"}`, undefined, stableKey(`inv-go:${draft.id}`));
    status = done.status || "sent";
    if (done.checkout_link) payUrl = done.checkout_link;
  } catch (e: any) {
    console.warn("[invoice]", e.message);
    status = `draft (${e.message.includes("verification") ? "verification needed for live send" : e.message})`;
  }

  return { invoiceId: draft.id, number: draft.number, status, collection: auto ? "auto_charge_saved_card" : "sent_for_manual_payment", payUrl };
}
