type ModuleCardProps = {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function ModuleCard({ title, description, actionLabel, onAction }: ModuleCardProps) {
  return (
    <div className="card-soft">
      <p className="text-sm font-medium text-[color:var(--text-primary)]">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <button onClick={onAction} className="btn-primary mt-3">
        {actionLabel}
      </button>
    </div>
  )
}
