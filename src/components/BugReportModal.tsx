import { useMemo, useState } from 'react'
import type { BugReportPayload } from '../lib/bugReport'
import { submitBugReport, uploadBugAttachments } from '../lib/bugReport'

const RATE_LIMIT_KEY = 'armtemiy_bug_report_last'
const RATE_LIMIT_MS = 10 * 60 * 1000
const MAX_FILES = 4

type BugReportContext = {
  userId?: number
  username?: string
  route?: string
  view?: string
  platform?: string
}

type BugReportModalProps = {
  open: boolean
  onClose: () => void
  context: BugReportContext
}

export function BugReportModal({ open, onClose, context }: BugReportModalProps) {
  const [summary, setSummary] = useState('')
  const [steps, setSteps] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canSend = summary.trim().length >= 3
  const lastSent = useMemo(() => {
    const raw = localStorage.getItem(RATE_LIMIT_KEY)
    return raw ? Number(raw) : 0
  }, [open])

  const rateLimited = lastSent > 0 && Date.now() - lastSent < RATE_LIMIT_MS

  if (!open) return null

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const selected = Array.from(list).slice(0, MAX_FILES)
    setFiles(selected)
  }

  const handleSubmit = async () => {
    if (rateLimited) {
      setError('Слишком часто. Попробуйте позже.')
      return
    }
    if (!canSend) {
      setError('Опишите проблему (минимум 3 символа).')
      return
    }

    setSending(true)
    setError(null)

    try {
      const attachmentUrls = await uploadBugAttachments(files, context.userId)
      const payload: BugReportPayload = {
        summary,
        steps: steps || undefined,
        userId: context.userId,
        username: context.username,
        route: context.route,
        view: context.view,
        platform: context.platform,
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        attachments: attachmentUrls
      }

      const result = await submitBugReport(payload)
      if (!result.id) {
        setError(result.error || 'Не удалось отправить. Попробуйте позже.')
        return
      }

      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()))
      setSuccess(`Репорт принят. ID: ${result.id}`)
      setSummary('')
      setSteps('')
      setFiles([])
    } catch (err) {
      console.error('Bug report submit failed:', err)
      setError('Не удалось отправить. Попробуйте позже.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="card w-full max-w-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">Сообщить об ошибке</h3>
            <p className="mt-1 text-xs text-muted">Опишите проблему — мы разберемся.</p>
          </div>
          <button onClick={onClose} className="text-sm text-faint">✕</button>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="mb-1 block text-xs text-faint">Что случилось? *</label>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={3}
              className="input w-full resize-none"
              placeholder="Например: при расчете план не сохраняется"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-faint">Как воспроизвести (необязательно)</label>
            <textarea
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              rows={2}
              className="input w-full resize-none"
              placeholder="Шаги: 1) ... 2) ..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-faint">Скриншоты (до {MAX_FILES})</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handleFiles(event.target.files)}
              className="input w-full"
            />
            {files.length > 0 && (
              <p className="mt-1 text-xs text-faint">Выбрано файлов: {files.length}</p>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-[color:var(--error)]">{error}</p>}
        {success && <p className="mt-3 text-xs text-[color:var(--success)]">{success}</p>}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Отмена</button>
          <button
            onClick={handleSubmit}
            disabled={!canSend || sending || rateLimited}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {sending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  )
}
