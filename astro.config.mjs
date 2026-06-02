// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  site: 'https://mreadie.github.io',
  base: '/events-tracker',
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  }
});
