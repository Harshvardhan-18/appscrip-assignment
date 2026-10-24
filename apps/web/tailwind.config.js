/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        hairline: 'var(--hairline)',
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          soft: 'var(--brand-soft)',
        },
        status: {
          critical: 'var(--critical)',
          'critical-bg': 'var(--critical-bg)',
          warning: 'var(--warning)',
          'warning-bg': 'var(--warning-bg)',
          healthy: 'var(--healthy)',
          'healthy-bg': 'var(--healthy-bg)',
        },
      },
      fontFamily: {
        sans: [
          'Geist Variable',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'Geist Mono Variable',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        control: '6px',
        panel: '12px',
      },
    },
  },
  plugins: [],
};
