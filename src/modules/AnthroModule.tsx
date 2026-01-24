import { useMemo, useState } from 'react'
import { InputRow } from '../components/InputRow'

type AnthroModuleProps = {
  onExit: () => void
}

export function AnthroModule({ onExit }: AnthroModuleProps) {
  const [forearm, setForearm] = useState('')
  const [palm, setPalm] = useState('')
  const [wrist, setWrist] = useState('')

  const result = useMemo(() => {
    const forearmValue = Number(forearm)
    const palmValue = Number(palm)
    const wristValue = Number(wrist)

    if (!forearmValue || !palmValue || !wristValue) return null

    const leverage = forearmValue / palmValue
    const wristIndex = wristValue

    let toproll = 0
    let hook = 0
    let press = 0

    if (leverage >= 2.8) toproll += 2
    if (leverage < 2.6) hook += 1
    if (palmValue >= 10.5) toproll += 1
    if (palmValue < 10) hook += 1
    if (wristIndex >= 18) hook += 2
    if (wristIndex >= 19) press += 1
    if (wristIndex < 16.5) toproll += 1

    const maxScore = Math.max(toproll, hook, press)
    if (maxScore === press) {
      return {
        style: 'Пресс',
        note: 'Плотное запястье и короткая дистанция дают шанс на пресс.',
        metrics: {
          leverage: leverage.toFixed(2),
          wristIndex: wristIndex.toFixed(1),
        },
      }
    }

    if (maxScore === hook) {
      return {
        style: 'Крюк',
        note: 'Плотная кисть и короткий рычаг — сильная сторона.',
        metrics: {
          leverage: leverage.toFixed(2),
          wristIndex: wristIndex.toFixed(1),
        },
      }
    }

    return {
      style: 'Верх (Toproll)',
      note: 'Длина рычага и ладонь дают преимущество в верхе.',
      metrics: {
        leverage: leverage.toFixed(2),
        wristIndex: wristIndex.toFixed(1),
      },
    }
  }, [forearm, palm, wrist])

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <button className="text-xs text-muted" onClick={onExit}>
          ← назад
        </button>
        <p className="text-[11px] uppercase tracking-[0.3em] text-faint">Антропометрия</p>
      </div>

      <p className="mt-4 text-sm text-muted">
        Черновой расчет. На основе трех параметров: рычаг, ладонь, запястье.
      </p>

      <div className="mt-4 grid gap-3">
        <InputRow label="Длина предплечья (см)" value={forearm} onChange={setForearm} />
        <InputRow label="Длина ладони (см)" value={palm} onChange={setPalm} />
        <InputRow label="Обхват запястья (см)" value={wrist} onChange={setWrist} />
      </div>

      <div className="mt-5 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.3em] text-faint">Результат</p>
        {result ? (
          <>
            <p className="mt-2 text-lg font-semibold text-[color:var(--text-primary)]">
              {result.style}
            </p>
            <p className="mt-2 text-xs text-muted">{result.note}</p>
            <div className="mt-3 grid gap-2 text-xs text-muted">
              <div className="flex items-center justify-between">
                <span>Рычаг (предплечье/ладонь)</span>
                <span className="text-[color:var(--text-primary)]">{result.metrics.leverage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Индекс запястья</span>
                <span className="text-[color:var(--text-primary)]">{result.metrics.wristIndex}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-2 text-xs text-muted">Заполни все поля, чтобы получить подсказку.</p>
        )}
      </div>
    </div>
  )
}
