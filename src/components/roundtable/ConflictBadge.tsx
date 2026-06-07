type ConflictBadgeProps = {
  preview: string;
};

export function ConflictBadge({ preview }: ConflictBadgeProps) {
  if (!preview) {
    return (
      <div className="rounded border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm text-neutral-400">
        这个组合比较和平，适合看人格差异，不一定会吵得很响。
      </div>
    );
  }

  return (
    <div className="rounded border border-neutral-700 bg-neutral-950 px-3 py-3">
      <p className="mb-1 font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">Conflict preview</p>
      <p className="text-sm leading-6 text-neutral-200">{preview}</p>
    </div>
  );
}
