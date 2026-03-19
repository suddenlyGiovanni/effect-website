export function YouTubeThumbnail({
  posterUrl,
  title,
}: {
  readonly posterUrl: string
  readonly title: string
}) {
  return (
    <img
      className="absolute top-0 left-0 size-full object-cover object-center"
      src={posterUrl}
      alt={`${title} - YouTube thumbnail`}
      loading="lazy"
    />
  )
}
