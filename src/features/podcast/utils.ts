import type { CollectionEntry } from "astro:content"
import { AstroError } from "astro/errors"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import fs from "node:fs/promises"
import * as NodePath from "node:path"
import SrtParser from "srt-parser-2"
import type { PodcastChapterEntry, PodcastEpisodeEntry } from "./collection"
import type {
  PodcastChapter,
  PodcastEpisode,
  PodcastTranscriptCue,
  PodcastThumbnailPosterQuality,
  SrtCue,
} from "./domain"

// =============================================================================
// Podcast Slug
// =============================================================================

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

// =============================================================================
// Podcast Date
// =============================================================================

export function sortPodcastsByPublishDate<T extends PodcastEpisodeEntry>(
  podcasts: ReadonlyArray<T>,
): Array<T> {
  return [...podcasts].sort((left, right) => right.date.localeCompare(left.date))
}

// =============================================================================
// Podcast Duration
// =============================================================================

export function formatPodcastDuration(duration: Duration.Duration): string {
  const durationInSeconds = Duration.toSeconds(duration)
  const minutes = Math.floor(durationInSeconds / 60)
  const seconds = durationInSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function parseTimestampToSeconds(value: string): number {
  const match = /^(?:(\d{2}):)?(\d{2}):(\d{2})(?:,(\d{1,3}))?$/.exec(value.trim())

  if (!match) {
    return 0
  }

  const [, hoursText, minutesText, secondsText, millisecondsText] = match
  const hours = Number(hoursText ?? "0")
  const minutes = Number(minutesText)
  const seconds = Number(secondsText)
  const milliseconds = Number((millisecondsText ?? "0").padEnd(3, "0"))

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    !Number.isFinite(milliseconds)
  ) {
    return 0
  }

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
}

export function formatPodcastPublicationDate(publishedOn: DateTime.DateTime) {
  return DateTime.formatLocal(publishedOn, {
    locale: "en-US",
    month: "short",
    timeZone: "UTC",
  })
}

// =============================================================================
// Podcast Thumbnail
// =============================================================================

export function getPodcastThumbnail(
  id: string,
  options?: {
    readonly format?: "webp" | "jpg" | undefined
    readonly poster?: PodcastThumbnailPosterQuality | undefined
  },
) {
  const encodedId = globalThis.encodeURIComponent(id)
  const format = options?.format ?? "jpg"
  const vi = format === "webp" ? "vi_webp" : "vi"
  const poster = options?.poster ?? "hqdefault"
  return `https://i.ytimg.com/${vi}/${encodedId}/${poster}.${format}`
}

// =============================================================================
// Podcast Chapters
// =============================================================================

export function normalizePodcastChapters(
  chapters: ReadonlyArray<PodcastChapterEntry>,
): ReadonlyArray<PodcastChapter> {
  return chapters.map((chapter, index) => ({
    id: `chapter-${index}-${slugifySegment(chapter.title)}`,
    title: chapter.title,
    startLabel: chapter.start,
    startSeconds: parseTimestampToSeconds(chapter.start),
  }))
}

// =============================================================================
// Podcast Transcript
// =============================================================================

function getTranscriptPath(entry: CollectionEntry<"podcasts">): string {
  const episodeDir = NodePath.dirname(entry.filePath ?? "")
  return NodePath.join(NodePath.resolve(), episodeDir, "transcript.srt")
}

export async function readPodcastTranscript(
  entry: CollectionEntry<"podcasts">,
): Promise<ReadonlyArray<SrtCue>> {
  const path = getTranscriptPath(entry)

  let content: Buffer

  try {
    content = await fs.readFile(path)
  } catch {
    throw new AstroError(
      `Failed to read transcript file from \`${path}\`.`,
      `Make sure the transcript file path provided in the video entry frontmatter is correct.

- Entry: \`${entry.filePath}\`
- Transcript: \`${path}\``,
    )
  }

  return new SrtParser().fromSrt(content.toString())
}

export function formatTranscriptTimestamp(value: string): string {
  const match = /^(?:(\d{2}):)?(\d{2}):(\d{2})(?:,\d+)?$/.exec(value.trim())

  if (!match) {
    return value
  }

  const [, hoursText, minutesText, secondsText] = match

  return hoursText && hoursText !== "00"
    ? `${hoursText}:${minutesText}:${secondsText}`
    : `${minutesText}:${secondsText}`
}

export function normalizePodcastTranscript(
  transcript: ReadonlyArray<SrtCue>,
): ReadonlyArray<PodcastTranscriptCue> {
  return transcript.map((cue, index) => ({
    id: cue.id.length > 0 ? `cue-${cue.id}` : `cue-${index}`,
    endSeconds: parseTimestampToSeconds(cue.endTime),
    startLabel: formatTranscriptTimestamp(cue.startTime),
    startSeconds: parseTimestampToSeconds(cue.startTime),
    text: cue.text,
  }))
}
