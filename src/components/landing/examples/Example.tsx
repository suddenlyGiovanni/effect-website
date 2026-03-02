import { Play } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { type ExampleId } from "@/lib/examples/ids"

export function Example({ id }: { readonly id: ExampleId }) {
  console.log({ id })
  return (
    <div className="w-fit min-w-full flex flex-col border shadow-2xl">
      <ExampleHeader />
    </div>
  )
}

function ExampleHeader() {
  return (
    <div className="flex px-6 py-4 bg-zinc-800 border-b">
      <motion.button
        className="flex items-start gap-3 flex-1 -m-2 p-2 bg-zinc-950 rounded-lg whitespace-nowrap cursor-pointer"
        initial={{ backgroundColor: "rgb(255, 255, 255, 0)" }}
        whileHover={{
          backgroundColor: "rgb(255, 255, 255, 0.05)",
          transition: { backgroundColor: { duration: 0.15, ease: "easeInOut" } },
        }}
        aria-label="Play"
      >
        <span className="size-10 shrink-0 flex justify-center items-center border border-zinc-500 text-white rounded-md">
          <AnimatePresence mode="popLayout">
            <motion.span
              key="play"
              className="flex items-center"
              initial={{ scale: 0.8, opacity: 0, filter: "blur(4px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 0.8, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Play fill="currentColor" />
            </motion.span>
          </AnimatePresence>
        </span>

        <span className="flex flex-1 justify-between gap-4 text-neutral-400">
          <span className="flex flex-col gap-1">
            <span className="flex items-baseline gap-2 text-base font-mono font-semibold leading-tighter">
              <span className="text-white">Effect.retry</span>
              <span className="font-medium">times</span>
            </span>
            <span className="text-sm leading-4">Retry an Effect a fixed number of times</span>
          </span>
          <span className="-mt-1 text-xs font-mono">Click to run an Effect</span>
        </span>
      </motion.button>
    </div>
  )
}
