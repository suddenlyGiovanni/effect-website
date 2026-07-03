import { fileURLToPath } from "node:url"

import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import vercel from "@astrojs/vercel"
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import tailwindcss from "@tailwindcss/vite"
import expressiveCode from "astro-expressive-code"
import { defineConfig, fontProviders, svgoOptimizer } from "astro/config"
import svgr from "vite-plugin-svgr"
import { twieRedirectList } from "./src/generated/twie-redirects"
import { docsLegacyRedirectList } from "./src/generated/docs-legacy-redirects"

const GoogleFontProvider = fontProviders.google()

// https://astro.build/config
export default defineConfig({
  site: "https://effect.website",

  adapter: vercel(),

  trailingSlash: "ignore",

  compressHTML: true,

  experimental: {
    svgOptimizer: svgoOptimizer(),
  },

  vite: {
    plugins: [
      tailwindcss(),
      svgr()
    ],
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
        ignored: ["**/.astro/**", "**/.direnv/**", "**/repos/**", "**/.vercel/**"],
      },
    },
  },

  integrations: [
    expressiveCode({
      plugins: [
        pluginCollapsibleSections(),
        pluginLineNumbers(),
      ],
      themes: ["github-light", "github-dark"],
    }),
    react(),
    mdx(),
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
    ...docsLegacyRedirectList,
    "/docs": {
      status: 307,
      destination: "/docs/v3/getting-started/introduction",
    },
    "/docs/v3": {
      status: 307,
      destination: "/docs/v3/getting-started/introduction",
    },
  },
})
