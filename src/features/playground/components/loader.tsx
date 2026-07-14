import { useAtomValue } from "@effect/atom-react"
import { motion, AnimatePresence } from "framer-motion"
import { CircleCheck, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { isLoadedAtom } from "../atoms/loader"
import { loaderStepsAtom } from "../services/loader"

export function PlaygroundLoader() {
  const isReady = useAtomValue(isLoadedAtom)
  const [isVisible, setIsVisible] = useState(true)
  const steps = useAtomValue(loaderStepsAtom, (steps) => {
    return steps.every((step) => step.done)
      ? steps
      : steps.slice(0, steps.findIndex((step) => !step.done) + 1)
  })

  // Keep the overlay mounted for the commit where `isReady` first becomes true.
  // The final loader steps can be added and completed in the same React batch;
  // hiding from render immediately would skip painting those completed steps.
  useEffect(() => {
    if (isReady) {
      setIsVisible(false)
    }
  }, [isReady])

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"
        >
          <div className="flex w-full max-w-md rounded-sm bg-zinc-100 px-4 pt-4 pb-8 text-zinc-900 shadow-lg md:pt-8 dark:bg-zinc-900 dark:text-white">
            <div className="m-auto flex flex-col justify-center">
              <h2 className="mb-6 text-center text-2xl font-bold">Loading the Effect Playground</h2>
              <div className="flex flex-col space-y-4">
                <AnimatePresence initial={false}>
                  {steps.map((step) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="flex w-full max-w-[280px] items-center space-x-3"
                    >
                      <motion.div
                        className="flex"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                      >
                        {step.done ? (
                          <CircleCheck className="h-6 w-6 text-green-500" />
                        ) : (
                          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        )}
                      </motion.div>
                      <span
                        className={step.done ? "text-zinc-500" : "text-zinc-900 dark:text-white"}
                      >
                        {step.message}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
