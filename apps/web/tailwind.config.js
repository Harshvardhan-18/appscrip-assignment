/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border, 240 3.7% 15.9%))',
        background: 'hsl(var(--background, 240 10% 3.9%))',
        foreground: 'hsl(var(--foreground, 0 0% 98%))',
        muted: {
          DEFAULT: 'hsl(var(--muted, 240 3.7% 15.9%))',
          foreground: 'hsl(var(--muted-foreground, 240 5% 64.9%))',
        },
        card: {
          DEFAULT: 'hsl(var(--card, 240 10% 3.9%))',
          foreground: 'hsl(var(--card-foreground, 0 0% 98%))',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
