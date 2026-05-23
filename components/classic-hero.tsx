"use client";

import { useEffect, useRef } from "react";

export function ClassicHero() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    document.documentElement.classList.add("motion-safe");

    const hero = heroRef.current;
    if (!hero) {
      return;
    }

    const heroTargets = [
      hero.querySelector("h1"),
      hero.querySelector(".hero-sub"),
      hero.querySelector(".hero-ctas"),
      hero.querySelector(".hero-proof"),
      hero.querySelector(".trust-line"),
    ].filter(Boolean) as HTMLElement[];

    heroTargets.forEach((el, index) => {
      el.classList.add("hero-reveal");
      el.style.setProperty("--hero-delay", `${index * 110}ms`);
    });

    requestAnimationFrame(() => {
      hero.classList.add("is-hero-ready");
    });
  }, []);

  return (
    <header ref={heroRef} className="hero">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-poster.jpg"
        aria-hidden="true"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      <div className="hero-overlay" />

      <div className="container hero-content">
        <h1>
          Jeder Tisch interaktiv.
          <span className="accent">Jeder Screen Umsatzpotential.</span>
        </h1>
        <p className="hero-sub">
          Eine interaktive Infotainment-Plattform, die Tische, Smartphones und
          TVs in deiner Bar verbindet. Gäste scannen QR-Codes, bestellen,
          voten, spielen. Service und Crew sehen alles im Dashboard. Ohne neue
          App, ohne teure Hardware.
        </p>
        <div className="hero-ctas">
          <a href="#demo" className="btn btn-primary btn-lg">
            Pilot anfragen
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
          <a href="#demo-live" className="btn btn-secondary btn-lg">
            Demo ansehen
          </a>
        </div>
        <ul className="hero-proof" aria-label="Wichtige Vorteile">
          <li>Ohne Hardware-Kauf</li>
          <li>Monatlich kündbar, kein Lock-in</li>
          <li>Pilot in 4 Wochen mit Auswertung</li>
        </ul>

        <p className="trust-line">
          <strong>QR Solutions GmbH</strong> · Hannover · hello@crowd-connect.de
        </p>
      </div>
    </header>
  );
}
