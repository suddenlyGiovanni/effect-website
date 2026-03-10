import { motion } from "motion/react"
import type { VisualEffectNotification } from "@/lib/examples/domain"

export function VisualEffectNotificationBubble({
  notification,
  tone = "info",
}: {
  readonly notification: VisualEffectNotification
  readonly tone?: "info" | "failure" | "death"
}) {
  const styles =
    tone === "failure"
      ? {
          bubble:
            "bg-red-500 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35),0_4px_16px_rgba(239,68,68,0.35)]",
          arrow: "border-t-red-500",
        }
      : tone === "death"
        ? {
            bubble:
              "border border-red-600/90 bg-black/95 text-red-600 shadow-[0_10px_30px_rgba(0,0,0,0.45),0_4px_16px_rgba(220,38,38,0.35)]",
            arrow: "border-t-black/95",
          }
        : {
            bubble:
              "bg-sky-500 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35),0_4px_16px_rgba(14,165,233,0.35)]",
            arrow: "border-t-sky-500",
          }

  return (
    <motion.div
      className="pointer-events-none absolute bottom-full left-1/2 z-20 -translate-x-1/2"
      initial={{ opacity: 0, scale: 0.85, y: 12, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.85, y: 12, filter: "blur(8px)" }}
      transition={{ type: "spring", bounce: 0.12, visualDuration: 0.28 }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          <div
            className={`max-w-[220px] rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${styles.bubble}`}
          >
            <span>{notification.message}</span>
          </div>
          <div
            className={`absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent ${styles.arrow}`}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
