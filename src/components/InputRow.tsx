type InputRowProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

export function InputRow({ label, value, onChange }: InputRowProps) {
  return (
    <label className="grid gap-2 text-xs text-muted">
      {label}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
      />
    </label>
  )
}
