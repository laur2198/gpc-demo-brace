import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis = null;
let tickerFn = null;

function init() {
  if (reduce || lenis) return;

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);

  tickerFn = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(tickerFn);
  gsap.ticker.lagSmoothing(0);

  document.documentElement.classList.add('lenis');
}

function destroy() {
  if (tickerFn) {
    gsap.ticker.remove(tickerFn);
    tickerFn = null;
  }
  lenis?.destroy();
  lenis = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  document.documentElement.classList.remove('lenis');
}

// View Transitions lifecycle: re-init la fiecare page-load, cleanup înainte de swap.
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', destroy);
