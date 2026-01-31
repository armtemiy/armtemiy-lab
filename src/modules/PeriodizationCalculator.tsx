import { useEffect, useMemo, useState } from 'react'

type PeriodizationCalculatorProps = {
  onExit: () => void
}

type ExerciseOption = {
  label: string
  value: string
}

type PlanWeek = {
  week: string
  intensity: number
  volume: string
  weight: number | null
  note: string
  rest: string
}

type HistoryEntry = {
  id: string
  exercise: string
  weight: number
  createdAt: string
}

const EXERCISES: ExerciseOption[] = [
  { label: 'Подъем на бицепс', value: 'biceps' },
  { label: 'Пронатор', value: 'pronator' },
  { label: 'Отведение', value: 'abduction' },
  { label: 'Бок', value: 'side' }
]

const HISTORY_STORAGE_KEY = 'armtemiy_periodization_history'

const WEEKS: Array<Omit<PlanWeek, 'weight'>> = [
  {
    week: 'Неделя 1 — Вкатка',
    intensity: 0.65,
    volume: '5×5',
    note: 'Легкая / вводная',
    rest: 'Отдых 1:30–2:00'
  },
  {
    week: 'Неделя 2 — Нагрузка',
    intensity: 0.75,
    volume: '4×4',
    note: 'Средняя',
    rest: 'Отдых 2:30–3:00'
  },
  {
    week: 'Неделя 3 — Пик',
    intensity: 0.85,
    volume: '3×3',
    note: 'Тяжелая',
    rest: 'Отдых 4:00–5:00'
  },
  {
    week: 'Неделя 4 — Рекорд',
    intensity: 0.95,
    volume: '1×2–3',
    note: 'Контрольный подход',
    rest: 'Отдых 6:00–9:00'
  }
]

const roundWeight = (value: number) => Math.round(value * 2) / 2

export function PeriodizationCalculator({ onExit }: PeriodizationCalculatorProps) {
  const [exercise, setExercise] = useState(EXERCISES[0].value)
  const [weight, setWeight] = useState<number | ''>('')
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as HistoryEntry[]
      if (Array.isArray(parsed)) {
        setHistory(parsed)
      }
    } catch {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    }
  }, [])

  const plan = useMemo<PlanWeek[]>(() => {
    const numericWeight = typeof weight === 'number' ? weight : null
    const trainingMax = numericWeight ? numericWeight * 0.9 : null
    return WEEKS.map((week) => ({
      ...week,
      weight: trainingMax ? roundWeight(trainingMax * week.intensity) : null
    }))
  }, [weight])

  const selectedExercise = EXERCISES.find((item) => item.value === exercise)?.label ?? '—'
  const canSave = typeof weight === 'number' && weight > 0

  const saveToHistory = () => {
    if (!canSave) return
    const entry: HistoryEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      exercise,
      weight,
      createdAt: new Date().toISOString()
    }
    const updated = [entry, ...history]
    setHistory(updated)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated))
  }

  const restoreEntry = (entry: HistoryEntry) => {
    setExercise(entry.exercise)
    setWeight(entry.weight)
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-faint">Armtemiy Lab</p>
          <h2 className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">
            Калькулятор периодизации
          </h2>
        </div>
        <button onClick={onExit} className="text-sm text-faint hover:text-[color:var(--accent)]">
          ← Назад
        </button>
      </div>

      <p className="mt-4 text-sm text-muted">
        Введите максимальный вес на 5 повторений в одном подходе (5RM). План рассчитан на 4 недели и
        использует тренировочный максимум 90% от 5RM.
      </p>
      <p className="mt-2 text-xs text-faint">
        Формат 5×5 означает 5 подходов по 5 повторений. Формат 1×2–3 — один контрольный подход на 2–3 повторения.
      </p>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="mb-1 block text-xs text-faint">Упражнение</label>
          <select
            value={exercise}
            onChange={(event) => setExercise(event.target.value)}
            className="input w-full"
          >
            {EXERCISES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-faint">Рабочий вес на 5 повторений (кг)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={weight}
            onChange={(event) => {
              const value = event.target.value
              setWeight(value ? Number(value) : '')
            }}
            placeholder="Например, 60"
            className="input w-full"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)] p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-faint">План на 4 недели</p>
        <p className="mt-2 text-sm text-[color:var(--text-primary)]">
          Упражнение: <span className="font-semibold">{selectedExercise}</span>
        </p>
        {typeof weight === 'number' && (
          <p className="mt-1 text-xs text-faint">
            5RM: {weight} кг · Тренировочный максимум: {roundWeight(weight * 0.9)} кг
          </p>
        )}
        <p className="mt-2 text-xs text-faint">
          Рекомендованный отдых зависит от недели и интенсивности.
        </p>
        <div className="mt-4 grid gap-3">
          {plan.map((week) => (
            <div key={week.week} className="rounded-xl bg-[color:var(--surface)] p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">{week.week}</p>
                  <p className="text-xs text-muted">{week.note}</p>
                  <p className="text-xs text-faint">{week.rest}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[color:var(--accent)]">
                    {week.weight !== null ? `${week.weight} кг` : '—'}
                  </p>
                  <p className="text-xs text-muted">{week.volume}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={saveToHistory}
          disabled={!canSave}
          className="btn-secondary mt-4 w-full disabled:opacity-50"
        >
          Сохранить расчет
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-faint">История расчетов</p>
          <div className="mt-4 grid gap-3">
            {history.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-[color:var(--background)] p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                      {EXERCISES.find((item) => item.value === entry.exercise)?.label ?? '—'}
                    </p>
                    <p className="text-xs text-muted">{entry.weight} кг · {formatDate(entry.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => restoreEntry(entry)}
                    className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--text-primary)]"
                  >
                    Открыть
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
