# plan.md — BRACE, Trattoria (multi-page demo)

> **Pentru Claude Code.** Plan integral de build, multi-page. Execută-l fază cu fază.
> Oprește-te la fiecare `CHECKPOINT` și așteaptă confirmare umană înainte să continui.
> Nu adăuga librării, pagini sau secțiuni care nu sunt aici fără să întrebi.

---

## 0. CONTEXT & CONSTRÂNGERI

**Ce construim:** site de prezentare **multi-page** pentru o trattoria fictivă, **BRACE** (it. „jar/grătar") — cucina italiana cu accent pe grătar pe jar și cuptor cu lemne. Piesă de portofoliu pentru o agenție de marketing. Brand fictiv, proiect concept.

**Reguli dure (non-negociabile):**
- **RO-only.** Conținut în română cu diacritice corecte (ă â î ș ț). Numele preparatelor rămân în italiană, descrierile în română.
- **noindex,nofollow.**
- **5 pagini:** Acasă · Meniu · Povestea · Galerie · Rezervări.
- **Perf budget (tier mid):** LCP < 2.5s, CLS < 0.05, JS livrat < 90kb gzip. Lighthouse mobil ≥ 90 Performance / 100 Accessibility.
- **`prefers-reduced-motion: reduce`** taie TOATE animațiile JS (GSAP, Lenis, WebGL) + tranzițiile CSS. Lenis nu se inițializează deloc. Obligatoriu.
- **WebGL + Lottie lazy** — încărcate doar la nevoie, niciodată în bundle-ul inițial.
- **Mobile-first**, testat la 380px întâi.

**Stack:** Astro 5 + Tailwind v4 (`@tailwindcss/vite`) + `@fontsource` + `gsap` + `lenis` + `ogl` + astro-og-canvas. Node 22 LTS.

**Motion stack (unde se duce fiecare):**
- **Astro View Transitions** (`<ClientRouter />`) — tranziții între pagini + nav/footer persistent + shared-element pe imagini preparate. *Vedeta site-ului.*
- **Lenis** — smooth scroll site-wide, cuplat la GSAP ticker.
- **GSAP ScrollTrigger** — parallax hero, reveal secțiuni, pin/scrub pe „Povestea".
- **GSAP SplitText** — reveal pe caractere/cuvinte pe headline-urile Playfair.
- **WebGL hover-distortion (ogl)** — DOAR pe imaginile din Galerie.

---

## 1. SETUP PROIECT  *(Faza 1)*

```bash
npm create astro@latest . -- --template minimal --no-install --no-git --typescript strict
npm install
npx astro add tailwind --yes
npm install @fontsource/playfair-display @fontsource-variable/inter
npm install gsap lenis ogl
npm install astro-og-canvas canvaskit-wasm
```

**`astro.config.mjs`:**
```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://brace-concept.pages.dev',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
});
```

**Structură țintă:**
```
src/
  layouts/Base.astro            # ClientRouter, head, nav, footer, init Lenis+GSAP
  components/
    Nav.astro  Footer.astro  ConceptBanner.astro
    Hero.astro  SignatureDishes.astro  StorySnippet.astro
    Atmosphere.astro  ReservationCTA.astro  Testimonial.astro  HoursLocation.astro
    MenuNav.astro  MenuCategory.astro  MenuItem.astro
    StoryBlock.astro  GalleryGrid.astro
    ReservationForm.astro
  scripts/
    smooth.js          # init Lenis + cuplare GSAP ticker, guard reduced-motion
    reveal.js          # GSAP ScrollTrigger reveals + SplitText
    gallery-webgl.js   # ogl hover distortion, lazy
  styles/global.css
  pages/
    index.astro  meniu.astro  povestea.astro  galerie.astro  rezervari.astro
    og.ts
public/
  images/  favicon.svg  _headers  robots.txt
```

---

## 2. BRAND TOKENS & TYPE  *(Faza 1)*

**`src/styles/global.css`:**
```css
@import "tailwindcss";
@import "@fontsource/playfair-display/400.css";
@import "@fontsource/playfair-display/500.css";
@import "@fontsource/playfair-display/600.css";
@import "@fontsource-variable/inter";

:root {
  --charcoal: #2A2320;   /* charcoal ars — base dark, text */
  --terracotta: #B5532A; /* accent cald — CTA, highlights */
  --cream: #F4ECE1;      /* cream cald — base light */
  --sage: #7C8466;       /* verde mut — accent secundar */
  --ember: #D97A34;      /* jar/flacără — micro-accente */
  --ink: #1C1714;
}

@theme {
  --color-charcoal: var(--charcoal);
  --color-terracotta: var(--terracotta);
  --color-cream: var(--cream);
  --color-sage: var(--sage);
  --color-ember: var(--ember);
  --color-ink: var(--ink);
  --font-display: "Playfair Display", serif;
  --font-body: "Inter Variable", sans-serif;
}

html { background: var(--cream); color: var(--ink); }
body { font-family: var(--font-body); }
h1,h2,h3 { font-family: var(--font-display); }

.h1 { font-size: clamp(2.75rem, 7vw, 5rem); line-height: 1.02; letter-spacing: -0.02em; }
.h2 { font-size: clamp(2rem, 4.5vw, 3.25rem); line-height: 1.08; }
.lead { font-size: 1.0625rem; line-height: 1.7; }

/* Lenis */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

**Logo:** wordmark „BRACE" în Playfair, letterpress feel; mark = mic semn de scânteie/flacără (3 linii ascendente) lângă literă. SVG inline în `Logo.astro`. Favicon: monogram „B" pe charcoal, flacără ember, `public/favicon.svg`.

---

## 3. LAYOUT DE BAZĂ + MOTION SCAFFOLD  *(Faza 1)*

**`Base.astro`:**
- `<html lang="ro">`, `<meta name="robots" content="noindex, nofollow">`
- `<ClientRouter />` din `astro:transitions` în `<head>`
- Nav + Footer cu `transition:persist` (rămân între pagini)
- import `global.css`, preload Playfair 500
- OG tags (per pagină, prop `title`/`description`)
- JSON-LD `Restaurant` (vezi Faza 8)
- la final: `<script>` care importă `smooth.js` (init Lenis + GSAP)

**`scripts/smooth.js`** (init unic, re-rulează la `astro:page-load` pentru View Transitions):
```js
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis;

function init() {
  if (reduce) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function destroy() { lenis?.destroy(); ScrollTrigger.getAll().forEach(t => t.kill()); }

document.addEventListener('astro:page-load', () => { init(); /* + reveal.js init */ });
document.addEventListener('astro:before-swap', destroy);
```
> IMPORTANT: cu View Transitions, motion-ul se RE-inițializează la fiecare `astro:page-load` și se curăță la `astro:before-swap`. Altfel ScrollTrigger se dublează între pagini. Respectă pattern-ul ăsta în toate scripturile de motion.

---

## ⛔ CHECKPOINT 1 — STOP după Faza 1
Construiește: setup + tokens + logo + Base + Nav + Footer + ClientRouter + Lenis/GSAP scaffold + Hero de pe Acasă (vezi copy Faza 4).
Verifică: smooth scroll merge, nav persistă, reduced-motion dezactivează Lenis. **Raportează și oprește.** Așteaptă „continuă".

---

## 4. CONȚINUT — COPY RO COMPLET

> Folosește EXACT textul. Numele preparatelor rămân în italiană.

### PAGINA: ACASĂ (`index.astro`)  *(Faza 2)*

**Hero**
- Eyebrow: `CUCINA ITALIANA · LA GRĂTAR PE JAR · BRAȘOV`
- H1: **Gust adevărat, copt pe foc.**
- Sub: *Paste făcute în casă, carne pe jar și pizza din cuptor cu lemne. Rețete italiene, fără scurtături.*
- CTA primar: `Rezervă o masă` (→ /rezervari/) · secundar: `Vezi meniul` (→ /meniu/)
- Imagine: `hero.avif` (food moody, foc/grătar)

**Preparate semnătură** (3 carduri, link spre meniu)
1. **Tagliata di manzo** — *Vită maturată, friptă pe jar, rucola, parmezan, ulei de trufe.*
2. **Pizza alla Brace** — *Cuptor cu lemne, blat copt 48h, mozzarella di bufala.*
3. **Tagliatelle al ragù** — *Paste proaspete, ragù gătit 6 ore, parmezan reggiano.*

**Povestea (snippet, link spre /povestea/)**
- Titlu: **Focul e la mijloc.**
- Text: *La BRACE totul pleacă de la jar. Gătim simplu, cu ingrediente bune și răbdare — așa cum se face în trattoriile din care ne-am inspirat. Fără congelat, fără semipreparate, fără grabă.*
- Link: `Citește povestea →`

**Atmosfera** (bandă vizuală + text scurt)
- *Lemn, lumină caldă și miros de fum bun. Un loc în care stai mai mult decât ai planificat.*

**Testimonial**
- *„Cea mai bună paste din oraș, fără discuție. Te simți ca într-o trattoria din Toscana."* — **Andrei P.**

**CTA rezervare** (bandă terracotta)
- **Locurile bune se ocupă repede.** + buton `Rezervă o masă`

**Ore & locație** (preview, detalii pe /rezervari/)
- `Mar–Dum · 12:00–23:00 · Luni închis` · `Str. Mureșenilor 8, Brașov`

---

### PAGINA: MENIU (`meniu.astro`)  *(Faza 3)*
Sticky `MenuNav` cu ancore pe categorii. Prețuri în lei.

**ANTIPASTI**
- **Bruschette al pomodoro** — roșii, busuioc, usturoi, ulei extravirgin — *24 lei*
- **Tagliere di salumi e formaggi** — selecție mezeluri și brânzeturi italiene — *68 lei*
- **Burrata e pomodorini** — burrata cremoasă, roșii confiate, pesto — *42 lei*

**PRIMI**
- **Tagliatelle al ragù** — paste proaspete, ragù de vită gătit lent — *46 lei*
- **Cacio e pepe** — pecorino romano, piper negru, paste tonnarelli — *38 lei*
- **Gnocchi al pesto** — gnocchi de casă, pesto genovese — *40 lei*
- **Risotto ai funghi** — orez carnaroli, ciuperci de pădure, parmezan — *48 lei*

**DALLA BRACE** *(de la grătar pe jar)*
- **Tagliata di manzo** — vită maturată, rucola, parmezan, trufe — *92 lei*
- **Pollo alla brace** — pui marinat, copt pe jar, lămâie, rozmarin — *54 lei*
- **Branzino al forno** — biban de mare întreg, ierburi, lămâie — *78 lei*

**PIZZA** *(cuptor cu lemne)*
- **Margherita** — roșii San Marzano, mozzarella di bufala, busuioc — *38 lei*
- **Diavola** — salam picant, mozzarella, ardei iute — *44 lei*
- **Quattro formaggi** — patru brânzeturi, miere — *46 lei*
- **Prosciutto e funghi** — prosciutto cotto, ciuperci — *44 lei*

**DOLCI**
- **Tiramisù** — rețeta casei, mascarpone, espresso — *28 lei*
- **Panna cotta** — vanilie, coulis de fructe de pădure — *24 lei*
- **Cannoli siciliani** — ricotta, fistic — *26 lei*

**VINI** — *selecție de vinuri italiene la pahar și sticlă. Întreabă personalul pentru recomandarea zilei.*

---

### PAGINA: POVESTEA (`povestea.astro`)  *(Faza 4)*
Layout editorial, story-driven, cu pin/scrub GSAP pe blocuri.

- H1: **Totul pleacă de la foc.**
- **Bloc 1 — Începutul.** *BRACE s-a născut dintr-o obsesie simplă: mâncare italiană făcută cum trebuie, în orașul nostru. Fără compromisuri, fără „merge și așa".*
- **Bloc 2 — Ingredientele.** *Aducem ce e mai bun: făină italiană, roșii San Marzano, mozzarella di bufala, vită maturată. Restul îl face focul și răbdarea.*
- **Bloc 3 — Jarul.** *Grătarul pe jar și cuptorul cu lemne nu sunt decor. Dau gustul ăla afumat, copt, pe care nu-l poți falsifica cu o tigaie.*
- **Bloc 4 — Masa.** *Pentru noi, masa e despre oameni. De-aia facem porții generoase, vin bun și un loc în care nu te grăbește nimeni.*
- CTA final: `Rezervă o masă →`

---

### PAGINA: GALERIE (`galerie.astro`)  *(Faza 5)*
Grid asimetric, 8 imagini, hover WebGL distortion (ogl). Fără text. `gallery-1..8.avif`. Fallback: hover `scale(1.04)` CSS dacă WebGL indisponibil / reduced-motion.

---

### PAGINA: REZERVĂRI (`rezervari.astro`)  *(Faza 6)*
- H1: **Rezervă o masă la BRACE.**
- Sub: *Te așteptăm. Pentru grupuri peste 8 persoane, sună-ne direct.*
- **Formular** (`ReservationForm.astro`): Nume · Telefon · Email · Data · Ora · Nr. persoane · Mesaj (opțional). Buton `Trimite rezervarea`.
  - Action: Formspree placeholder `https://formspree.io/f/PLACEHOLDER` (omul înlocuiește ID-ul). Validare HTML5 + required.
- **Contact lateral:** telefon `0700 000 000` · WhatsApp `wa.me/40700000000` · `Str. Mureșenilor 8, Brașov`
- **Program:** `Marți–Duminică · 12:00–23:00 · Luni închis`
- Hartă: embed placeholder (iframe lazy sau imagine statică cu link Maps — NU încărca Google Maps JS, e overhead + GDPR).

### FOOTER (toate paginile)
Logo + tagline „Cucina italiana · Brașov" + linkuri pagini + program + `© 2026 BRACE Trattoria` + rând mic: `Proiect concept realizat de Green Phoenix Concept.`

### CONCEPT BANNER
`PROIECT CONCEPT · Demonstrație Green Phoenix Concept` — discret, contrast redus.

---

## 5. MOTION SPEC  *(Faza 7 — pass dedicat)*

**`scripts/reveal.js`** (init la `astro:page-load`, kill la `astro:before-swap`):
- **SplitText** pe headline-urile cu `[data-split]` → reveal pe cuvinte cu stagger, la intrare în viewport (ScrollTrigger).
- **Reveal generic** pe `[data-reveal]` → fade + y:24 → 0, stagger pe grupuri.
- **Hero parallax** → imaginea hero se mișcă mai lent decât scroll-ul (ScrollTrigger scrub).
- **Povestea** → blocurile se pin-uiesc scurt și textul intră pe scrub.
- Guard: dacă `prefers-reduced-motion`, `reveal.js` setează totul vizibil și NU rulează GSAP.

**View Transitions:**
- Nav + Footer: `transition:persist`.
- Imaginile preparatelor semnătură (Acasă) și cardurile meniu: `transition:name="dish-{slug}"` ca să morph-uiască între pagini unde se repetă.
- Tranziție default fade pe `<main>`.

**`scripts/gallery-webgl.js`** (ogl, lazy):
- Încarcă DOAR când prima imagine din galerie intră în viewport (dynamic `import()`).
- Efect: hover ripple/distortion subtil pe textura imaginii. Intensitate mică — premium, nu gimmick.
- Fallback: dacă WebGL context eșuează sau reduced-motion → lasă `<img>` normal cu hover CSS scale.

---

## 6. ⛔ CHECKPOINT 2 — STOP după Faza 4
După Acasă + Meniu + Povestea complete (copy real + placeholdere imagine, FĂRĂ motion pass final, FĂRĂ WebGL):
Verifică navigarea între pagini cu View Transitions (nav persistă, tranziție smooth), structura pe mobil. **Raportează și oprește.** Așteaptă „continuă".

---

## 7. MANIFEST ASSET  *(imaginile le furnizează omul — placeholdere până atunci)*

Placeholder = `<div>` gradient charcoal→terracotta cu numele fișierului, la aspect-ratio corect. Swap = înlocuiești fișierul în `public/images/`. Folosește `<Image>`/`<Picture>` Astro cu `format={['avif','webp']}`, hero `eager` + `fetchpriority="high"`, rest `lazy`, width/height explicite.

| Fișier | Pagină | Aspect | Prompt Firefly |
|---|---|---|---|
| `hero.avif` | Acasă | 16:9 | *Moody Italian food photography, steak grilling over glowing embers and flames, dark low-key lighting, warm orange glow, rustic, shallow depth of field, premium editorial, no text* |
| `dish-tagliata.avif` | Acasă/Meniu | 4:3 | *Sliced rare beef tagliata on wooden board, rucola, parmesan shavings, moody warm light, dark background, editorial food* |
| `dish-pizza.avif` | Acasă/Meniu | 4:3 | *Wood-fired Neapolitan pizza margherita, charred crust, fresh basil, rustic dark table, warm moody light, editorial* |
| `dish-pasta.avif` | Acasă/Meniu | 4:3 | *Fresh tagliatelle with ragù, parmesan, twirled on fork, warm low light, dark rustic background, editorial food photography* |
| `atmosphere.avif` | Acasă | 16:9 | *Cozy Italian trattoria interior, warm candlelight, wood and brick, intimate tables, moody atmospheric, no people, editorial* |
| `story.avif` | Povestea | 3:2 | *Chef hands grilling over open fire embers in rustic kitchen, warm glow, dramatic low light, authentic, editorial* |
| `gallery-1..8.avif` | Galerie | mix | *Moody Italian trattoria food and interior set: grilled meats, pasta, wine glasses, marble, wood, candlelight, warm dark tones, cohesive editorial palette, no text* |

> Generează 10-12 pentru galerie, păstrează cele mai coerente 8. Variază: 3 preparate, 2 detaliu (vin/marmură), 2 interior, 1 foc/grătar.

**`og.ts`:** OG image via astro-og-canvas — „BRACE Trattoria", „Cucina italiana · la grătar pe jar", culori brand, Playfair dacă se încarcă.

---

## 8. SEO / HEADERS / NOINDEX  *(Faza 8)*

**`robots.txt`:** `User-agent: *` / `Disallow: /`

**`_headers`:**
```
/*
  X-Robots-Tag: noindex, nofollow
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

**Schema (demonstrativ):** JSON-LD `Restaurant` în Base (name, servesCuisine: Italian, address fictivă, openingHours, priceRange "$$", telephone, menu URL, image, acceptsReservations: true). Pe pagina Meniu, opțional `Menu`/`MenuItem` schema light. Semnal de capabilitate.

---

## 9. FAZE & ORE

| Fază | Conținut | Ore | Checkpoint |
|---|---|---|---|
| 1 | Setup + tokens + logo + Base + Nav/Footer + ClientRouter + Lenis/GSAP scaffold + Hero | 3 | **⛔ CP1** |
| 2 | Pagina Acasă (toate secțiunile) | 5-6 | — |
| 3 | Pagina Meniu (nav sticky + categorii) | 3-4 | — |
| 4 | Pagina Povestea | 3 | **⛔ CP2** |
| 5 | Pagina Galerie + WebGL hover (ogl) | 3-4 | — |
| 6 | Pagina Rezervări + formular | 2 | — |
| 7 | Motion pass (SplitText, ScrollTrigger, parallax, view transitions polish) | 4-5 | **⛔ CP3** |
| 8 | SEO/schema/headers + OG | 1.5 | — |
| 9 | QA + deploy | 2 | **⛔ CP4** |

**Total: 22-32h.**

---

## 10. DEFINITION OF DONE  *(verifică la CP4)*

- [ ] Lighthouse mobil ≥ 90 Performance / 100 Accessibility / 100 Best Practices
- [ ] LCP < 2.5s, CLS < 0.05
- [ ] JS livrat < 90kb gzip (verifică `npm run build` output)
- [ ] View Transitions funcționează pe toate paginile, nav/footer persistă, zero flash
- [ ] ScrollTrigger NU se dublează la navigare (kill pe `before-swap` verificat)
- [ ] `prefers-reduced-motion`: Lenis off, GSAP off, WebGL off, tot vizibil
- [ ] WebGL galerie: lazy, cu fallback CSS funcțional
- [ ] Responsive 380/768/1280 — fără overflow orizontal
- [ ] Diacritice corecte (Playfair + Inter au glyph-urile)
- [ ] noindex în meta + `_headers` + robots.txt
- [ ] Formular rezervări: validare HTML5 + Formspree placeholder marcat clar
- [ ] Imagini AVIF/WebP, hero eager, rest lazy, width/height (zero CLS)
- [ ] Banner concept + atribuire GPC în footer

---

## 11. DEPLOY  *(Faza 9)*

1. `npm run build` — zero erori.
2. Push pe GitHub `gpc-demo-brace`.
3. Cloudflare Pages → repo → build `npm run build`, output `dist`, env `NODE_VERSION=22`.
4. URL `brace-concept.pages.dev`.
5. (Opțional) CNAME `brace.greenpheonixconcept.com` după ce e gata.

---

## ⛔ CHECKPOINT 3 — STOP după motion pass (Faza 7)
Înainte de SEO/deploy: arată site-ul complet cu tot motion-ul. Verifică 60fps pe scroll, fără jank, view transitions fine. **Raportează și oprește.** Apoi Faza 8-9.

## ⛔ CHECKPOINT 4 — STOP înainte de deploy
Rulează DOD complet, raportează Lighthouse. Așteaptă confirmare înainte de push/deploy.
