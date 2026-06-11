import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://brace-concept.pages.dev',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
});
