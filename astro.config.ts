import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
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
        "@astrojs/starlight/components": fileURLToPath(
          new URL("./src/components/docs/starlight-shim.ts", import.meta.url),
        ),
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
    react({
      include: ["**/react/*", "**/components/**/*", "**/examples/**/*"],
    }),
    mdx({ extendMarkdownConfig: false }),
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
    "/docs": "/docs/v4",
    ...twieRedirectList,
  },
})
