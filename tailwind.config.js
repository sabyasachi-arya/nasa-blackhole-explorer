/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          // Deep space black -> cosmic navy
          950: 'rgb(3, 7, 18)',
          900: 'rgb(8, 13, 30)',
          850: 'rgb(11, 20, 43)',
          800: 'rgb(15, 32, 60)',
          700: 'rgb(23, 45, 80)',
        },
        cosmic: {
          blue: 'rgb(59, 130, 246)',
          cyan: 'rgb(34, 211, 238)',
          purple: 'rgb(147, 51, 234)',
          magenta: 'rgb(219, 39, 119)',
        },
        ink: {
          100: 'rgb(241, 245, 249)',
          300: 'rgb(203, 213, 225)',
          500: 'rgb(148, 163, 184)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Fluid display sizes: 28px mobile -> 56px desktop
        display: ['clamp(1.75rem, 1.1rem + 3.2vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        section: ['clamp(1.25rem, 0.9rem + 1.8vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
        md: '0 8px 24px rgba(0, 0, 0, 0.4)',
        lg: '0 16px 48px rgba(0, 0, 0, 0.5)',
        glow: '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 45px rgba(59, 130, 246, 0.35)',
      },
      transitionDuration: { fast: '150ms', normal: '300ms' },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translate3d(0, 18px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'modal-in': {
          from: { opacity: '0', transform: 'translate3d(0, 12px, 0) scale(0.98)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0) scale(1)' },
        },
        'modal-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.98)' },
        },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
        twinkle: { '0%, 100%': { opacity: '0.25' }, '50%': { opacity: '0.9' } },
      },
      animation: {
        'fade-up': 'fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 300ms ease both',
        'fade-out': 'fade-out 200ms ease both',
        'modal-in': 'modal-in 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'modal-out': 'modal-out 200ms ease both',
        shimmer: 'shimmer 1.6s linear infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
