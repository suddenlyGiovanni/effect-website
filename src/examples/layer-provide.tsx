import { Effect, Layer } from "effect-legacy";
import { useMemo } from "react";
import { EffectExample } from "@/components/display";
import { StringResult } from "@/components/renderers";
import { useVisualEffect } from "@/hooks/useVisualEffects";
import type { ExampleComponentProps } from "@/lib/example-types";

// Config service
class Config extends Effect.Service<Config>()("Config", {
	succeed: {
		dbUrl: "postgres://localhost/mydb",
	},
}) {}

// Logger service
class Logger extends Effect.Service<Logger>()("Logger", {
	succeed: {
		info: (msg: string) => Effect.log(msg),
	},
}) {}

// Database service that depends on Config and Logger
class Database extends Effect.Service<Database>()("Database", {
	effect: Effect.gen(function* () {
		const config = yield* Config;
		const logger = yield* Logger;
		return {
			query: (sql: string) =>
				Effect.gen(function* () {
					yield* logger.info(`Executing: ${sql}`);
					return `Results from ${config.dbUrl}`;
				}),
		};
	}),
	dependencies: [Config.Default, Logger.Default],
}) {}

export function LayerProvideExample({
	exampleId,
	index,
	metadata,
}: ExampleComponentProps) {
	const queryTask = useVisualEffect("query", () =>
		Effect.gen(function* () {
			const db = yield* Database;
			const result = yield* db.query("SELECT * FROM users");
			return new StringResult(result);
		}).pipe(Effect.provide(Database.Default)),
	);

	const codeSnippet = `class Database extends Effect.Service<Database>()("Database", {
  effect: Effect.gen(function* () {
    const config = yield* Config
    const logger = yield* Logger
    return {
      query: (sql) => Effect.gen(function* () {
        yield* logger.info(\`Executing: \${sql}\`)
        return \`Results from \${config.dbUrl}\`
      })
    }
  }),
  dependencies: [Config.Default, Logger.Default]
}) {}

const program = Effect.gen(function* () {
  const db = yield* Database
  return yield* db.query("SELECT * FROM users")
})

Effect.runPromise(program.pipe(Effect.provide(Database.Default)))`;

	const taskHighlightMap = useMemo(
		() => ({
			query: {
				text: 'db.query("SELECT * FROM users")',
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
			effects={useMemo(() => [queryTask], [queryTask])}
			effectHighlightMap={taskHighlightMap}
			{...(index !== undefined && { index })}
			exampleId={exampleId}
		/>
	);
}

export default LayerProvideExample;
