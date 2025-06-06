import React from "react"
import { useRxMount, useRxSuspenseSuccess, useRxValue } from "@effect-rx/rx-react"
import { Workspace } from "../domain/workspace"
import { workspaceHandleRx, type RxWorkspaceHandle } from "../rx/workspace"
import { autoSaveRx } from "../rx/import"

export const WorkspaceContext = React.createContext<RxWorkspaceHandle>(null as any)

export const useWorkspaceHandle = () => React.useContext(WorkspaceContext)
export const useWorkspaceRx = () => useWorkspaceHandle().workspaceRx
export const useWorkspaceShells = () => useRxValue(useWorkspaceRx(), (workspace) => workspace.shells)
export const useWorkspaceTree = () => useRxValue(useWorkspaceRx(), (workspace) => workspace.tree)

export function WorkspaceProvider({
  children,
  workspace
}: React.PropsWithChildren<{
  readonly workspace: Workspace
}>) {
  const { value } = useRxSuspenseSuccess(workspaceHandleRx(workspace))
  useRxMount(autoSaveRx(value))
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
