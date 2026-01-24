import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { DiagnosticTree } from '../data/diagnosticTree'
import type { TreeSource } from '../types'

type AdminModuleProps = {
  tree: DiagnosticTree
  treeSource: TreeSource
  onExit: () => void
  onApply: (tree: DiagnosticTree) => void
  onReset: () => void
}

export function AdminModule({ tree, treeSource, onExit, onApply, onReset }: AdminModuleProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleApply = () => {
    setStatus(null)
    try {
      const parsed = JSON.parse(jsonInput) as DiagnosticTree
      if (!parsed?.start || !parsed?.nodes) {
        setStatus('Неверный JSON: нет start или nodes')
        return
      }
      onApply(parsed)
      setStatus('Загружено успешно')
    } catch {
      setStatus('Ошибка разбора JSON')
    }
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setJsonInput(text)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(tree, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${tree.id || 'tree'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <button className="text-xs text-muted" onClick={onExit}>
          ← назад
        </button>
        <p className="text-[11px] uppercase tracking-[0.3em] text-faint">Админ: Логика</p>
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-3 text-xs text-muted">
        Источник: {treeSource === 'override' ? 'кастомный JSON' : 'по умолчанию'} · Узлов:{' '}
        {Object.keys(tree.nodes).length}
      </div>

      <div className="mt-4 grid gap-3">
        <input
          type="file"
          accept="application/json"
          onChange={handleFile}
          className="w-full rounded-xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-3 text-xs text-muted"
        />
        <textarea
          rows={8}
          value={jsonInput}
          onChange={(event) => setJsonInput(event.target.value)}
          placeholder="Вставь JSON дерева решений"
          className="w-full rounded-xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-3 text-xs text-[color:var(--text-primary)]"
        />
        <button onClick={handleApply} className="btn-primary">
          Применить JSON
        </button>
        <button onClick={handleExport} className="btn-outline text-xs">
          Экспорт текущего JSON
        </button>
        <button onClick={onReset} className="btn-danger">
          Сбросить на дефолт
        </button>
      </div>

      {status && (
        <div className="mt-4 rounded-2xl border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 px-4 py-3 text-xs text-[color:var(--accent-contrast)]">
          {status}
        </div>
      )}
    </div>
  )
}
