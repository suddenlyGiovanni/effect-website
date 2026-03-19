import type { CollectionEntry } from "astro:content"
import { AstroError } from "astro/errors"
import fs from "node:fs/promises"
import * as NodePath from "node:path"
import SrtParser from "srt-parser-2"

export interface SrtCue {
  readonly id: string
  readonly startTime: string
  readonly endTime: string
  readonly text: string
}

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
