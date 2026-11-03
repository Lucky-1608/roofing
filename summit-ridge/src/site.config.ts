/**
 * THE ONLY FILE YOU EDIT TO RE-SKIN THIS TEMPLATE FOR A NEW ROOFING COMPANY.
 * Name, services, prices, service area, reviews and Whop IDs all live here.
 * Prices shown on the page are display-only: Whop charges the price stored on the plan_.
 */
export const site = {
  // Public Whop identifiers (safe in client code).
  whopAccountId: "biz_uqblPFRvu77KrI",

  brand: {
    name: "Summit Ridge Roofing",
    tagline: "Honest roofing for homes across the Front Range.",
    phone: "(555) 010-2030",
    email: "hello@summitridge.example",
    license: "Licensed · Bonded · Insured — Lic. #ROC-348291",
    accent: "#c2410c", // drives the whole theme via a CSS variable
  },

  hero: {
    headline: "A roof you can trust, priced before we start.",
    sub: "Book a $149 inspection online, lock in your job with a deposit, and pay the balance only when the work is done.",
  },

  // Each plan maps to a real Whop plan_. `kind` controls checkout behaviour.
  plans: {
    inspection: {
      planId: "plan_TTIKrbI4nTSH0",
      productId: "prod_LjTwHTJoI7Jq1",
      label: "Roof inspection",
      price: 149,
      blurb: "Full roof & attic inspection with a written report and photos.",
      saveCard: false,
    },
    deposit: {
      planId: "plan_d2Z8hJtHIth6g",
      productId: "prod_QzYTOj9OStKRi",
      label: "Project deposit",
      price: 500,
      blurb: "Reserves your install date. Your card is saved so the final balance can be billed on completion.",
      saveCard: true, // Payments handle uses setupFutureUsage: "off_session"
    },
    flatRate: {
      planId: "plan_cH5AzXv64eh6N",
      productId: "prod_eeV9YuRd9QfXk",
      label: "Flashing & vent boot repair",
      price: 395,
      blurb: "Flat-rate fix for the most common leak sources. No surprises.",
      saveCard: false,
    },
  },

  // Product that final-balance invoices are billed against (invoice amount is set per job).
  invoice: { productId: "prod_yl2yDsDq208if", dueInDays: 7 },

  services: [
    { id: "repair", title: "Roof repair", blurb: "Leaks, flashing, storm damage, missing shingles.", from: "From $395", planKey: "flatRate" },
    { id: "replacement", title: "Full replacement", blurb: "Tear-off and re-roof with manufacturer-backed warranties.", from: "Free estimate", planKey: "deposit" },
    { id: "inspection", title: "Inspection", blurb: "Insurance-ready reports, buying/selling a home, post-storm checks.", from: "$149", planKey: "inspection" },
  ],

  serviceArea: {
    headline: "Serving the Front Range",
    regions: ["Denver", "Aurora", "Lakewood", "Arvada", "Boulder", "Littleton", "Centennial", "Highlands Ranch"],
    note: "Not sure if we cover you? Send a request and we'll tell you the same day.",
  },

  financing: {
    headline: "Pay over time at checkout",
    body: "Eligible buyers see financing options such as Klarna, Afterpay and Splitit right in the payment step. Availability depends on the buyer and the amount.",
  },

  // Sample copy only. Replace with real, attributable reviews before showing a client.
  reviews: {
    rating: 4.9,
    count: 128,
    items: [
      { name: "Sample reviewer A", text: "Sample review text — replace with a real customer review.", sample: true },
      { name: "Sample reviewer B", text: "Sample review text — replace with a real customer review.", sample: true },
      { name: "Sample reviewer C", text: "Sample review text — replace with a real customer review.", sample: true },
    ],
  },
} as const;

export type PlanKey = keyof typeof site.plans;
export const planKeys = Object.keys(site.plans) as PlanKey[];
