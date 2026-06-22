import * as DevToolsSchema from "effect/unstable/devtools/DevToolsSchema"
import * as Array from "effect/Array"
import { Effect, Layer, Stream } from "effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import { Span } from "../domain/devtools"
import { WebContainer } from "./webcontainer"
import * as Atom from "effect/unstable/reactivity/Atom"
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"

export const rootSpansAtom = Atom.make<ReadonlyArray<Span>>([])

export const DevToolsLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const registry = yield* AtomRegistry.AtomRegistry
    const container = yield* WebContainer

    function registerSpan(span: DevToolsSchema.ParentSpan) {
      return Effect.sync(() =>
        registry.update(rootSpansAtom, (rootSpans): ReadonlyArray<Span> =>
          pipe(
            rootSpans,
            Array.findFirstIndex((root) => root.traceId === span.traceId),
            Option.flatMap((index) => Array.modify(rootSpans as Array<Span>, index, (root: Span) => root.addSpan(span))),
            Option.getOrElse(() => Array.prepend(rootSpans, Span.fromSpan(span)))
          )
        )
      )
    }

    function registerSpanEvent(event: DevToolsSchema.SpanEvent) {
      return Effect.sync(() =>
        registry.update(rootSpansAtom, (rootSpans): ReadonlyArray<Span> =>
          pipe(
            rootSpans,
            Array.findFirstIndex((root) => root.traceId === event.traceId),
            Option.flatMap((index) => Array.modify(rootSpans as Array<Span>, index, (root: Span) => root.addEvent(event))),
            Option.getOrElse(() => rootSpans)
          )
        )
      )
    }

    yield* container.devTools.pipe(
      Stream.runForEach((request) => {
        switch (request._tag) {
          case "MetricsSnapshot": {
            return Effect.void
          }
          case "Span": {
            return registerSpan(request)
          }
          case "SpanEvent": {
            return registerSpanEvent(request)
          }
        }
      }),
      Effect.forkDetach
    )
  })
).pipe(Layer.provide(WebContainer.layer))
