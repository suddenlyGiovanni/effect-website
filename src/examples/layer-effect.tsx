import { Context, Effect, Layer } from "effect-legacy";
import { useMemo } from "react";
import { EffectExample } from "@/components/display";
import { StringResult } from "@/components/renderers";
import { useVisualEffect } from "@/hooks/useVisualEffects";
import type { ExampleComponentProps } from "@/lib/example-types";

// Define a Config service using Effect.Service with effectful initialization
class Config extends Effect.Service<Config>()("Config", {
	effect: Effect.gen(function* () {
		// Simulate loading config (could be from file, env, etc.)
		yield* Effect.sleep("100 millis");
		const data: Record<string, string> = {
			apiUrl: "https://api.example.com",
			timeout: "5000",
		};
		return {
			get: (key: string) => Effect.succeed(data[key] ?? `Unknown key: ${key}`),
		};
	}),
}) {}

export function LayerEffectExample({
	exampleId,
	index,
	metadata,
}: ExampleComponentProps) {
	const configTask = useVisualEffect("config", () =>
		Effect.gen(function* () {
			const config = yield* Config;
			const url = yield* config.get("apiUrl");
			return new StringResult(url);
		}).pipe(Effect.provide(Config.Default)),
	);

	const codeSnippet = `class Config extends Effect.Service<Config>()("Config", {
  effect: Effect.gen(function* () {
    // Load config from file, env, API...
    const data = yield* loadConfigFromFile()
    return { get: (key) => Effect.succeed(data[key]) }
  })
}) {}

const program = Effect.gen(function* () {
  const config = yield* Config
  return yield* config.get("apiUrl")
})

Effect.runPromise(program.pipe(Effect.provide(Config.Default)))`;

	const taskHighlightMap = useMemo(
		() => ({
			config: {
				text: 'config.get("apiUrl")',
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
			effects={useMemo(() => [configTask], [configTask])}
			effectHighlightMap={taskHighlightMap}
			{...(index !== undefined && { index })}
			exampleId={exampleId}
		/>
	);
}

export default LayerEffectExample;
