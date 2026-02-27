interface CodePaneProps {
  readonly code: string
}

export function CodePane({ code }: CodePaneProps) {
  return (
    <pre className="overflow-x-auto border-t border-zinc-800 bg-zinc-950/70 p-4 font-mono text-xs leading-relaxed text-zinc-300">
      <code>{code}</code>
    </pre>
  )
}
