/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#002244',
        secondary: '#FB4F14',
        accent: '#ffffff',
        surface: {
          DEFAULT: '#0a1628',
          light: '#132038',
          card: '#1a2d4a',
        },
        text: {
          primary: '#f0f4f8',
          secondary: '#94a3b8',
        },
      },
    },
  },
  plugins: [],
};
