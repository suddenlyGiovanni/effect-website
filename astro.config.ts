import react from "@astrojs/react"
import starlight from "@astrojs/starlight"
import vercel from "@astrojs/vercel"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, fontProviders } from "astro/config"
import svgr from "vite-plugin-svgr"

const GoogleFontProvider = fontProviders.google()

// https://astro.build/config
export default defineConfig({
  site: "https://effect.website",

  adapter: vercel(),

  experimental: {
    svgo: true,
  },

  vite: {
    plugins: [tailwindcss(), svgr()],
  },

  integrations: [
    react(),
    starlight({
      title: "My Docs",
      customCss: [
        // Tailwind Base Styles
        "./src/styles/global.css",
      ],
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/withastro/starlight" }],
      sidebar: [
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", slug: "docs/guides/example" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "docs/reference" },
        },
      ],
    }),
  ],

  fonts: [
    {
      provider: GoogleFontProvider,
      name: "Inter",
      weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
      cssVariable: "--font-inter",
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
    },
    {
      provider: GoogleFontProvider,
      name: "JetBrains Mono",
      weights: ["300", "400", "500", "600", "700"],
      display: "swap",
      cssVariable: "--font-jetbrains-mono",
      fallbacks: ["ui-monospace", "SFMono-Regular", "monospace"],
    },
  ],
})
