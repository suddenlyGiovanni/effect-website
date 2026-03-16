import { z } from "astro/zod"

export const PodcastEpisode = z.object({
  /**
   * The ordinal number of the episode.
   */
  episode: z.int().positive(),
  /**
   * The title of the podcast episode.
   */
  title: z.string().min(1),
  /**
   * The description of the podcast episode.
   */
  description: z.string().min(1),
  /**
   * The podcast guest.
   */
  guest: z.string().min(1),
  /**
   * The URL slug for the podcast episode.
   */
  slug: z.string().min(1),
  /**
   * The artwork for the episode.
   */
  thumbnailUrl: z.url(),
  /**
   * The date when an episode was released.
   */
  date: z.iso.date(),
  /**
   * The duration of an episode in seconds.
   */
  duration: z.number().int().min(1),
  /**
   * The episode content, file size, and file type information.
   */
  enclosure: z.object({
    /**
     * The URL which points to the podcast media file.
     */
    url: z.string().min(1),
    /**
     * The file size in bytes.
     */
    length: z.number().int(),
    /**
     * The type of the podcast media file.
     */
    type: z.string().min(1),
  }),
  /**
   * The details of the YouTube video associated with the podcast.
   */
  youtube: z.object({
    /**
     * The URL or identifier of the YouTube video.
     */
    id: z.union([z.url(), z.string().min(1)]),
    /**
     * The title of the YouTube video.
     */
    title: z.string(),
  }),
  /**
   * The list of tags associated with the podcast episode.
   */
  tags: z.array(z.string()),
})

export type PodcastEpisode = z.infer<typeof PodcastEpisode>
