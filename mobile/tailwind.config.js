const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  corePlugins: {
    fontWeight: false,
  },
  theme: {
    extend: {
      colors: {
        background: '#fff7ef',
        foreground: '#09090b',
        accent: '#fb4824',
      },
      fontFamily: {
        'geist-regular': ['Geist-Regular'],
        'geist-medium': ['Geist-Medium'],
        'geist-semibold': ['Geist-SemiBold'],
        'geist-bold': ['Geist-Bold'],
        'geist-black': ['Geist-Black'],
      }
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.font-thin': { fontFamily: 'Geist-Regular' },
        '.font-extralight': { fontFamily: 'Geist-Regular' },
        '.font-light': { fontFamily: 'Geist-Regular' },
        '.font-normal': { fontFamily: 'Geist-Regular' },
        '.font-medium': { fontFamily: 'Geist-Medium' },
        '.font-semibold': { fontFamily: 'Geist-SemiBold' },
        '.font-bold': { fontFamily: 'Geist-Bold' },
        '.font-extrabold': { fontFamily: 'Geist-Black' },
        '.font-black': { fontFamily: 'Geist-Black' },
      })
    })
  ],
}
