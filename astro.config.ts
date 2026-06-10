import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import vercel from "@astrojs/vercel"
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, fontProviders } from "astro/config"
import expressiveCode from "astro-expressive-code"
import ecTwoSlash from "expressive-code-twoslash"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"
import svgr from "vite-plugin-svgr"
import { pluginOpenInPlayground } from "./src/plugins/expressive-code/open-in-playground"
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
        ignored: [".git/*", "**/.direnv/*", "repos/*", ".vercel/*"],
      },
    },
    ssr: {
      noExternal: ["effect", "effect-legacy", "motion"],
    },
  },

  integrations: [
    expressiveCode({
      plugins: [
        pluginCollapsibleSections(),
        pluginLineNumbers(),
        pluginOpenInPlayground(),
        ecTwoSlash({
          twoslashOptions: {
            compilerOptions: {
              // v3 docs import from "effect" but need effect-legacy (v3) types.
              // All current twoslash blocks are in v3 docs only.
              paths: {
                effect: [
                  resolve("node_modules/effect-legacy/dist/dts/index.d.ts"),
                ],
                "effect/*": [
                  resolve("node_modules/effect-legacy/dist/dts/*.d.ts"),
                ],
              },
            },
          },
        }),
      ],
      themes: ["github-light", "github-dark"],
    }),
    react({
      include: ["**/react/*", "**/components/**/*", "**/examples/**/*"],
    }),
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
    "/docs": "/docs/v4",
    "/docs/v3": "/docs/v3/getting-started/introduction",
    ...twieRedirectList,
  },
})
