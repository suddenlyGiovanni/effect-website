// trailingSlash: "ignore" in astro.config means Astro won't redirect /path/ → /path.
// In production Vercel edge handles it (vercel.json trailingSlash:false).
// In dev, Vite's trailingSlashMiddleware is a no-op with "ignore", so SSR never
// sees a redirect. This middleware closes the dev/prod parity gap.
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const { pathname, search, hash } = context.url;
  if (pathname !== "/" && pathname.endsWith("/")) {
    return context.redirect(pathname.slice(0, -1) + search + hash, 307);
  }
  return next();
});
