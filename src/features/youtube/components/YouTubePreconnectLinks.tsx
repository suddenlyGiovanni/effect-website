import * as React from "react"

export function YouTubePreconnectLinks({ youtubeUrl }: { readonly youtubeUrl: string }) {
  return (
    <React.Fragment>
      <link rel="preconnect" href={youtubeUrl} />
      <link rel="preconnect" href="https://www.google.com" />
    </React.Fragment>
  )
}
