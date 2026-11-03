# Summit Ridge Roofing — Production Whop Websites Template

A production-ready website template engineered for US roofing contractors, built on **Whop Websites** (TanStack Start + Cloudflare Workers) and deployed live to Whop hosting.

* **Live URL:** [https://summitridge-us.whop.site](https://summitridge-us.whop.site)
* **Whop App Proxy:** [https://2sexlzp7x1ol1377xk47.apps.whop.com](https://2sexlzp7x1ol1377xk47.apps.whop.com)
* **App ID:** `app_aH4K0noEiryvEO`
* **Account ID:** `biz_uqblPFRvu77KrI` (*Summit Ridge Roofing*)

---

## Pitch Overview: Why Whop for Roofing Contractors

Roofing is a high-ticket vertical ($5,000–$25,000+ per roof replacement) where cash flow, fast quote response, and client financing make or break the business. Traditional processors charge high interchange and provide disjointed invoices. 

This template demonstrates Whop's modern commerce stack end-to-end:
1. **Frictionless Top-of-Funnel**: Instant online booking for a $149 comprehensive inspection, or free quote requests landing directly into Whop Leads.
2. **High-Ticket Deposit Locking**: A $500 project deposit reserves the install date and securely stores the customer's payment method (`off_session`) without PCI scope or custom card inputs.
3. **Automated BNPL Financing**: Whop's Payment Elements automatically surface consumer financing options (Klarna, Affirm, Afterpay, Splitit) for eligible buyers without custom integrations.
4. **Deposit $\rightarrow$ Job Completion $\rightarrow$ Final Balance Invoice**: On job sign-off, the contractor charges the saved card on file or emails a hosted invoice via the Whop Invoices API.
5. **Real-Time Funnel Tracking**: Custom `whop.track` events verify conversion intent at every stage.

---

## Real Whop Plans Configured

| Product / Service | Plan ID | Product ID | Price | Flow / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Roof Inspection** | `plan_TTIKrbI4nTSH0` | `prod_LjTwHTJoI7Jq1` | **$149.00** | Paid diagnostic report. |
| **Project Deposit** | `plan_d2Z8hJtHIth6g` | `prod_QzYTOj9OStKRi` | **$500.00** | Locks job schedule; saves card on file. |
| **Flashing & Vent Boot Repair** | `plan_cH5AzXv64eh6N` | `prod_eeV9YuRd9QfXk` | **$395.00** | Flat-rate emergency repair. |
| **Roofing Job Balance** | *Dynamic* | `prod_yl2yDsDq208if` | Variable | Used by Whop Invoices API for final balance billing. |

---

## 60-Second Re-skinning

The entire site is parameterized inside **`src/site.config.ts`**. To rebrand for any roofing company:
```ts
export const site = {
  whopAccountId: "biz_...", // Target business account ID
  brand: {
    name: "Apex Peak Roofing",
    tagline: "Premier residential & commercial roofing in Austin, TX.",
    phone: "(512) 555-0144",
    email: "contact@apexpeak.example",
    license: "TX Lic. #RC-99201",
    accent: "#0284c7", // Accent color automatically drives CSS theme variables
  },
  plans: {
    inspection: { planId: "plan_...", productId: "prod_...", price: 149, ... },
    deposit: { planId: "plan_...", productId: "prod_...", price: 500, saveCard: true },
    flatRate: { planId: "plan_...", productId: "prod_...", price: 395, ... },
  },
  invoice: { productId: "prod_...", dueInDays: 7 },
  services: [ ... ],
  serviceArea: { headline: "...", regions: [ ... ] },
};
```
Zero HTML, route, or server modifications are required to switch clients.

---

## Whop Feature Implementation Guide

### 1. Whop Payment Elements & Express Checkout
Located in `src/components/CheckoutPanel.tsx`:
* `<ExpressCheckoutElement />`: Provides one-touch Apple Pay and Google Pay via `<Checkout>`.
* `<PaymentElement />`: Hosted credit card, debit card, and financing payment method tiles via `<Payments>`.
* `<BrandingElement />`: Required Whop merchant-of-record disclosure and buyer terms of service.
* `<EmailElement />`: Captures receipt and billing email.
* `setupFutureUsage: "off_session"`: Saves the card on file for deposit checkouts.

### 2. Whop Leads API (`POST /leads`)
Located in `src/components/EstimateForm.tsx` $\rightarrow$ `src/routes/api/lead.ts` $\rightarrow$ `src/server/whop.ts`:
* Homeowners submit estimate requests with address, service required, and problem description.
* Server securely calls Whop's `/leads` endpoint with `account_id`, `product_id`, and metadata.
* Fires custom `estimate_requested` and `lead` pixel events.

### 3. Whop Invoices API (`POST /invoices`)
Located in `src/routes/api/admin/invoice.ts` $\rightarrow$ `src/server/whop.ts`:
```bash
curl -X POST https://summitridge-us.whop.site/api/admin/invoice \
  -H "x-admin-token: summit_admin_secret_token_2026" \
  -H "Content-Type: application/json" \
  -d '{
    "depositPaymentId": "pay_test_dep",
    "amountUsd": 1850,
    "jobRef": "JOB-1044",
    "email": "customer@example.com",
    "name": "Jane Customer",
    "forceManual": true
  }'
```
* **Auto-charge mode**: If `depositPaymentId` references a completed deposit, the server fetches the stored `payment_method_id` and auto-charges the card via `/invoices/{id}/issue`.
* **Manual invoice mode**: If `forceManual: true` or no saved card exists, the server calls `/invoices/{id}/send` and returns the hosted Whop checkout link (`https://whop.com/checkout/pay_...`).

### 4. Custom Pixel Tracking (`whop.track`)
Located in `src/lib/track.ts`:
* `service_viewed`: Automatically emitted by `IntersectionObserver` when each service card enters view.
* `deposit_started`: Emitted when the deposit checkout modal opens.
* `estimate_requested`: Emitted upon estimate submission.
* **Live On-Screen Verification**: Visit `https://summitridge-us.whop.site/?debug=1` to see the live `whop.track` event monitor HUD.

---

## Local Development & Deployment

```bash
# Authenticate CLI
whop login

# Start local dev server (auto-mints dev tokens for SDK calls)
cd summit-ridge
whop apps dev

# Build and deploy to production
whop apps deploy
```

---

## 3–5 Minute Screen Recording Script

1. **Overview & Mobile Responsiveness (0:00 – 1:00)**:
   * Navigate to `https://summitridge-us.whop.site/?debug=1`.
   * Show hero headline, call CTA, services grid, service area tags, financing section, reviews, and estimate form.
   * Toggle mobile emulation in browser DevTools to demonstrate responsive layouts.
   * Observe `service_viewed` events appearing in the floating debug monitor as you scroll.
2. **Whop Elements Checkout (1:00 – 2:15)**:
   * Click **"Reserve with a $500 deposit"**.
   * Demonstrate `ExpressCheckoutElement` (Apple Pay / Google Pay).
   * Demonstrate `PaymentElement` and note the required `BrandingElement`.
   * Highlight the card-on-file notice explaining off-session balance billing.
   * Verify the `deposit_started` pixel event in the debug monitor.
3. **Estimate Form $\rightarrow$ Whop Leads API (2:15 – 3:15)**:
   * Fill out the estimate request form with homeowner information.
   * Click **"Request an Estimate"** and view the success screen.
   * Point out the `estimate_requested` and `lead` events logged in the debug monitor.
4. **Final Balance Invoice Creation (3:15 – 4:00)**:
   * Run the admin invoice cURL in terminal or Postman.
   * Display the JSON response containing the generated invoice ID, invoice number, and direct checkout link.
