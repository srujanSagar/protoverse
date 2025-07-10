/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Space Grotesk', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],      // 10.5px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 12.25px
        base: ['1rem', { lineHeight: '1.5rem' }],     // 14px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 15.75px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 17.5px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 21px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 26.25px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 31.5px
        '5xl': ['3rem', { lineHeight: '1' }],         // 42px
        '6xl': ['3.75rem', { lineHeight: '1' }],      // 52.5px
        '7xl': ['4.5rem', { lineHeight: '1' }],       // 63px
        '8xl': ['6rem', { lineHeight: '1' }],         // 84px
        '9xl': ['8rem', { lineHeight: '1' }],         // 112px
      },
    },
  },
  plugins: [],
};