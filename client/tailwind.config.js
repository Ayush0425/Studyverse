/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#07050D',         // Obsidian dark gray background
          surface: '#110D20',    // Dark card surface
          accent: '#7B2CBF',     // Purple neon accent
          neonPurple: '#9D4EDD', // High brightness purple
          neonBlue: '#2400FF',   // Neon blue accent
          neonCyan: '#00F0FF',   // Cyan neon glow
          neonPink: '#FF007A',   // Pink accent
          text: '#F1EBF9',       // High contrast text
          textMuted: '#9B8CB4',  // Low contrast text
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(123, 44, 191, 0.2)',
        'glass-glow': '0 0 15px rgba(123, 44, 191, 0.4), 0 8px 32px 0 rgba(123, 44, 191, 0.1)',
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.5)',
        'neon-purple': '0 0 15px rgba(157, 78, 221, 0.5)',
        'neon-pink': '0 0 15px rgba(255, 0, 122, 0.5)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at top, rgba(123, 44, 191, 0.15) 0%, transparent 70%)',
        'radial-cyan': 'radial-gradient(circle at center, rgba(0, 240, 255, 0.1) 0%, transparent 60%)',
      }
    },
  },
  plugins: [],
}
