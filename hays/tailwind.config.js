/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orca: {
          navy: '#0A1931',     // Deep Navy (Primary / Headers / Buttons)
          ocean: '#1A3D63',   // Ocean Blue (Secondary / Accent areas / Hover states)
          soft: '#4A7FA7',    // Soft Blue (Highlights / Borders / Icons)
          pale: '#B3CFE5',    // Pale Sky Blue (Backgrounds / Cards / Containers)
          mist: '#F6FAFD'     // White Mist (Main background / Text backgrounds)
        },
        gray: {
          50: '#F9FAFB',  // Light background
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827', // Dark background
        },
      },
      backgroundColor: (theme) => ({
        ...theme('colors'),
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        accent: 'var(--bg-accent)',
      }),
      textColor: (theme) => ({
        ...theme('colors'),
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
      }),
      borderColor: (theme) => ({
        ...theme('colors'),
        primary: 'var(--border-primary)',
        accent: 'var(--border-accent)',
      }),
    },
  },
  plugins: [],
}
