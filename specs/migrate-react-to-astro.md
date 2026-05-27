# Migrate React component to Astro page

## Summary
I want to migrate @landing/src/components/landing/BlogPage.tsx to be an Astro page in @website-v2/src/pages/blog/index.astro migrating leveraging astro content collections and SSG.

## Context
- `landing` project is only for reference
- `website-v2` project is for implementation
- The blog posts are written in `mdx` as a content
- The blog post content collection is in mdx

## Goal
- The React component is migrated to an Astro page
- React components `AvatarWithFallback`, `FeaturedPost`, `TWIECard`, `TWIESection`, and `PostCard` and `HorizontalScrollRail` can be inlined
- Content collection schema is created keeping the structure as is
- Pagination and sorting should default on "Newest First" ordering and "All" category
- Pagination and sorting should update the URL using Query Params
- Blog tags should be displayed with the name and use the slug in the URL
- Blog category slug in the collection must be the name in kebab-case

## Requirements
- Components are created ONLY if used multiple time and/or different contexts
- Typescript MUST compile
- NEVER use type assertions or `any` in Typescript
- NEVER import, reference or use directly from `landing` project
- DO NOT migrate blog content
- The style MUST match the `landing` using components and patterns from `website-v2` if already present