import type React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

const FAQS: ReadonlyArray<{
  readonly question: string
  readonly answer: React.ReactNode
}> = [
  {
    question: "Why is the syntax different from typical TypeScript?",
    answer: (
      <>
        <p>
          Effect's syntax may feel unfamiliar at first:{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-200">
            yield*
          </code>
          ,{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-200">
            Effect.gen
          </code>
          ,{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-200">
            TaggedError
          </code>
          … But that's because it's doing something TypeScript can't do on its own.
        </p>
        <p className="mt-4">That "weirdness" unlocks:</p>
        <ul className="my-0 mt-2 list-disc space-y-1">
          <li>Typed, composable errors.</li>
          <li>Dependency injection with no globals.</li>
          <li>Interruptible workflows.</li>
          <li>Business logic you can reason about, reuse, and test in isolation.</li>
        </ul>
      </>
    ),
  },
  {
    question: "How long does it take to learn?",
    answer: (
      <p>
        You can be productive in a few days. Start by replacing{" "}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-200">
          await
        </code>{" "}
        with{" "}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-200">
          yield*
        </code>
        , everything else follows naturally.
      </p>
    ),
  },
  {
    question: "How do I convince my team to start using Effect?",
    answer: (
      <>
        <p>Start small. Pick one problem everyone hates:</p>
        <ul className="mt-2 mb-4 list-disc space-y-1">
          <li>Dependency injection…</li>
          <li>Error management…</li>
          <li>Concurrency…</li>
        </ul>
        <p>Let the quality of the code speak for itself.</p>
      </>
    ),
  },
  {
    question: "What about performance overhead?",
    answer: (
      <>
        <p>
          Effect prevents the <em>real</em> performance killers:
        </p>
        <ul className="mt-2 mb-4 list-disc space-y-1">
          <li>Memory leaks</li>
          <li>Orphaned async ops</li>
          <li>Resource exhaustion</li>
          <li>Inconsistent error handling</li>
        </ul>
        <p>
          The runtime overhead is minimal, and the structured approach leads to more efficient code
          organization and execution.
        </p>
      </>
    ),
  },
  {
    question: "How does Effect compare to other libraries?",
    answer: (
      <>
        <p>
          Effect covers a broader scope than most libraries in the TypeScript ecosystem — combining
          async control, dependency management, error handling, and observability in one cohesive
          runtime.
        </p>
        <p className="mt-4">See how it compares to:</p>
        <ul className="mt-2 list-disc space-y-1">
          <li>
            <a
              className="text-inherit"
              href="https://effect.website/docs/additional-resources/myths/#effect-is-the-same-as-rxjs-and-shares-its-problems"
            >
              RxJS
            </a>
          </li>
          <li>
            <a
              className="text-inherit"
              href="https://effect.website/docs/additional-resources/effect-vs-fp-ts/"
            >
              fp-ts
            </a>
          </li>
          <li>
            <a
              className="text-inherit"
              href="https://effect.website/docs/additional-resources/effect-vs-neverthrow/"
            >
              Neverthrow
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "Is it possible to adopt Effect in an existing codebase?",
    answer: (
      <>
        <p>
          Yes! You can start small, wrapping existing async code or APIs in Effect and expanding
          from there:
        </p>
        <pre className="mt-3 mb-3 overflow-x-auto border border-zinc-800 bg-zinc-900/50 p-4">
          <code className="font-mono text-sm text-zinc-300">
            <span className="text-zinc-400">{"// Enter the Effect world"}</span>
            {"\n"}
            {"Effect.tryPromise(() => nonEffectAPI())"}
            {"\n\n"}
            <span className="text-zinc-400">{"// Exit back to normal promises"}</span>
            {"\n"}
            {"Effect.runPromise(myProgram)"}
          </code>
        </pre>
        <p>
          From there, you can progressively refactor leaf modules into Effects, moving upward
          through your codebase.
        </p>
      </>
    ),
  },
]

export default function FrequentlyAskedQuestions() {
  return (
    <Accordion multiple className="space-y-4">
      {FAQS.map(({ question, answer }) => (
        <AccordionItem
          key={question}
          value={question}
          className={cn(
            "rounded-md border border-zinc-700",
            "hover:border-zinc-600 hover:bg-zinc-900/50",
            "data-open:border-zinc-700 data-open:bg-zinc-900/40",
          )}
        >
          <AccordionTrigger
            className={cn(
              "px-5 py-4",
              "bg-transparent hover:bg-transparent",
              "text-base leading-snug font-medium text-zinc-300 hover:text-white aria-expanded:text-white",
              "cursor-pointer hover:no-underline",
            )}
          >
            {question}
          </AccordionTrigger>
          <AccordionContent className="px-5! pb-5! pt-0! text-[15px]! leading-relaxed! text-zinc-400!">
            {answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
