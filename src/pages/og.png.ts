import type { APIRoute } from 'astro';
import { generateOpenGraphImage } from 'astro-og-canvas';

// OG image statică pentru BRACE — culori brand, Playfair pentru titlu.
// Fonturi locale (.ttf) ca să nu depindem de rețea la build.
export const GET: APIRoute = async () => {
  const png = await generateOpenGraphImage({
    title: 'BRACE Trattoria',
    description: 'Cucina italiana · la grătar pe jar · Brașov',
    dir: 'ltr',
    bgGradient: [
      [42, 35, 32],
      [28, 23, 20],
    ],
    border: { color: [181, 83, 42], width: 8, side: 'inline-start' },
    padding: 70,
    font: {
      title: {
        color: [244, 236, 225],
        size: 76,
        weight: 'Bold',
        families: ['Playfair Display'],
        lineHeight: 1.1,
      },
      description: {
        color: [217, 122, 52],
        size: 34,
        families: ['Inter'],
        lineHeight: 1.4,
      },
    },
    fonts: ['./src/assets/og/PlayfairDisplay.ttf', './src/assets/og/Inter.ttf'],
    format: 'PNG',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
