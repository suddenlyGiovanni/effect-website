import React, { useCallback, useMemo, useState } from "react"
import { Equal } from "effect"
import {
  FileIcon,
  FilePenIcon,
  FilePlusIcon,
  FolderClosedIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  TrashIcon
} from "lucide-react"
import { useAtom } from "@effect/atom-react"
import { cn } from "@/lib/utils"
import { useWorkspaceHandle } from "../../context/workspace"
import { Directory, File } from "../../domain/workspace"
import { State, useExplorerDispatch, useExplorerState, useRemove, useRename } from "../file-explorer"
import { FileInput } from "./file-input"

export declare namespace FileNode {
  export type Props = FileProps | DirectoryProps

  export interface FileProps extends CommonProps {
    readonly type: "file"
    readonly node: File
  }

  export interface DirectoryProps extends CommonProps {
    readonly type: "directory"
    readonly node: Directory
    readonly isOpen: boolean
  }

  export interface CommonProps {
    readonly depth: number
    readonly path: string
    readonly className?: string
    readonly onClick?: OnClick
  }

  export interface OnClick {
    (event: React.MouseEvent<HTMLButtonElement>, node: File | Directory): void
  }
}

export function FileNode({ depth, node, path, className, onClick, ...props }: FileNode.Props) {
  const handle = useWorkspaceHandle()
  const state = useExplorerState()
  const [selectedFile, setSelectedFile] = useAtom(handle.selectedFile)
  const [showControls, setShowControls] = useState(false)
  const rename = useRename()
  const isEditing = useMemo(() => state._tag === "Editing" && Equal.equals(state.node, node), [state, node])
  const isSelected = Equal.equals(selectedFile, node)

  const handleClick = useCallback<FileNode.OnClick>(
    (event, node) => {
      if (node._tag === "File") {
        setSelectedFile(node)
      }
      onClick?.(event, node)
    },
    [onClick, setSelectedFile]
  )

  return isEditing ? (
    <FileInput type={node._tag} depth={depth} initialValue={node.name} onSubmit={(name) => rename(node, name)} />
  ) : (
    <FileNodeRoot
      className={showControls ? "grid-cols-[minmax(0,1fr)_auto]" : "auto-cols-auto"}
      isSelected={isSelected}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <FileNodeTrigger depth={depth} isSelected={isSelected} onClick={(event) => handleClick(event, node)}>
        <FileNodeIcon {...props} />
        <FileNodeName node={node} />
      </FileNodeTrigger>
      {showControls && <FileNodeControls className="justify-self-end" node={node} />}
    </FileNodeRoot>
  )
}

function FileNodeRoot({
  children,
  className,
  isSelected,
  onMouseEnter,
  onMouseLeave
}: React.PropsWithChildren<{
  readonly className?: string
  readonly isSelected: boolean
  readonly onMouseEnter: () => void
  readonly onMouseLeave: () => void
}>) {
  return (
    <div
      data-selected={isSelected}
      className={cn(
        "grid items-center transition-colors",
        isSelected ? "group bg-blue-600 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  )
}

function FileNodeTrigger({
  children,
  depth,
  isSelected,
  onClick
}: React.PropsWithChildren<{
  readonly depth: number
  readonly isSelected: boolean
  readonly onClick: React.MouseEventHandler<HTMLButtonElement>
}>) {
  const paddingLeft = 16 + depth * 8
  const styles = { paddingLeft: `${paddingLeft}px` }

  return (
    <button
      type="button"
      style={styles}
      className={cn(
        "w-full grid grid-cols-[16px_auto] gap-2 items-center justify-start py-1 bg-transparent cursor-pointer [&_svg]:mr-1 [&_span]:truncate",
        isSelected && "text-white"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function FileNodeIcon(props: { readonly type: "file" } | { readonly type: "directory"; readonly isOpen: boolean }) {
  return props.type === "file" ? (
    <FileIcon size={16} />
  ) : props.isOpen ? (
    <FolderOpenIcon size={16} />
  ) : (
    <FolderClosedIcon size={16} />
  )
}

function FileNodeName({ node }: { readonly node: File | Directory }) {
  const fileName = node.name.split("/").filter(Boolean).pop()
  return <span>{fileName}</span>
}

function FileNodeControls({ className, node }: { readonly className?: string; readonly node: File | Directory }) {
  const dispatch = useExplorerDispatch()
  const remove = useRemove()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    (node._tag === "Directory" || node.userManaged) && (
      <div className={cn("h-full flex items-center [&_button]:px-1 [&_button]:rounded-none", className)}>
        {node.userManaged && (
          <button
            type="button"
            title="Rename"
            className="h-full p-0 bg-transparent cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 group-data-[selected=true]:hover:bg-blue-700"
            onClick={() => dispatch(State.Editing({ node }))}
          >
            <FilePenIcon size={16} />
          </button>
        )}
        {node._tag === "Directory" && (
          <>
            <button
              type="button"
              title="New File"
              className="h-full p-0 bg-transparent cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 group-data-[selected=true]:hover:bg-blue-700"
              onClick={() => dispatch(State.Creating({ parent: node, type: "File" }))}
            >
              <FilePlusIcon size={16} />
            </button>
            <button
              type="button"
              title="New Folder"
              className="h-full p-0 bg-transparent cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 group-data-[selected=true]:hover:bg-blue-700"
              onClick={() => dispatch(State.Creating({ parent: node, type: "Directory" }))}
            >
              <FolderPlusIcon size={16} />
            </button>
          </>
        )}
        {node.userManaged && (
          confirmDelete ? (
            <div className="flex items-center gap-1 px-1">
              <button
                type="button"
                className="text-xs px-1 bg-red-600 text-white rounded cursor-pointer"
                onClick={() => { remove(node); setConfirmDelete(false) }}
              >
                Yes
              </button>
              <button
                type="button"
                className="text-xs px-1 bg-zinc-300 dark:bg-zinc-600 rounded cursor-pointer"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              title="Delete"
              className="h-full p-0 bg-transparent cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 group-data-[selected=true]:hover:bg-blue-700"
              onClick={() => setConfirmDelete(true)}
            >
              <TrashIcon size={16} />
            </button>
          )
        )}
      </div>
    )
  )
}
