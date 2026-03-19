import * as React from "react"
import { cn, cssVars } from "@/lib/utils"

const BACKGROUND_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg=="

export function YouTubeEmbedPosterContainer({
  children,
  className,
  isPreviewing,
  lazyLoad,
  posterUrl,
  title,
}: React.PropsWithChildren<{
  readonly className?: string | undefined
  readonly isPreviewing: boolean
  readonly lazyLoad: boolean | undefined
  readonly posterUrl: string
  readonly title: string
}>) {
  const aspectRatio = `${(9 / 16) * 100}%`
  return (
    <article
      style={cssVars({
        "--aspect-ratio": aspectRatio,
        "--container-url": `url('${BACKGROUND_IMAGE}')`,
        ...(lazyLoad ? {} : { backgroundImage: `url('${posterUrl}')` }),
      })}
      className={cn(
        "group relative aspect-video overflow-hidden bg-cover bg-position-[50%] contain-layout contain-size",
        "after:block after:pb-(--aspect-ratio) after:content-['']",
        !isPreviewing &&
          "before:pointer-events-none before:absolute before:top-0 before:box-content before:block before:h-[60px] before:w-full before:bg-(image:--container-url) before:bg-top before:bg-repeat-x before:pb-[50px] before:opacity-0 before:transition-all before:duration-200 before:content-['']",
        className,
      )}
      data-title={title}
    >
      {children}
    </article>
  )
}
