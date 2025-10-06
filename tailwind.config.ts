import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        glow: {
          cyan: "hsl(var(--glow-cyan))",
          blue: "hsl(var(--glow-blue))",
          magenta: "hsl(var(--glow-magenta))",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        crystal: "0 20px 120px -40px rgba(56, 189, 248, 0.65)",
        halo: "0 0 60px rgba(147, 51, 234, 0.35)",
        soft: "0 30px 80px -50px rgba(15, 23, 42, 0.6)",
      },
      backdropBlur: {
        ultra: "28px",
      },
      backgroundImage: {
        "fashbot-radial":
          "radial-gradient(circle at 20% -10%, hsl(var(--glow-magenta) / 0.35), transparent 55%), radial-gradient(circle at 90% 30%, hsl(var(--glow-blue) / 0.3), transparent 60%), radial-gradient(circle at 50% 120%, hsl(var(--glow-cyan) / 0.25), transparent 55%)",
        "fashbot-linear":
          "linear-gradient(135deg, hsl(var(--glow-cyan) / 0.32), hsl(var(--glow-magenta) / 0.28))",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "crystal-spin": {
          from: {
            transform: "rotate3d(1, 1, 0, 0deg)",
          },
          to: {
            transform: "rotate3d(1, 1, 0, 360deg)",
          },
        },
        "particle-drift": {
          "0%": {
            transform: "translate3d(0, 0, 0)",
            opacity: "0.4",
          },
          "50%": {
            transform: "translate3d(12px, -16px, 0)",
            opacity: "0.85",
          },
          "100%": {
            transform: "translate3d(-8px, 18px, 0)",
            opacity: "0.4",
          },
        },
        "pulse-soft": {
          "0%, 100%": {
            opacity: "0.75",
            filter: "blur(16px)",
          },
          "50%": {
            opacity: "0.4",
            filter: "blur(24px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "crystal-spin": "crystal-spin 24s linear infinite",
        "particle-drift": "particle-drift 16s ease-in-out infinite",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
      },
      transitionTimingFunction: {
        outglow: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
