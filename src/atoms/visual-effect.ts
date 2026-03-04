import * as Atom from "effect/unstable/reactivity/Atom"
import { type ExampleCategory } from "@/lib/examples/catalog"

export const currentExampleCategoryAtom = Atom.make("concurrency" as ExampleCategory)
