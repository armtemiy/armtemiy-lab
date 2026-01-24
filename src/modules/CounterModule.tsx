import { useState } from 'react'

type CounterModuleProps = {
  onExit: () => void
}

export function CounterModule({ onExit }: CounterModuleProps) {
  const [opponent, setOpponent] = useState<'Верх' | 'Крюк' | 'Пресс' | null>(null)

  const counterMap = {
    Верх: {
      counter: 'Пресс',
      note: 'Быстро садись в пресс, перекрывай плечо и ломай линию.',
    },
    Крюк: {
      counter: 'Верх',
      note: 'Атакуй пальцы и высоту, чтобы сорвать крюк.',
    },
    Пресс: {
      counter: 'Крюк',
      note: 'Закрывай кисть соперника и выключай плечо.',
    },
  } as const

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <button className="text-xs text-muted" onClick={onExit}>
          ← назад
        </button>
        <p className="text-[11px] uppercase tracking-[0.3em] text-faint">Контр-матрица</p>
      </div>

      <p className="mt-4 text-sm text-muted">Выбери стиль соперника.</p>

      <div className="mt-4 grid gap-2">
        {(['Верх', 'Крюк', 'Пресс'] as const).map((style) => (
          <button
            key={style}
            onClick={() => setOpponent(style)}
            className={`rounded-2xl border px-4 py-3 text-sm transition ${
              opponent === style
                ? 'border-[color:var(--accent)]/60 bg-[color:var(--accent)]/10'
                : 'border-[color:var(--stroke)] bg-[color:var(--surface-muted)]'
            }`}
          >
            {style}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.3em] text-faint">Контр</p>
        {opponent ? (
          <>
            <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">
              {counterMap[opponent].counter}
            </p>
            <p className="mt-2 text-xs text-muted">{counterMap[opponent].note}</p>
          </>
        ) : (
          <p className="mt-2 text-xs text-muted">Выбери стиль, чтобы получить ответ.</p>
        )}
      </div>
    </div>
  )
}
