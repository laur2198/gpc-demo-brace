// Singurul script de motion: reveal pe scroll via IntersectionObserver.
// reduced-motion → totul vizibil instant, fără observer.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function setup() {
  const els = document.querySelectorAll('[data-reveal]:not(.in)');
  if (reduce) {
    els.forEach((e) => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  els.forEach((e) => io.observe(e));
}

document.addEventListener('astro:page-load', setup);
