import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Lentera palette — available as e.g. text-cs-primary, bg-cs-pink
      colors: {
        cs: {
          bg: "#FCFBFF",
          primary: "#8B5CF6",
          primaryDeep: "#7C3AED",
          pink: "#F9A8D4",
          blue: "#38BDF8",
          green: "#34D399",
          yellow: "#FDE68A",
          text: "#2E2A5E",
        },
      },
      fontFamily: {
        heading: ["Poppins", "system-ui", "sans-serif"],
        body: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
