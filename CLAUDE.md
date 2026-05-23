# crowd-connect-website

Next.js marketing site for Crowd.Connect — a B2B SaaS platform for bar/venue operators in Germany. Uses App Router, TypeScript, Tailwind CSS, shadcn-style `components/ui`, and framer-motion scroll hero.

## Commands

```bash
npm run dev      # Next.js dev server (port 3000)
npm run build    # Production build
npm start        # Production server
npm run legacy   # Old Express static server (pre-migration)
```

Legacy full single-page site: `/classic.html` (formerly `index.html`).

## Structure

- `app/` — Next.js routes (`page.tsx`, `api/contact/route.ts`)
- `components/ui/` — shadcn-compatible UI primitives (e.g. `container-scroll-animation.tsx`)
- `public/` — static assets, impressum, datenschutz, classic HTML

## Design Context

### Users
Bar and venue operators (Betreiber) in Germany — forward-thinking, early-adopter type managers actively looking for ways to modernize their location. They arrive already sold on the *concept* of interactive bar tech and need to understand the product deeply. They are practical, numbers-driven people who care about Stammkundschaft (regulars), upsell revenue, and compliance (GEMA/GVL). Long sales cycle; they won't convert on impulse.

### Brand Personality
**Three words: Direct. Credible. Alive.**

Operator-first, no fluff. Looks and feels like a serious tool, not a party app. The confidence of a well-made POS system, not the hype of a startup deck. The product lives in nightlife environments but the buyer is making a rational business decision — the brand should honor that tension without losing all energy.

Voice: Dry, precise, bar-operator vernacular (German). The Schichtbuch section is a tone reference for the whole site — editorial directness with real-world specificity.

### Aesthetic Direction
- **Theme**: Dark, but not "neon on black" nightlife kitsch. Think: a quality cocktail bar's printed menu or a German trade magazine — atmospheric but composed.
- **Anti-reference**: Avoids the AI slop palette (cyan-on-dark, purple-to-blue gradients, glassmorphism for decoration, glowing neon accents). Avoids looking like a generic SaaS dashboard or an app store screenshot.
- **Color**: Deep navy base is right. Mint accent needs to feel less "startup" — more like a confident brand choice. Magenta is a strong secondary but risks looking playful rather than operational.
- **Typography**: Chathura is a distinctive display choice with real personality. The Inter + Chathura pairing works. JetBrains Mono used as decorative monospace (section eyebrows, kickers) is an AI-slop pattern to watch — use it more sparingly.
- **Texture**: The editorial long-form section (Schichtbuch) is the standout visual choice — this format gives credibility. More of this, less generic card grids.

### Design Principles
1. **Credibility through specificity** — every visual claim should feel provably real, not decorated. Actual timestamps, real bar scenarios, concrete numbers beat abstract icons and feature lists.
2. **Operator lens, not guest lens** — the buyer sees a dashboard, not a party. Design should feel like you understand what happens at 23:00 on a Friday when service is stretched.
3. **Dark ≠ loud** — atmospheric without neon. Restraint is more premium than glow effects.
4. **Let the copy lead** — the writing is the strongest asset. Design's job is to give it room to breathe and the right typographic weight, not to compete with it.
5. **Trust before delight** — system status, pricing transparency, compliance clarity are more important than animations or decorative motion.
