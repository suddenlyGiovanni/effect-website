export function TagChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-600 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-200 uppercase">
      {name}
    </span>
  )
}

export function OverflowChip({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-700 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase">
      +{count}
    </span>
  )
}
