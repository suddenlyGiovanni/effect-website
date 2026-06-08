import react from "@astrojs/react"
import starlight from "@astrojs/starlight"
import vercel from "@astrojs/vercel"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, fontProviders } from "astro/config"
import { fileURLToPath } from "node:url"
import svgr from "vite-plugin-svgr"
import { twieRedirectList } from "./src/generated/twie-redirects"

const GoogleFontProvider = fontProviders.google()

// https://astro.build/config
export default defineConfig({
  site: "https://effect.website",

  adapter: vercel(),

  vite: {
    plugins: [tailwindcss(), svgr()],
    resolve: {
      alias: {
        "@/": fileURLToPath(new URL("./src/", import.meta.url)),
      },
    },
    server: {
      watch: {
        ignored: ["**/.direnv/*", "repos/*", ".vercel/*"],
      },
    },
    ssr: {
      noExternal: ["effect", "effect-legacy", "motion"],
    },
  },

  integrations: [
    starlight({
      title: "Effect",
      disable404Route: true,
      pagefind: false,
      components: {
        Head: "./src/components/starlight/Head.astro",
        ThemeProvider: "./src/components/starlight/ThemeProvider.astro",
        PageFrame: "./src/components/starlight/PageFrame.astro",
        Footer: "./src/components/starlight/Footer.astro",
        Sidebar: "./src/components/starlight/Sidebar.astro",
      },
      customCss: ["./src/styles/starlight.css", "./src/styles/global.css"],
      sidebar: [
        {
          label: "v4 (Latest)",
          items: [{ autogenerate: { directory: "docs/v4" } }],
        },
        {
          label: "v3",
          items: [{ autogenerate: { directory: "docs/v3" } }],
        },
      ],
    }),
    react({
      include: ["**/react/*", "**/components/**/*", "**/examples/**/*"],
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

  redirects: {
    ...twieRedirectList,
  },
})
