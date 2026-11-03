import { useEffect, useRef } from "react";
import { site, type PlanKey } from "../site.config";
import { trackOnce } from "../lib/track";

type Svc = (typeof site.services)[number];

export function ServiceCard({ s, onBuy }: { s: Svc; onBuy: (k: PlanKey) => void }) {
  const ref = useRef<HTMLElement>(null);
  const plan = site.plans[s.planKey as PlanKey];

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        trackOnce(`svc-${s.id}`, "service_viewed", { service: s.id, event_id: `sv-${s.id}-${Date.now()}` });
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [s.id]);

  return (
    <article ref={ref} className="card" data-whop-product-id={plan.productId} data-whop-variant-id={plan.planId} data-whop-price={plan.price} data-whop-currency="USD">
      <h3>{s.title}</h3>
      <p className="muted">{s.blurb}</p>
      <p className="price">{s.from}</p>
      <button className="btn" onClick={() => onBuy(s.planKey as PlanKey)}>{plan.label} — ${plan.price}</button>
    </article>
  );
}
