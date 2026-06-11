// Reveal-uri scroll: SplitText pe headline-uri, fade/translate generic,
// parallax hero, scrub pe blocurile din Povestea.
// Guard: prefers-reduced-motion → totul vizibil, GSAP NU rulează.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let ctx = null;
const splits = [];

function init() {
  if (reduce) return; // elementele sunt deja vizibile by default

  ctx = gsap.context(() => {
    // 1. SplitText pe headline-uri [data-split] — reveal pe cuvinte, stagger
    document.querySelectorAll('[data-split]').forEach((el) => {
      const split = new SplitText(el, { type: 'words', wordsClass: 'split-word' });
      splits.push(split);
      gsap.set(el, { visibility: 'visible' });
      gsap.from(split.words, {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.04,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    // 2. Reveal generic [data-reveal] — fade + y, în batch
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08, overwrite: true }
        ),
    });
    // stare inițială ca să nu pâlpâie înainte de trigger
    gsap.set('[data-reveal]', { opacity: 0, y: 24 });

    // 3. Hero parallax — media se mișcă mai lent decât scroll-ul
    const heroMedia = document.querySelector('[data-hero-media]');
    if (heroMedia) {
      gsap.to(heroMedia, {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: heroMedia, start: 'top 20%', end: 'bottom top', scrub: true },
      });
    }

    // 4. Povestea — blocurile intră pe scrub
    document.querySelectorAll('[data-story-block]').forEach((block) => {
      gsap.from(block, {
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: block, start: 'top 80%', end: 'top 45%', scrub: true },
      });
    });

    ScrollTrigger.refresh();
  });
}

function destroy() {
  splits.forEach((s) => s.revert());
  splits.length = 0;
  ctx?.revert();
  ctx = null;
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', destroy);
