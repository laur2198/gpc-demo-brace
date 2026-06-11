// Galerie — hover ripple/distortion subtil pe textura imaginii (ogl).
// LAZY: ogl se importă DOAR când prima imagine intră în viewport.
// Fallback: reduced-motion sau WebGL indisponibil → <img> normal + hover CSS scale.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let observer = null;
const instances = [];

function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform vec2 uMouse;
  uniform float uHover;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, uMouse);
    float ripple = sin(d * 22.0 - uHover * 6.0) * 0.012 * uHover * smoothstep(0.55, 0.0, d);
    vec2 dir = normalize(vUv - uMouse + 0.0001);
    vec2 uv = vUv + dir * ripple;
    gl_FragColor = texture2D(tMap, uv);
  }
`;

async function init() {
  if (reduce || !webglSupported()) return;

  const grid = document.querySelector('[data-gallery]');
  if (!grid) return;

  const figures = [...grid.querySelectorAll('[data-gallery-item]')].filter((f) =>
    f.querySelector('img[data-gallery-img]')
  );
  if (!figures.length) return; // doar placeholdere → lasă fallback CSS

  observer = new IntersectionObserver(
    async (entries, obs) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      observer = null;

      const { Renderer, Program, Mesh, Triangle, Texture } = await import('ogl');

      for (const fig of figures) {
        const img = fig.querySelector('img[data-gallery-img]');
        try {
          setupFigure({ Renderer, Program, Mesh, Triangle, Texture }, fig, img);
        } catch {
          /* lasă img-ul vizibil ca fallback */
        }
      }
    },
    { rootMargin: '200px' }
  );
  observer.observe(grid);
}

function setupFigure(ogl, fig, img) {
  const { Renderer, Program, Mesh, Triangle, Texture } = ogl;

  const renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
  const gl = renderer.gl;
  const canvas = gl.canvas;
  canvas.classList.add('absolute', 'inset-0', 'h-full', 'w-full', 'object-cover');
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity .3s';

  const texture = new Texture(gl, { generateMipmaps: false });
  const setTex = () => {
    texture.image = img;
  };
  if (img.complete) setTex();
  else img.addEventListener('load', setTex, { once: true });

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      tMap: { value: texture },
      uMouse: { value: [0.5, 0.5] },
      uHover: { value: 0 },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const resize = () => {
    const r = fig.getBoundingClientRect();
    renderer.setSize(r.width, r.height);
  };
  resize();
  fig.appendChild(canvas);

  let raf = null;
  let target = 0;
  const draw = () => {
    const u = program.uniforms.uHover;
    u.value += (target - u.value) * 0.08;
    renderer.render({ scene: mesh });
    if (Math.abs(target - u.value) > 0.001 || target > 0) {
      raf = requestAnimationFrame(draw);
    } else {
      raf = null;
      canvas.style.opacity = '0';
    }
  };
  const start = () => {
    if (!raf) raf = requestAnimationFrame(draw);
  };

  const onEnter = () => {
    target = 1;
    canvas.style.opacity = '1';
    start();
  };
  const onLeave = () => {
    target = 0;
    start();
  };
  const onMove = (e) => {
    const r = fig.getBoundingClientRect();
    program.uniforms.uMouse.value = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
  };

  fig.addEventListener('pointerenter', onEnter);
  fig.addEventListener('pointerleave', onLeave);
  fig.addEventListener('pointermove', onMove);
  const ro = new ResizeObserver(resize);
  ro.observe(fig);

  instances.push({
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      fig.removeEventListener('pointerenter', onEnter);
      fig.removeEventListener('pointerleave', onLeave);
      fig.removeEventListener('pointermove', onMove);
      canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  });
}

function destroy() {
  observer?.disconnect();
  observer = null;
  while (instances.length) instances.pop().destroy();
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', destroy);
