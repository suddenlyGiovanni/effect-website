import { useAtomValue } from "@effect/atom-react"
import { motion, AnimatePresence } from "framer-motion"
import { CircleCheck, Loader2 } from "lucide-react"
import { isLoadedAtom } from "../atoms/loader"
import { loaderStepsAtom } from "../services/loader"

export function PlaygroundLoader() {
  const isReady = useAtomValue(isLoadedAtom)
  const steps = useAtomValue(loaderStepsAtom, (steps) => {
    return steps.every((step) => step.done) ? steps : steps.slice(0, steps.findIndex((step) => !step.done) + 1)
  })
  return (
    <AnimatePresence initial={false}>
      {!isReady && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center"
        >
          <div className="w-full flex max-w-md px-4 pb-8 pt-4 md:pt-8 rounded-sm bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-lg">
            <div className="m-auto flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-6 text-center">Loading the Effect Playground</h2>
              <div className="flex flex-col space-y-4">
                <AnimatePresence initial={false}>
                  {steps.map((step) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-full max-w-[280px] flex items-center space-x-3"
                    >
                      <motion.div
                        className="flex"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                      >
                        {step.done ? (
                          <CircleCheck className="w-6 h-6 text-green-500" />
                        ) : (
                          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                        )}
                      </motion.div>
                      <span className={step.done ? "text-zinc-500" : "text-zinc-900 dark:text-white"}>
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
