/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sgate-orange': '#FF6B35',
        'sgate-blue': '#004E89',
        'sgate-gray': '#F7F9FC',
      }
    },
  },
  plugins: [],
}