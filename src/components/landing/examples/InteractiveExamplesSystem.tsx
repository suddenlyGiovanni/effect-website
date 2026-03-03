import { RegistryProvider } from "@effect/atom-react"
import { EXAMPLES } from "@/lib/examples/catalog"
import { ExampleSystem } from "./ExampleSystem"

export function InteractiveExamplesSystem() {
  return (
    <RegistryProvider defaultIdleTTL={2_000}>
      <div className="flex flex-col gap-5">
        {EXAMPLES.map((example) => (
          <ExampleSystem key={example.key} example={example} />
        ))}
      </div>
    </RegistryProvider>
  )
}
