
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // Temporarily remove or comment out the custom typography config
      // typography: (theme) => ({
      //   DEFAULT: {
      //     css: {
      //       color: theme('colors.gray.700'),
      //       h1: { color: theme('colors.gray.900') },
      //       pre: {
      //         backgroundColor: theme('colors.gray.800'),
      //         color: theme('colors.gray.100'),
      //         padding: theme('spacing.4'),
      //         borderRadius: theme('borderRadius.md'),
      //         overflowX: 'auto',
      //       },
      //       code: {
      //         backgroundColor: theme('colors.gray.200'),
      //         color: theme('colors.pink.600'),
      //         padding: '0.2em 0.4em',
      //         borderRadius: '0.25em',
      //         fontWeight: '600',
      //         '&::before': { content: '"" !important' },
      //         '&::after': { content: '"" !important' },
      //       },
      //     },
      //   },
      // }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}