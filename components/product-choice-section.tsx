import Image from "next/image";

export function ProductChoiceSection() {
  return (
    <section
      id="produktwahl"
      className="product-choice"
      aria-label="Produktauswahl"
    >
      <div className="container">
        <div className="product-choice-head">
          <p className="kicker-mono">Ein System · zwei Einsatzgebiete</p>
          <h2>
            Wofuer brauchst du Crowd
            <span className="brand-middot" aria-hidden="true">
              ·
            </span>
            Connect?
          </h2>
          <p className="product-choice-lead">
            Dieselbe Engine, unterschiedliche Szenarien. Wähle deinen Einsatz.
            Die Mechanik bleibt dieselbe.
          </p>
        </div>

        <div className="product-choice-grid">
          <article
            className="product-choice-card product-choice-card--crowd product-choice-card--active"
            aria-current="page"
          >
            <span className="product-choice-badge">Aktuell</span>
            <div className="product-choice-card-top">
              <Image
                src="/crowd-connect-logo-text-long-white-big.png"
                alt="Crowd·Connect"
                width={380}
                height={82}
                className="product-choice-logo"
              />
            </div>
            <p className="product-choice-audience">
              Bars, Lounges, Restaurants, Eventlocations
            </p>
            <p className="product-choice-desc">
              Interaktive Tische, Drink-to-Table, TV-Games, digitale Speisekarte
              und GEMA-Dokumentation für den laufenden Betrieb.
            </p>
            <a href="#product-preview" className="product-choice-link">
              Details ansehen
              <svg
                width="14"
                height="14"
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
          </article>

          <article className="product-choice-card product-choice-card--wedding">
            <div className="product-choice-card-top">
              <Image
                src="/wedding-connect-logo-text-long-white-big.png"
                alt="Wedding·Connect"
                width={400}
                height={82}
                className="product-choice-logo"
              />
            </div>
            <p className="product-choice-audience">
              Hochzeiten &amp; private Feiern
            </p>
            <p className="product-choice-desc">
              QR am Tisch, Spiele auf dem Handy, große Momente auf der Leinwand.
              Couple-Trivia, Foto-Wall und Leaderboard, ohne App-Download.
            </p>
            <a href="/wedding-connect" className="product-choice-link">
              Konzept entdecken
              <svg
                width="14"
                height="14"
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
          </article>
        </div>
      </div>
    </section>
  );
}
