import { useCallback, useEffect, useRef, useState } from "react"
import {
  ExampleCard,
  type ExampleNodeSpec,
} from "@/components/landing/examples/ExampleCard"
import {
  type SoundName,
  useInteractionSounds,
} from "@/components/landing/examples/use-interaction-sounds"
import { formatResultForNode, truncateResultLabel } from "@/lib/interactive-examples/format-result"
import {
  getInteractiveExampleMeta,
  INTERACTIVE_EXAMPLE_ROW_1,
  INTERACTIVE_EXAMPLE_ROW_2,
} from "@/lib/interactive-examples/manifest"
import {
  createEffectDieProgram,
  createEffectFailProgram,
  createEffectSleepProgram,
  createEffectSucceedProgram,
  createOrElseQuestionProgram,
  createOrElseShootProgram,
} from "@/lib/interactive-examples/programs"
import {
  createIdleInteractiveTaskState,
  type InteractiveExampleId,
  interactiveTaskIsTerminal,
  type InteractiveTaskState,
  type InteractiveTaskStateTag,
} from "@/lib/interactive-examples/types"
import { useVisualTask, useVisualTaskState } from "@/lib/interactive-examples/use-visual-task"
import { InteractiveVisualTask } from "@/lib/interactive-examples/visual-task"

const getErrorLabel = (error: unknown) => {
  if (typeof error === "string") {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Error"
}

const getResultLabel = (state: InteractiveTaskState<unknown, unknown>) => {
  if (state.tag !== "completed") {
    return undefined
  }

  return truncateResultLabel(formatResultForNode(state.result))
}

const useTaskStateAudio = (
  stateTag: InteractiveTaskStateTag,
  playSound: (name: SoundName) => void,
) => {
  const previousStateTag = useRef<InteractiveTaskStateTag | undefined>(undefined)

  useEffect(() => {
    const previous = previousStateTag.current

    if (previous === undefined) {
      previousStateTag.current = stateTag
      return
    }

    if (previous !== stateTag) {
      if (stateTag === "running") {
        playSound("run")
      } else if (stateTag === "completed") {
        playSound("success")
      } else if (stateTag === "failed") {
        playSound("failure")
      } else if (stateTag === "interrupted") {
        playSound("interrupt")
      } else if (stateTag === "death") {
        playSound("death")
      }
    }

    previousStateTag.current = stateTag
  }, [playSound, stateTag])
}

const createSingleNodeList = (label: string, state: InteractiveTaskState<unknown, unknown>) => {
  const nodes: ReadonlyArray<ExampleNodeSpec> = [
    {
      key: label,
      label,
      state,
      resultLabel: getResultLabel(state),
    },
  ]

  return nodes
}

export default function InteractiveExamplesIsland() {
  const { playSound } = useInteractionSounds()

  const succeedTask = useVisualTask("value", createEffectSucceedProgram)
  const failTask = useVisualTask("error", createEffectFailProgram)
  const dieTask = useVisualTask("death", createEffectDieProgram)
  const sleepTask = useVisualTask("sleep", createEffectSleepProgram)

  const orElseCycleReference = useRef(0)
  const activeOrElseCycleReference = useRef(0)
  const orElseRunVersionReference = useRef(0)

  const shootTask = useVisualTask("shoot", () => {
    return createOrElseShootProgram(activeOrElseCycleReference.current)
  })
  const questionTask = useVisualTask("question", () => {
    return createOrElseQuestionProgram(activeOrElseCycleReference.current)
  })

  const succeedState = useVisualTaskState(succeedTask)
  const failState = useVisualTaskState(failTask)
  const dieState = useVisualTaskState(dieTask)
  const sleepState = useVisualTaskState(sleepTask)
  const shootState = useVisualTaskState(shootTask)
  const questionState = useVisualTaskState(questionTask)

  const [orElseResultState, setOrElseResultState] = useState<InteractiveTaskState<string, string>>(
    createIdleInteractiveTaskState(),
  )

  useTaskStateAudio(succeedState.tag, playSound)
  useTaskStateAudio(failState.tag, playSound)
  useTaskStateAudio(dieState.tag, playSound)
  useTaskStateAudio(sleepState.tag, playSound)
  useTaskStateAudio(orElseResultState.tag, playSound)

  const handleSimpleTaskAction = <A, E>(
    task: InteractiveVisualTask<A, E>,
    state: InteractiveTaskState<A, E>,
  ) => {
    if (state.tag === "running") {
      task.interrupt()
      return
    }

    if (interactiveTaskIsTerminal(state)) {
      task.reset()
      playSound("reset")
      return
    }

    void task.run()
  }

  const resetOrElse = useCallback(() => {
    orElseRunVersionReference.current = orElseRunVersionReference.current + 1
    shootTask.reset()
    questionTask.reset()
    setOrElseResultState(createIdleInteractiveTaskState())
    playSound("reset")
  }, [playSound, questionTask, shootTask])

  const runOrElse = useCallback(async () => {
    const runVersion = orElseRunVersionReference.current + 1
    orElseRunVersionReference.current = runVersion

    activeOrElseCycleReference.current = orElseCycleReference.current
    orElseCycleReference.current = orElseCycleReference.current + 1

    shootTask.reset()
    questionTask.reset()
    setOrElseResultState({ tag: "running" })

    const shootResult = await shootTask.run()

    if (runVersion !== orElseRunVersionReference.current) {
      return
    }

    if (shootResult.tag === "completed") {
      setOrElseResultState({ tag: "completed", result: shootResult.result })
      return
    }

    if (shootResult.tag === "failed") {
      const questionResult = await questionTask.run()

      if (runVersion !== orElseRunVersionReference.current) {
        return
      }

      if (questionResult.tag === "completed") {
        setOrElseResultState({ tag: "completed", result: questionResult.result })
        return
      }

      if (questionResult.tag === "failed") {
        setOrElseResultState({ tag: "failed", error: getErrorLabel(questionResult.error) })
        return
      }

      if (questionResult.tag === "interrupted") {
        setOrElseResultState({ tag: "interrupted" })
        return
      }

      if (questionResult.tag === "death") {
        setOrElseResultState({ tag: "death", defect: questionResult.defect })
        return
      }

      setOrElseResultState(createIdleInteractiveTaskState())
      return
    }

    if (shootResult.tag === "interrupted") {
      setOrElseResultState({ tag: "interrupted" })
      return
    }

    if (shootResult.tag === "death") {
      setOrElseResultState({ tag: "death", defect: shootResult.defect })
      return
    }

    setOrElseResultState(createIdleInteractiveTaskState())
  }, [questionTask, shootTask])

  const handleOrElseAction = useCallback(() => {
    if (orElseResultState.tag === "running") {
      orElseRunVersionReference.current = orElseRunVersionReference.current + 1
      shootTask.interrupt()
      questionTask.interrupt()
      setOrElseResultState({ tag: "interrupted" })
      return
    }

    if (interactiveTaskIsTerminal(orElseResultState)) {
      resetOrElse()
      return
    }

    void runOrElse()
  }, [orElseResultState, questionTask, resetOrElse, runOrElse, shootTask])

  const resolveNodes = (exampleId: InteractiveExampleId): ReadonlyArray<ExampleNodeSpec> => {
    if (exampleId === "effect-succeed") {
      return createSingleNodeList("value", succeedState)
    }

    if (exampleId === "effect-fail") {
      return createSingleNodeList("error", failState)
    }

    if (exampleId === "effect-die") {
      return createSingleNodeList("death", dieState)
    }

    if (exampleId === "effect-sleep") {
      return createSingleNodeList("sleep", sleepState)
    }

    return [
      {
        key: "shoot",
        label: "shoot",
        state: shootState,
        resultLabel: getResultLabel(shootState),
      },
      {
        key: "question",
        label: "question",
        state: questionState,
        resultLabel: getResultLabel(questionState),
      },
      {
        key: "result",
        label: "result",
        state: orElseResultState,
        resultLabel:
          orElseResultState.tag === "failed"
            ? truncateResultLabel(getErrorLabel(orElseResultState.error))
            : getResultLabel(orElseResultState),
      },
    ]
  }

  const resolveState = (
    exampleId: InteractiveExampleId,
  ): InteractiveTaskState<unknown, unknown> => {
    if (exampleId === "effect-succeed") {
      return succeedState
    }

    if (exampleId === "effect-fail") {
      return failState
    }

    if (exampleId === "effect-die") {
      return dieState
    }

    if (exampleId === "effect-sleep") {
      return sleepState
    }

    return orElseResultState
  }

  const resolveAction = (exampleId: InteractiveExampleId) => {
    if (exampleId === "effect-succeed") {
      return () => {
        handleSimpleTaskAction(succeedTask, succeedState)
      }
    }

    if (exampleId === "effect-fail") {
      return () => {
        handleSimpleTaskAction(failTask, failState)
      }
    }

    if (exampleId === "effect-die") {
      return () => {
        handleSimpleTaskAction(dieTask, dieState)
      }
    }

    if (exampleId === "effect-sleep") {
      return () => {
        handleSimpleTaskAction(sleepTask, sleepState)
      }
    }

    return handleOrElseAction
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-3">
        {INTERACTIVE_EXAMPLE_ROW_1.map((exampleId) => {
          const meta = getInteractiveExampleMeta(exampleId)

          return (
            <ExampleCard
              key={exampleId}
              title={meta.name}
              description={meta.description}
              code={meta.code}
              nodes={resolveNodes(exampleId)}
              state={resolveState(exampleId)}
              onAction={resolveAction(exampleId)}
            />
          )
        })}
      </div>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2">
        {INTERACTIVE_EXAMPLE_ROW_2.map((exampleId) => {
          const meta = getInteractiveExampleMeta(exampleId)

          return (
            <ExampleCard
              key={exampleId}
              title={meta.name}
              description={meta.description}
              code={meta.code}
              nodes={resolveNodes(exampleId)}
              state={resolveState(exampleId)}
              onAction={resolveAction(exampleId)}
            />
          )
        })}
      </div>
    </div>
  )
}
