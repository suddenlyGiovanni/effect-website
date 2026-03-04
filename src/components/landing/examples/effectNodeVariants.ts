import type { Variants } from "motion/react"
import type { VisualEffectState } from "@/atoms/visual-effect"
import { COLORS, SPRINGS } from "@/lib/animation"

export const effectNodeVariants: Record<VisualEffectState["_tag"], Variants[string]> = {
  Idle: {
    scale: 1,
    opacity: 0.6,
    backgroundColor: COLORS.task.idle,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.default,
      opacity: SPRINGS.default,
    },
  },
  Running: {
    scale: 0.95,
    opacity: 1,
    backgroundColor: COLORS.task.running,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.default,
      opacity: SPRINGS.default,
    },
  },
  Succeeded: {
    scale: 1,
    opacity: 1,
    backgroundColor: COLORS.task.success,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.contentScale,
      opacity: SPRINGS.contentScale,
    },
  },
  Failed: {
    backgroundColor: COLORS.task.error,
    scale: 1,
    opacity: 1,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.contentScale,
      opacity: SPRINGS.contentScale,
    },
  },
  Died: {
    backgroundColor: COLORS.task.death,
    scale: 1,
    opacity: 1,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.contentScale,
      opacity: SPRINGS.contentScale,
    },
  },
  Interrupted: {
    backgroundColor: COLORS.task.interrupted,
    opacity: 1,
    scale: 1,
    transition: {
      backgroundColor: { duration: 0.1, ease: "easeInOut" },
      scale: SPRINGS.default,
      opacity: SPRINGS.default,
    },
  },
}
