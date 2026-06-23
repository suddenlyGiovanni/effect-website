import * as Atom from "effect/unstable/reactivity/Atom"
import { loaderStepsAtom } from "../services/loader"

export const isLoadedAtom = loaderStepsAtom.pipe(
  Atom.map((steps) => steps.some((step) => step.message === "Starting playground" && step.done)),
)
