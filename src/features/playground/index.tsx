import { useCallback, Suspense } from "react"
import { SquareTerminalIcon, ChartGanttIcon } from "lucide-react"
import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { Group, Panel, Separator } from "react-resizable-panels"
import { FileEditor } from "./components/file-editor"
import { FileExplorer } from "./components/file-explorer"
import { PlaygroundLoader } from "./components/loader"
import { Terminal } from "./components/terminal"
import { TraceViewer } from "./components/trace-viewer"
import { WorkspaceProvider, useWorkspaceHandle, useWorkspaceShells } from "./context/workspace"
import { importAtom } from "./atoms/import"

export function CodeEditor() {
  const result = useAtomValue(importAtom)
  return AsyncResult.builder(result)
    .onSuccess((workspace) => (
      <>
        <PlaygroundLoader />
        <Suspense>
          <WorkspaceProvider workspace={workspace}>
            <CodeEditorPanels />
          </WorkspaceProvider>
        </Suspense>
      </>
    ))
    .render()
}

function CodeEditorPanels() {
  const { terminalSize } = useWorkspaceHandle()
  const setSize = useAtomSet(terminalSize)
  const onResize = useCallback(
    function (..._: any) {
      setSize()
    },
    [setSize]
  )
  return (
    <Group orientation="vertical" className="h-full">
      <Panel>
        <Group orientation="horizontal" className="h-full">
          <Panel defaultSize={20} minSize={10}>
            <FileExplorer />
          </Panel>
          <Separator className="w-px bg-zinc-200 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-500 transition-colors" />
          <Panel>
            <FileEditor />
          </Panel>
        </Group>
      </Panel>
      <Separator className="h-px bg-zinc-200 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-500 transition-colors" />
      <Panel defaultSize={30} minSize={10} onResize={onResize}>
        <div className="h-full flex flex-col">
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <TabButton id="terminal" defaultActive>
              <SquareTerminalIcon size={16} />
              <span>Terminal</span>
            </TabButton>
            <TabButton id="trace-viewer">
              <ChartGanttIcon size={16} />
              <span>Trace Viewer</span>
            </TabButton>
          </div>
          <div className="flex-1 overflow-hidden" data-tab-content>
            <WorkspaceShells />
          </div>
        </div>
      </Panel>
    </Group>
  )
}

function TabButton({
  id,
  defaultActive,
  children
}: {
  id: string
  defaultActive?: boolean
  children: React.ReactNode
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const container = e.currentTarget.closest("[data-tab-content]")?.parentElement
      if (!container) return
      const buttons = container.querySelectorAll("[data-tab-id]")
      const panels = container.querySelectorAll("[data-tab-panel]")
      buttons.forEach((btn) => {
        btn.setAttribute("data-active", String(btn.getAttribute("data-tab-id") === id))
      })
      panels.forEach((panel) => {
        const el = panel as HTMLElement
        el.style.display = panel.getAttribute("data-tab-panel") === id ? "" : "none"
      })
    },
    [id]
  )

  return (
    <button
      type="button"
      data-tab-id={id}
      data-active={defaultActive ? "true" : "false"}
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer data-[active=true]:border-zinc-900 data-[active=true]:text-zinc-900 data-[active=false]:border-transparent data-[active=false]:text-zinc-500 dark:data-[active=true]:border-white dark:data-[active=true]:text-white dark:data-[active=false]:text-zinc-400"
    >
      {children}
    </button>
  )
}

function WorkspaceShells() {
  const { terminalSize } = useWorkspaceHandle()
  const shells = useWorkspaceShells()
  const setSize = useAtomSet(terminalSize)
  const onResize = useCallback(
    function (..._: any) {
      setSize()
    },
    [setSize]
  )
  return (
    <>
      <div data-tab-panel="terminal" className="h-full">
        <Group orientation="horizontal">
          {shells.flatMap((shell, index) => {
            const id = `shell-${index}`
            const panel = (
              <Panel key={`panel-${id}`} id={id} onResize={onResize} className="h-full">
                <Terminal shell={shell} />
              </Panel>
            )
            if (index === 0) {
              return [panel]
            }
            return [
              <Separator key={`sep-${id}`} className="w-px bg-zinc-200 dark:bg-zinc-700" />,
              panel
            ]
          })}
        </Group>
      </div>
      <div data-tab-panel="trace-viewer" style={{ display: "none" }} className="h-full overflow-auto">
        <TraceViewer />
      </div>
    </>
  )
}
