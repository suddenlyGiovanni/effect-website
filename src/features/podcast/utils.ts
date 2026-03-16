import type { PodcastEpisode } from "./collection"

const podcastMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
})

function slugifySegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function slugifyPodcast(podcast: PodcastEpisode): string {
  const trimmedTitle = podcast.title.trim()
  const trimmedGuest = podcast.guest.trim()
  const guestSuffix = ` with ${trimmedGuest}`
  const normalizedTitle = trimmedTitle.toLocaleLowerCase("en-US")
  const normalizedGuestSuffix = guestSuffix.toLocaleLowerCase("en-US")
  const baseTitle = normalizedTitle.endsWith(normalizedGuestSuffix)
    ? trimmedTitle.slice(0, -guestSuffix.length)
    : trimmedTitle

  return slugifySegment(`${baseTitle} with ${trimmedGuest}`)
}

export function sortPodcastsByPublishDate<T extends PodcastEpisode>(podcasts: ReadonlyArray<T>): Array<T> {
  return [...podcasts].sort((left, right) => right.date.localeCompare(left.date))
}

export function formatPodcastDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number)

  const utcDate = new Date(Date.UTC(year!, month! - 1, day))
  const monthLabel = podcastMonthFormatter.format(utcDate)

  return `${monthLabel} ${day}, ${year}`
}

export function formatPodcastDuration(durationInSeconds: number): string {
  const minutes = Math.floor(durationInSeconds / 60)
  const seconds = durationInSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, "0")}`
}
