import type { ImageMetadata } from "astro"
import AdamRankinTestimonialThumbnail from "@/assets/images/testimonials/adam-rankin.webp"
import AttilaVecerekTestimonialThumbnail from "@/assets/images/testimonials/attila-vecerek.webp"
import LouisVichyTestimonialThumbnail from "@/assets/images/testimonials/louis-vichy.webp"
import SamuelBrioleTestimonialThumbnail from "@/assets/images/testimonials/samuel-briole.webp"

export type FeaturedEpisodeSlug = "episode-1" | "episode-5" | "episode-6" | "episode-7"

export type FeaturedEpisode = {
  readonly slug: FeaturedEpisodeSlug
  readonly company: string
  readonly useCase: string
  readonly guest: string
  readonly thumbnail: ImageMetadata
}

export const FEATURED_EPISODES: ReadonlyArray<FeaturedEpisode> = [
  {
    slug: "episode-7",
    company: "Warp",
    useCase: "HR Systems",
    guest: "Adam Rankin",
    thumbnail: AdamRankinTestimonialThumbnail,
  },
  {
    slug: "episode-6",
    company: "OpenRouter",
    useCase: "Internal Tooling",
    guest: "Louis Vichy",
    thumbnail: LouisVichyTestimonialThumbnail,
  },
  {
    slug: "episode-1",
    company: "Zendesk",
    useCase: "Enterprise Customer Support",
    guest: "Attila Vecerek",
    thumbnail: AttilaVecerekTestimonialThumbnail,
  },
  {
    slug: "episode-5",
    company: "Spiko",
    useCase: "Fintech Infrastructure",
    guest: "Samuel Briole",
    thumbnail: SamuelBrioleTestimonialThumbnail,
  },
]

export const getPodcastEpisodeHref = (slug: FeaturedEpisodeSlug) => {
  return `/podcast/episodes/${slug}/`
}

export const getFeaturedEpisodeBySlug = (slug: string) => {
  return FEATURED_EPISODES.find((episode) => episode.slug === slug)
}
