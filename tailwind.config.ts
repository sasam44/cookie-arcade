import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cookie: {
          50: "#fff8e7",
          100: "#ffe7b5",
          200: "#fed28b",
          300: "#fcb752",
          400: "#fb9a2c",
          500: "#d97a18",
          600: "#9d580d",
          700: "#6b3a08",
        },
        dough: {
          700: "#211a14",
          800: "#161310",
          900: "#0c0a08",
        },
        cream: {
          100: "#fff5e0",
          200: "#ffe8c8",
          300: "#fdd9a8",
        },
        cherry: {
          400: "#ff6b8a",
          500: "#e94560",
        },
        mint: {
          400: "#7dd3a8",
          500: "#3eb47a",
        },
        sky2: {
          400: "#7dc7ff",
          500: "#3a9eff",
        },
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 40px rgba(252,183,82,0.4)" },
          "50%": { boxShadow: "0 0 80px rgba(252,183,82,0.8)" },
        },
        cookieSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(6deg)" },
        },
        steam: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.7" },
          "100%": { transform: "translateY(-30px) scale(1.6)", opacity: "0" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        popIn: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "70%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        glow: "glow 2.4s ease-in-out infinite",
        "cookie-spin": "cookieSpin 1s linear infinite",
        "bounce-soft": "bounceSoft 2.4s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        steam: "steam 2s ease-out infinite",
        wiggle: "wiggle 0.6s ease-in-out infinite",
        "pop-in": "popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        shimmer: "shimmer 3s linear infinite",
      },
      fontFamily: {
        display: ['"Bagel Fat One"', '"Fredoka"', "system-ui", "sans-serif"],
        body: ['"Quicksand"', "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "cookie-radial":
          "radial-gradient(circle at 30% 25%, #ffe7b5 0%, #fed28b 30%, #fb9a2c 65%, #d97a18 100%)",
        "cream-radial":
          "radial-gradient(circle at 30% 25%, #fff8e7 0%, #ffe8c8 30%, #fdd9a8 65%, #d97a18 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
