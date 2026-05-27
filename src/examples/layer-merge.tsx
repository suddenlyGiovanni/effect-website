import { Effect, Layer } from "effect-legacy";
import { useMemo } from "react";
import { EffectExample } from "@/components/display";
import { StringResult } from "@/components/renderers";
import { useVisualEffect } from "@/hooks/useVisualEffects";
import type { ExampleComponentProps } from "@/lib/example-types";

// Auth service
class Auth extends Effect.Service<Auth>()("Auth", {
	succeed: {
		getUser: () => Effect.succeed("alice@example.com"),
	},
}) {}

// Cache service
class Cache extends Effect.Service<Cache>()("Cache", {
	succeed: {
		get: (key: string) =>
			Effect.succeed(key === "session" ? "abc123" : undefined),
	},
}) {}

// Merge independent layers
const AppLayer = Layer.merge(Auth.Default, Cache.Default);

export function LayerMergeExample({
	exampleId,
	index,
	metadata,
}: ExampleComponentProps) {
	const appTask = useVisualEffect("app", () =>
		Effect.gen(function* () {
			const auth = yield* Auth;
			const cache = yield* Cache;
			const user = yield* auth.getUser();
			const session = yield* cache.get("session");
			return new StringResult(`${user} (${session})`);
		}).pipe(Effect.provide(AppLayer)),
	);

	const codeSnippet = `class Auth extends Effect.Service<Auth>()("Auth", {
  succeed: {
    getUser: () => Effect.succeed("alice@example.com")
  }
}) {}

class Cache extends Effect.Service<Cache>()("Cache", {
  succeed: {
    get: (key) => Effect.succeed(data[key])
  }
}) {}

// Merge independent services into one layer
const AppLayer = Layer.merge(Auth.Default, Cache.Default)

const program = Effect.gen(function* () {
  const auth = yield* Auth
  const cache = yield* Cache
  const user = yield* auth.getUser()
  const session = yield* cache.get("session")
  return \`\${user} (\${session})\`
})

Effect.runPromise(program.pipe(Effect.provide(AppLayer)))`;

	const taskHighlightMap = useMemo(
		() => ({
			app: {
				text: "Layer.merge(Auth.Default, Cache.Default)",
			},
		}),
		[],
	);

	return (
		<EffectExample
			name={metadata.name}
			{...(metadata.variant && { variant: metadata.variant })}
			description={metadata.description}
			code={codeSnippet}
			effects={useMemo(() => [appTask], [appTask])}
			effectHighlightMap={taskHighlightMap}
			{...(index !== undefined && { index })}
			exampleId={exampleId}
		/>
	);
}

export default LayerMergeExample;
