// trailingSlash: "ignore" in astro.config means Astro won't redirect /path/ → /path.
// In production Vercel edge handles it (vercel.json trailingSlash:false).
// In dev, Vite's trailingSlashMiddleware is a no-op with "ignore", so SSR never
// sees a redirect. This middleware closes the dev/prod parity gap.
import { defineMiddleware } from "astro:middleware"

export const onRequest = defineMiddleware((context, next) => {
  /* Prod trailing-slash strip is handled at the edge by vercel.json
   * (trailingSlash: false). This middleware only needs to close the dev/prod
   * parity gap, so skip it outside dev. Running it during `astro build` breaks
   * the static prerender: with trailingSlash "ignore" + build.format
   * "directory", pages are rendered at their slash-appended URL (/path/), this
   * middleware returns a 307, and Astro emits a redirect stub instead of real
   * page content — causing an infinite self-redirect loop on Vercel.
   */
  if (!import.meta.env.DEV) return next()

  const { pathname, search, hash } = context.url
  if (pathname !== "/" && pathname.endsWith("/")) {
    return context.redirect(pathname.slice(0, -1) + search + hash, 307)
  }
  return next()
})
