import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PodcastTranscriptCue } from "../domain";
import {
  useActiveTranscriptCue,
  usePauseAutoScroll,
  usePodcastEpisode,
  useResumeAutoScroll,
  useSeekToCue,
  useShouldAutoFollowTranscript,
} from "../context/PodcastContext";

export function PodcastTranscript() {
  const autoScrollSettleDelayMs = 150;
  const episode = usePodcastEpisode();
  const activeTranscriptCue = useActiveTranscriptCue();
  const seekToCue = useSeekToCue();
  const pauseAutoScroll = usePauseAutoScroll();
  const resumeAutoScroll = useResumeAutoScroll();
  const shouldAutoFollowTranscript = useShouldAutoFollowTranscript();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const cueElementMapRef = React.useRef(new Map<string, HTMLButtonElement>());
  const suppressScrollEventRef = React.useRef(false);
  const suppressScrollTimeoutRef = React.useRef<number | undefined>(undefined);
  const [isOpen, setIsOpen] = React.useState(true);
  const activeCueId = activeTranscriptCue?.id ?? episode.transcript[0]?.id;

  const clearSuppressScrollTimeout = React.useCallback(() => {
    if (suppressScrollTimeoutRef.current !== undefined) {
      window.clearTimeout(suppressScrollTimeoutRef.current);
      suppressScrollTimeoutRef.current = undefined;
    }
  }, []);

  const scheduleSuppressScrollRelease = React.useCallback(() => {
    clearSuppressScrollTimeout();
    suppressScrollTimeoutRef.current = window.setTimeout(() => {
      suppressScrollEventRef.current = false;
      suppressScrollTimeoutRef.current = undefined;
    }, autoScrollSettleDelayMs);
  }, [autoScrollSettleDelayMs, clearSuppressScrollTimeout]);

  const handleSeek = React.useCallback(
    (cue: PodcastTranscriptCue) => {
      resumeAutoScroll();
      seekToCue(cue);
    },
    [resumeAutoScroll, seekToCue],
  );

  const setCueElement = React.useCallback(
    (cueId: string, element: HTMLButtonElement | null) => {
      if (element) {
        cueElementMapRef.current.set(cueId, element);
      } else {
        cueElementMapRef.current.delete(cueId);
      }
    },
    [],
  );

  React.useEffect(() => {
    const root = rootRef.current;

    if (root === null) {
      return;
    }

    const viewport = root.querySelector('[data-slot="scroll-area-viewport"]');

    if (!(viewport instanceof HTMLElement)) {
      return;
    }

    const handleScroll = () => {
      if (suppressScrollEventRef.current) {
        scheduleSuppressScrollRelease();
        return;
      }
      pauseAutoScroll();
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });

    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [pauseAutoScroll, scheduleSuppressScrollRelease]);

  React.useEffect(() => {
    if (
      !isOpen ||
      !shouldAutoFollowTranscript ||
      activeCueId === undefined ||
      typeof window === "undefined"
    ) {
      return;
    }

    const element = cueElementMapRef.current.get(activeCueId);
    const root = rootRef.current;

    if (!element || !root) {
      return;
    }

    const viewport = root.querySelector('[data-slot="scroll-area-viewport"]');

    if (!(viewport instanceof HTMLElement)) {
      return;
    }

    suppressScrollEventRef.current = true;
    scheduleSuppressScrollRelease();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const viewportRect = viewport.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const elementTop = elementRect.top - viewportRect.top + viewport.scrollTop;
    const targetTop = Math.max(
      0,
      elementTop - viewport.clientHeight / 2 + elementRect.height / 2,
    );

    viewport.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });

    return () => {
      clearSuppressScrollTimeout();
      suppressScrollEventRef.current = false;
    };
  }, [
    activeCueId,
    clearSuppressScrollTimeout,
    isOpen,
    scheduleSuppressScrollRelease,
    shouldAutoFollowTranscript,
  ]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-lg border border-zinc-700 bg-card"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-card px-4 py-3 transition-colors hover:bg-accent/50 data-panel-open:rounded-b-none">
        <h2 className="text-sm font-semibold">Transcript</h2>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div ref={rootRef} className="border-t bg-card">
          <ScrollArea className="h-80 p-2 lg:max-h-[min(20rem,40vh)]">
            <ul className="space-y-1 pr-2">
              {episode.transcript.map((cue) => {
                const isActive = cue === activeTranscriptCue;

                return (
                  <li key={cue.id} className="list-none">
                    <button
                      ref={(element) => setCueElement(cue.id, element)}
                      type="button"
                      onClick={() => handleSeek(cue)}
                      aria-current={isActive ? "true" : undefined}
                      aria-label={`Jump to ${cue.startLabel}`}
                      className={cn(
                        "group flex w-full cursor-pointer items-baseline gap-4 rounded-md bg-inherit px-3 py-2.5 text-left hover:bg-accent/50",
                        isActive && "bg-accent",
                      )}
                    >
                      <code className="shrink-0 font-mono text-xs leading-relaxed text-muted-foreground">
                        {cue.startLabel}
                      </code>
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-sm leading-relaxed text-zinc-300",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {cue.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
