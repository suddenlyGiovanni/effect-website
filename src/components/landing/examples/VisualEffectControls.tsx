import * as React from "react"
import { motion } from "motion/react"
import * as Atom from "effect/unstable/reactivity/Atom"
import { useAtomValue } from "@effect/atom-react"
import { canReset, currentExampleAtom, VisualEffectState } from "@/atoms/visual-effect"
import { VisualEffectControlsIcon } from "./VisualEffectControlsIcon"
import { useExampleControls, useProgramState } from "./VisualEffectProvider"

export function VisualEffectControls() {
  const example = useAtomValue(currentExampleAtom)
  const programState = useProgramState()
  const { startExample, stopExample, resetExample } = useExampleControls()
  const [isHovered, setIsHovered] = React.useState(false)
  const [isPressed, setIsPressed] = React.useState(false)
  const isRunning = VisualEffectState.$is("Running")(programState)

  const handleClick = () => {
    if (isRunning) {
      stopExample()
    } else if (canReset(programState)) {
      resetExample(Atom.Reset)
    } else {
      startExample()
    }
  }

  const title = example.label.title
  const subtitle = example.label.subtitle

  return (
    <div className="flex px-6 py-4 bg-zinc-800 border-b">
      <motion.button
        className="flex items-start gap-3 flex-1 -m-2 p-2 bg-zinc-950 rounded-lg whitespace-nowrap cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onClick={handleClick}
        initial={{ backgroundColor: "rgb(255, 255, 255, 0)" }}
        whileHover={{
          backgroundColor: "rgb(255, 255, 255, 0.05)",
          transition: { backgroundColor: { duration: 0.15, ease: "easeInOut" } },
        }}
        aria-label={isRunning ? "Stop example" : "Run example"}
      >
        <VisualEffectControlsIcon
          isHovered={isHovered}
          isPressed={isPressed}
          state={programState}
        />

        <span className="flex flex-1 justify-between gap-4 text-neutral-400">
          <span className="flex flex-col gap-1">
            <span className="flex items-baseline gap-2 text-base font-mono font-semibold leading-tighter">
              <span className="text-white">{title}</span>
              {subtitle && <span className="font-medium">{subtitle}</span>}
            </span>
            <span className="text-sm leading-4">{example.description}</span>
          </span>
          <span className="-mt-1 text-xs font-mono">
            {isRunning ? "Click to stop" : "Click to run an Effect"}
          </span>
        </span>
      </motion.button>
    </div>
  )
}
