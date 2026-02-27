import type { CSSProperties } from "react"
import { Resvg } from "@resvg/resvg-js"
import * as Effect from "effect/Effect"
import * as Encoding from "effect/Encoding"
import * as FileSystem from "effect/FileSystem"
import * as Layer from "effect/Layer"
import * as Path from "effect/Path"
import * as ServiceMap from "effect/ServiceMap"
import satori, { type SatoriOptions } from "satori"
import { OPENGRAPH_IMAGE_HEIGHT, OPENGRAPH_IMAGE_WIDTH } from "@/lib/constants"

export interface OgTemplateProps {
  title: string
  description?: string
  subtitle?: string
}

interface OgTemplateAssets {
  logoDataUri: string
  dashDataUri: string
}

type SatoriFont = NonNullable<SatoriOptions["fonts"]>[number]
export type OgFonts = readonly [SatoriFont, ...SatoriFont[]]

const dashSvg =
  "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='4'><rect x='0' y='0' width='1' height='2' fill='rgba(63,63,70,0.7)'/></svg>"

export class OpenGraph extends ServiceMap.Service<OpenGraph>()("OpenGraph", {
  make: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const fontInterRegularPath = path.resolve("src/assets/fonts/Inter-Regular.ttf")
    const fontInterRegularData = yield* Effect.orDie(fs.readFile(fontInterRegularPath))

    const fontInterBoldPath = path.resolve("src/assets/fonts/Inter-Bold.ttf")
    const fontInterBoldData = yield* Effect.orDie(fs.readFile(fontInterBoldPath))

    const fonts: Array<SatoriFont> = [
      {
        name: "Inter",
        style: "normal",
        data: toArrayBuffer(fontInterRegularData),
        weight: 400,
      },
      {
        name: "Inter",
        style: "normal",
        data: toArrayBuffer(fontInterBoldData),
        weight: 700,
      },
    ]

    const logoSvgPath = path.resolve(
      "src/assets/logos/effect/combination-mark/svg/effect-logo-white.svg",
    )
    const logoSvg = yield* Effect.orDie(fs.readFile(logoSvgPath))

    const logoDataUri = svgToDataUri(logoSvg)
    const dashDataUri = svgToDataUri(dashSvg)

    const renderSvg = (template: Parameters<typeof satori>[0]) =>
      Effect.promise(() =>
        satori(template, {
          width: OPENGRAPH_IMAGE_WIDTH,
          height: OPENGRAPH_IMAGE_HEIGHT,
          fonts,
        }),
      )

    const renderPng = (svg: string): Uint8Array => {
      const resvg = new Resvg(svg, { fitTo: { mode: "width", value: OPENGRAPH_IMAGE_WIDTH } })
      return new Uint8Array(resvg.render().asPng())
    }

    const templateAssets: OgTemplateAssets = {
      logoDataUri,
      dashDataUri,
    }

    const homepageTemplate = createHomepageTemplate(templateAssets)
    const forHomepage = Effect.map(renderSvg(homepageTemplate), renderPng)

    const forContent = (props: OgTemplateProps) =>
      Effect.map(
        renderSvg(createContentTemplate(prepareContentProps(props), templateAssets)),
        renderPng,
      )

    return {
      forHomepage,
      forContent,
    } as const
  }),
}) {
  static layer = Layer.effect(this, this.make)
}

type OgChild = OgNode | string | number | null
type OgChildren = OgChild | ReadonlyArray<OgChild>

interface OgNodeProps {
  style?: CSSProperties
  children?: OgChildren
  src?: string
  width?: number
  height?: number
}

interface OgNode {
  type: string
  key: string | null
  props: OgNodeProps
}

const toArrayBuffer = (data: Uint8Array): ArrayBuffer => {
  const bytes = Uint8Array.from(data)
  return bytes.buffer
}

const svgToDataUri = (svg: string | Uint8Array): string => {
  const base64 = Encoding.encodeBase64(svg)
  return `data:image/svg+xml;base64,${base64}`
}

const truncateDescription = (description: string | undefined): string | undefined => {
  if (description === undefined) {
    return description
  }

  if (description.length <= 160) {
    return description
  }

  return `${description.slice(0, 160).trimEnd()} ...`
}

const safeText = (text: string): string => {
  const emojiPattern = /[\u0080-\u{10FFFF}]+/gu
  return text.replace(emojiPattern, "").trim()
}

const sanitizeOptionalText = (text: string | undefined): string | undefined => {
  if (text === undefined) {
    return text
  }

  const sanitized = safeText(text)
  return sanitized.length === 0 ? undefined : sanitized
}

const sanitizeTemplateProps = (props: OgTemplateProps): OgTemplateProps => {
  return {
    title: safeText(props.title),
    description: sanitizeOptionalText(props.description),
    subtitle: sanitizeOptionalText(props.subtitle),
  }
}

const prepareContentProps = (props: OgTemplateProps): OgTemplateProps => {
  const sanitized = sanitizeTemplateProps(props)
  return {
    ...sanitized,
    description: truncateDescription(sanitized.description),
  }
}

const getTitleFontSize = (title: string): string => {
  const length = title.length

  if (length <= 32) {
    return "66px"
  }

  if (length <= 52) {
    return "58px"
  }

  if (length <= 72) {
    return "52px"
  }

  return "46px"
}

const getTitleMaxWidth = (title: string): string => {
  return title.length <= 52 ? "920px" : "860px"
}

const createNode = (type: string, props: OgNodeProps): OgNode => {
  return {
    type,
    key: null,
    props,
  }
}

const createBackground = (dashDataUri: string): ReadonlyArray<OgNode> => {
  return [
    createNode("div", {
      style: {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        display: "flex",
        background:
          "radial-gradient(ellipse 900px 500px at 50% 45%, rgba(63, 63, 70, 0.55) 0%, transparent 100%)",
      },
    }),
    createNode("div", {
      style: {
        position: "absolute",
        left: "60px",
        top: "0",
        bottom: "0",
        width: "1px",
        display: "flex",
        backgroundColor: "#3f3f46",
      },
    }),
    createNode("div", {
      style: {
        position: "absolute",
        right: "60px",
        top: "0",
        bottom: "0",
        width: "1px",
        display: "flex",
        backgroundColor: "#3f3f46",
      },
    }),
    createNode("div", {
      style: {
        position: "absolute",
        left: "600px",
        top: "0",
        bottom: "0",
        width: "1px",
        display: "flex",
        backgroundImage: `url(${dashDataUri})`,
        backgroundSize: "1px 4px",
      },
    }),
  ]
}

const createHomepageOgTemplate = ({ logoDataUri, dashDataUri }: OgTemplateAssets): OgNode => {
  const gapTop = 255
  const gapBottom = 375

  return createNode("div", {
    style: {
      width: "1200px",
      height: "630px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#000000",
      fontFamily: "Inter",
      position: "relative",
      overflow: "hidden",
    },
    children: [
      createNode("div", {
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          display: "flex",
          background:
            "radial-gradient(ellipse 900px 500px at 50% 45%, rgba(63, 63, 70, 0.55) 0%, transparent 100%)",
        },
      }),
      createNode("div", {
        style: {
          position: "absolute",
          left: "48px",
          top: "0",
          bottom: "0",
          width: "1px",
          display: "flex",
          backgroundColor: "#3f3f46",
        },
      }),
      createNode("div", {
        style: {
          position: "absolute",
          right: "48px",
          top: "0",
          bottom: "0",
          width: "1px",
          display: "flex",
          backgroundColor: "#3f3f46",
        },
      }),
      createNode("div", {
        style: {
          position: "absolute",
          left: "600px",
          top: "0",
          height: `${gapTop}px`,
          width: "1px",
          display: "flex",
          backgroundImage: `url(${dashDataUri})`,
          backgroundSize: "1px 4px",
        },
      }),
      createNode("div", {
        style: {
          position: "absolute",
          left: "600px",
          top: `${gapBottom}px`,
          bottom: "0",
          width: "1px",
          display: "flex",
          backgroundImage: `url(${dashDataUri})`,
          backgroundSize: "1px 4px",
        },
      }),
      createNode("img", {
        src: logoDataUri,
        width: 360,
        height: 99,
      }),
    ],
  })
}

const createContentOgTemplate = ({
  title,
  description,
  subtitle,
  logoDataUri,
  dashDataUri,
}: OgTemplateProps & OgTemplateAssets): OgNode => {
  const titleFontSize = getTitleFontSize(title)
  const titleMaxWidth = getTitleMaxWidth(title)
  const titleLineHeight = title.length > 64 ? 1.14 : 1.08

  const textChildren: Array<OgNode> = []

  if (subtitle !== undefined) {
    textChildren.push(
      createNode("div", {
        style: {
          fontSize: "19px",
          color: "#7a7a84",
          fontWeight: 400,
          marginBottom: "16px",
          letterSpacing: "-0.01em",
          display: "flex",
        },
        children: subtitle,
      }),
    )
  }

  textChildren.push(
    createNode("div", {
      style: {
        fontSize: titleFontSize,
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: titleLineHeight,
        maxWidth: titleMaxWidth,
        letterSpacing: "-0.02em",
        display: "flex",
      },
      children: title,
    }),
  )

  if (description !== undefined) {
    textChildren.push(
      createNode("div", {
        style: {
          fontSize: "19px",
          color: "#a1a1aa",
          lineHeight: 1.45,
          marginTop: "24px",
          maxWidth: "900px",
          fontWeight: 400,
          letterSpacing: "-0.005em",
          display: "flex",
        },
        children: description,
      }),
    )
  }

  return createNode("div", {
    style: {
      width: "1200px",
      height: "630px",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#000000",
      fontFamily: "Inter",
      padding: "68px 80px 64px 80px",
      position: "relative",
      overflow: "hidden",
    },
    children: [
      ...createBackground(dashDataUri),
      createNode("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          flex: "1",
        },
        children: [
          createNode("img", {
            src: logoDataUri,
            width: 188,
            height: 52,
          }),
          createNode("div", {
            style: {
              display: "flex",
              flexDirection: "column",
              marginTop: "132px",
            },
            children: textChildren,
          }),
        ],
      }),
    ],
  })
}

const createHomepageTemplate = (assets: OgTemplateAssets): OgNode => {
  return createHomepageOgTemplate(assets)
}

const createContentTemplate = (props: OgTemplateProps, assets: OgTemplateAssets): OgNode => {
  return createContentOgTemplate({
    title: props.title,
    description: props.description,
    subtitle: props.subtitle,
    logoDataUri: assets.logoDataUri,
    dashDataUri: assets.dashDataUri,
  })
}
