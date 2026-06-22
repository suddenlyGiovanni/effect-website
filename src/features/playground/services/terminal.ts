import { FitAddon } from "@xterm/addon-fit"
import { type ITerminalInitOnlyOptions, type ITerminalOptions, Terminal as XTerm } from "@xterm/xterm"
import { Context, Effect, Layer } from "effect"

export class Terminal extends Context.Service<Terminal>()("app/Terminal", {
  make: Effect.gen(function* () {
    const spawn = (options: ITerminalOptions | ITerminalInitOnlyOptions) =>
      Effect.gen(function* () {
        const terminal = yield* Effect.acquireRelease(
          Effect.sync(() => new XTerm(options)),
          (terminal) => Effect.sync(() => terminal.dispose())
        )

        const fitAddon = new FitAddon()
        terminal.loadAddon(fitAddon)

        const prevOpen = terminal.open
        terminal.open = function () {
          prevOpen.apply(terminal, arguments as any)
          fitAddon.fit()
        }

        return {
          terminal,
          resize: Effect.sync(() => {
            fitAddon.fit()
          })
        }
      })

    return {
      spawn
    } as const
  })
}) {
  static readonly layer = Layer.effect(this, this.make)
}
