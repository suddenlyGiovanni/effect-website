import { Context, Effect, Layer } from "effect-legacy";
import { useMemo } from "react";
import { EffectExample } from "@/components/display";
import { StringResult } from "@/components/renderers";
import { useVisualEffect } from "@/hooks/useVisualEffects";
import type { ExampleComponentProps } from "@/lib/example-types";

// Define a simple Logger service using Effect.Service
class Logger extends Effect.Service<Logger>()("Logger", {
	succeed: {
		log: (message: string) => Effect.succeed(`[LOG] ${message}`),
	},
}) {}

export function EffectServiceExample({
	exampleId,
	index,
	metadata,
}: ExampleComponentProps) {
	const logTask = useVisualEffect("log", () =>
		Effect.gen(function* () {
			const logger = yield* Logger;
			const result = yield* logger.log("Hello, Effect!");
			return new StringResult(result);
		}).pipe(Effect.provide(Logger.Default)),
	);

	const codeSnippet = `class Logger extends Effect.Service<Logger>()("Logger", {
  succeed: {
    log: (msg: string) => Effect.succeed(\`[LOG] \${msg}\`)
  }
}) {}

const program = Effect.gen(function* () {
  const logger = yield* Logger
  return yield* logger.log("Hello, Effect!")
})

Effect.runPromise(program.pipe(Effect.provide(Logger.Default)))`;

	const taskHighlightMap = useMemo(
		() => ({
			log: {
				text: 'logger.log("Hello, Effect!")',
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
			effects={useMemo(() => [logTask], [logTask])}
			effectHighlightMap={taskHighlightMap}
			{...(index !== undefined && { index })}
			exampleId={exampleId}
		/>
	);
}

export default EffectServiceExample;
