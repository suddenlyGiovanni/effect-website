import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { SquareTerminalIcon, ChartGanttIcon } from "lucide-react"
import { useCallback, Fragment, Suspense } from "react"
import { useDefaultLayout } from "react-resizable-panels"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { importAtom } from "./atoms/import"
import { FileEditor } from "./components/file-editor"
import { FileExplorer } from "./components/file-explorer"
import { PlaygroundLoader } from "./components/loader"
import { Terminal } from "./components/terminal"
import { TraceViewer } from "./components/trace-viewer"
import { WorkspaceProvider, useWorkspaceHandle, useWorkspaceShells } from "./context/workspace"

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
    [setSize],
  )

  const editorLayout = useDefaultLayout({
    id: "editor",
    storage: globalThis.localStorage,
  })
  const sidebarLayout = useDefaultLayout({
    id: "sidebar",
    storage: globalThis.localStorage,
  })

  return (
    <ResizablePanelGroup {...editorLayout} orientation="vertical" className="h-full">
      <ResizablePanel defaultSize={70}>
        <ResizablePanelGroup {...sidebarLayout} orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={10}>
            <FileExplorer />
          </ResizablePanel>
          <ResizableHandle className="w-px bg-zinc-200 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-500" />
          <ResizablePanel defaultSize={80}>
            <FileEditor />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle className="h-px bg-zinc-200 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-500" />

      <ResizablePanel defaultSize={30} minSize={10} onResize={onResize} className="h-full">
        <ResizablePanelGroup orientation="horizontal">
          <Tabs defaultValue="terminal" className="flex h-full w-full flex-col gap-0">
            <TabsList variant="line">
              <TabsTrigger value="terminal" className="transition-none">
                <SquareTerminalIcon size={16} />
                <span>Terminal</span>
              </TabsTrigger>
              <TabsTrigger value="trace-viewer" className="transition-none">
                <ChartGanttIcon size={16} />
                <span>Trace Viewer</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="terminal" className="m-0 h-full w-full overflow-y-auto" keepMounted>
              <WorkspaceShells />
            </TabsContent>
            <TabsContent
              value="trace-viewer"
              className="m-0 h-full w-full overflow-y-auto data-[state=inactive]:hidden"
              keepMounted
            >
              <TraceViewer />
            </TabsContent>
          </Tabs>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
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
    [setSize],
  )
  return (
    <ResizablePanelGroup orientation="vertical" className="h-full">
      {shells.map((shell, index) => {
        const id = `shell-${index}`
        const defaultSize = 100 / shells.length
        return (
          <Fragment key={id}>
            {index > 0 && <ResizableHandle id={id} />}
            <ResizablePanel id={id} defaultSize={defaultSize} onResize={onResize}>
              <Terminal shell={shell} />
            </ResizablePanel>
          </Fragment>
        )
      })}
    </ResizablePanelGroup>
  )
}
