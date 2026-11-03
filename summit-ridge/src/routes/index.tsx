import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { site, type PlanKey } from "../site.config";
import { CheckoutPanel } from "../components/CheckoutPanel";
import { EstimateForm } from "../components/EstimateForm";
import { ServiceCard } from "../components/ServiceCard";
import { DebugPanel } from "../components/DebugPanel";
import "../styles.css";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [buy, setBuy] = useState<PlanKey | null>(null);
  const b = site.brand;
  useEffect(() => { document.documentElement.style.setProperty("--accent", b.accent); document.title = `${b.name} — Roofing`; }, [b]);

  return (
    <>
      <header className="bar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <strong>{b.name}</strong>
          <span style={{ fontSize: "0.75rem", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 }}>
            🧪 Sandbox Ready
          </span>
        </div>
        <a className="btn sm" href={`tel:${b.phone.replace(/\D/g, "")}`}>{b.phone}</a>
      </header>

      <section className="hero"><div className="wrap">
        <h1>{site.hero.headline}</h1><p>{site.hero.sub}</p>
        <div className="row"><a className="btn" href="#estimate">Request an Estimate</a><button className="btn ghost" onClick={() => setBuy("inspection")}>Book inspection — ${site.plans.inspection.price}</button></div>
        <p className="small">{b.license}</p>
      </div></section>

      <section className="wrap" id="services"><h2>Services</h2>
        <div className="grid">{site.services.map((s) => <ServiceCard key={s.id} s={s} onBuy={setBuy} />)}</div>
      </section>

      <section className="band"><div className="wrap" id="area"><h2>{site.serviceArea.headline}</h2>
        <ul className="chips">{site.serviceArea.regions.map((r) => <li key={r}>{r}</li>)}</ul><p className="muted">{site.serviceArea.note}</p></div></section>

      <section className="wrap" id="financing"><div className="card callout"><h2>{site.financing.headline}</h2><p>{site.financing.body}</p>
        <button className="btn" onClick={() => setBuy("deposit")}>Reserve with a ${site.plans.deposit.price} deposit</button></div></section>

      <section className="wrap" id="reviews"><h2>★ {site.reviews.rating} · {site.reviews.count} reviews</h2>
        <div className="grid">{site.reviews.items.map((r) => <blockquote className="card" key={r.name}><p>{r.text}</p><footer className="muted">— {r.name}{r.sample ? " (sample)" : ""}</footer></blockquote>)}</div></section>

      <section className="wrap" id="estimate"><h2>Request a free estimate</h2><EstimateForm /></section>

      <footer className="foot wrap"><p>{b.name} · <a href={`tel:${b.phone.replace(/\D/g, "")}`}>{b.phone}</a> · <a href={`mailto:${b.email}`}>{b.email}</a></p></footer>

      {buy && <CheckoutPanel planKey={buy} onClose={() => setBuy(null)} />}
      <DebugPanel />
    </>
  );
}
