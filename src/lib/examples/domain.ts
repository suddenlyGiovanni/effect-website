import * as Schema from "effect/Schema"

export const ExampleKey = Schema.String.pipe(Schema.brand("ExampleKey"))
export type ExampleKey = typeof ExampleKey.Type

export const ProgramLabel = Schema.String.pipe(Schema.brand("ProgramLabel"))
export type ProgramLabel = typeof ProgramLabel.Type

export const StepLabel = Schema.String.pipe(Schema.brand("StepLabel"))
export type StepLabel = typeof StepLabel.Type

export const Event = Schema.TaggedUnion({
  ProgramStarted: {
    key: ExampleKey,
    label: ProgramLabel,
    timestamp: Schema.DateTimeUtcFromMillis,
  },
  ProgramSucceeded: {
    key: ExampleKey,
    label: ProgramLabel,
    duration: Schema.DurationFromMillis,
    timestamp: Schema.DateTimeUtcFromMillis,
    value: Schema.Unknown,
  },
  ProgramFailed: {
    key: ExampleKey,
    label: ProgramLabel,
    duration: Schema.DurationFromMillis,
    timestamp: Schema.DateTimeUtcFromMillis,
    error: Schema.Unknown,
  },
  ProgramInterrupted: {
    key: ExampleKey,
    label: ProgramLabel,
    duration: Schema.DurationFromMillis,
    timestamp: Schema.DateTimeUtcFromMillis,
  },
  ProgramDied: {
    key: ExampleKey,
    label: ProgramLabel,
    duration: Schema.DurationFromMillis,
    timestamp: Schema.DateTimeUtcFromMillis,
    defect: Schema.Unknown,
  },
  StepStarted: {
    key: ExampleKey,
    label: StepLabel,
    timestamp: Schema.DateTimeUtcFromMillis,
  },
  StepSucceeded: {
    key: ExampleKey,
    label: StepLabel,
    timestamp: Schema.DateTimeUtcFromMillis,
    duration: Schema.DurationFromMillis,
    value: Schema.Unknown,
  },
  StepFailed: {
    key: ExampleKey,
    label: StepLabel,
    timestamp: Schema.DateTimeUtcFromMillis,
    duration: Schema.DurationFromMillis,
    error: Schema.Unknown,
  },
  StepInterrupted: {
    key: ExampleKey,
    label: StepLabel,
    timestamp: Schema.DateTimeUtcFromMillis,
    duration: Schema.DurationFromMillis,
  },
  StepDied: {
    key: ExampleKey,
    label: StepLabel,
    timestamp: Schema.DateTimeUtcFromMillis,
    duration: Schema.DurationFromMillis,
    defect: Schema.Unknown,
  },
})
export type Event = typeof Event.Type

export class DuplicateStepNodeId extends Schema.TaggedErrorClass<DuplicateStepNodeId>()(
  "DuplicateStepNodeId",
  {
    key: ExampleKey,
    nodeId: StepLabel,
  },
) {}
