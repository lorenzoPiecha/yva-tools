/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0d12",
        panel: "#11141c",
        line: "#222633",
        accent: "#5ee7f7",
      },
    },
  },
  plugins: [],
};
