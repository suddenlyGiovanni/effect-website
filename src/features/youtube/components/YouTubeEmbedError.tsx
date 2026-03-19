export function YouTubeEmbedError({ error }: { readonly error: string }) {
  return (
    <div className="absolute top-3 right-3 left-3 z-4 rounded-lg border border-red-400/25 bg-red-950/80 px-3 py-2 text-xs text-red-100 shadow-lg backdrop-blur-sm">
      <p className="font-medium tracking-[0.16em] uppercase">youtube error</p>
      <p className="mt-1 text-red-50/90">{error}</p>
    </div>
  )
}
