import type { CollectionEntry } from "astro:content"
import * as NodePath from "node:path"
import type { PodcastEpisode } from "./collection"

const genericPodcastTags = new Set(["typescript", "effect"])

export function getTranscriptPath(podcast: CollectionEntry<"podcasts">): string {
  const episodeDir = NodePath.dirname(podcast.filePath ?? "")
  return NodePath.join(NodePath.resolve(), episodeDir, "transcript.srt")
}

export function getPodcastYouTubeVideoId(videoIdOrUrl: string): string {
  try {
    const url = new URL(videoIdOrUrl)

    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace(/^\//, "")
      return id.length > 0 ? id : videoIdOrUrl
    }

    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v")
      return id && id.length > 0 ? id : videoIdOrUrl
    }
  } catch {
    return videoIdOrUrl
  }

  return videoIdOrUrl
}

export function getPodcastYouTubeEmbedUrl(videoIdOrUrl: string): string {
  const id = getPodcastYouTubeVideoId(videoIdOrUrl)
  return `https://www.youtube.com/embed/${id}`
}

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

export function sortPodcastsByPublishDate<T extends PodcastEpisode>(
  podcasts: ReadonlyArray<T>,
): Array<T> {
  return [...podcasts].sort((left, right) => right.date.localeCompare(left.date))
}

export function formatPodcastDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number)

  if (
    typeof year !== "number" ||
    Number.isNaN(year) ||
    typeof month !== "number" ||
    Number.isNaN(month) ||
    typeof day !== "number" ||
    Number.isNaN(day)
  ) {
    return date
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day))
  const monthLabel = podcastMonthFormatter.format(utcDate)

  return `${monthLabel} ${day}, ${year}`
}

export function formatPodcastDuration(durationInSeconds: number): string {
  const minutes = Math.floor(durationInSeconds / 60)
  const seconds = durationInSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function getPodcastOrganization(podcast: PodcastEpisode): string | undefined {
  return podcast.tags.find((tag) => !genericPodcastTags.has(tag.toLocaleLowerCase("en-US")))
}
