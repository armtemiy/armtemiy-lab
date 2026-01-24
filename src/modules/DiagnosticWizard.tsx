import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type {
  DiagnosticNode,
  DiagnosticQuestion,
  DiagnosticResult,
  DiagnosticTree,
} from '../data/diagnosticTree'
import { config } from '../lib/config'
import { createStarsInvoice } from '../lib/payments'
import { supabase } from '../lib/supabase'
import type { WebAppStatus } from '../types'
import { fadeUp } from '../ui'

type DiagnosticWizardProps = {
  tree: DiagnosticTree
  canAccessPremium: boolean
  onExit: () => void
  onUnlock: () => void
  isAdmin: boolean
  telegramUserId: string | null
  telegramUsername: string | null
  webAppStatus: WebAppStatus
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function DiagnosticWizard({
  tree,
  canAccessPremium,
  onExit,
  onUnlock,
  isAdmin,
  telegramUserId,
  telegramUsername,
  webAppStatus,
}: DiagnosticWizardProps) {
  const [currentId, setCurrentId] = useState(tree.start)
  const [history, setHistory] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [fallbackInvoiceLink, setFallbackInvoiceLink] = useState<string | null>(null)

  const node = tree.nodes[currentId] as DiagnosticNode
  const totalQuestions = useMemo(
    () => Object.values(tree.nodes).filter((item) => item.type === 'question').length,
    [tree.nodes],
  )
  const answeredCount = Object.keys(answers).length
  const progress = Math.min(answeredCount / totalQuestions, 1)

  useEffect(() => {
    setCurrentId(tree.start)
    setHistory([])
    setAnswers({})
    setError(null)
    setSaveStatus('idle')
    setFallbackInvoiceLink(null)
  }, [tree])

  const handleOption = (option: { label: string; next: string }) => {
    if (node.type !== 'question') return
    setAnswers((prev) => ({ ...prev, [currentId]: option.label }))
    setHistory((prev) => [...prev, currentId])
    setCurrentId(option.next)
  }

  const handleBack = () => {
    if (history.length === 0) {
      onExit()
      return
    }
    const previousId = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setAnswers((prev) => {
      const next = { ...prev }
      delete next[previousId]
      return next
    })
    setCurrentId(previousId)
  }

  const handleRestart = () => {
    setCurrentId(tree.start)
    setHistory([])
    setAnswers({})
    setError(null)
    setSaveStatus('idle')
    setFallbackInvoiceLink(null)
  }

  const handleShare = async (result: DiagnosticResult) => {
    const text = `Armtemiy Lab: ${result.title}. ${result.diagnosis}`
    if (navigator.share) {
      await navigator.share({ text })
      return
    }
    await navigator.clipboard.writeText(text)
    setError('Результат скопирован в буфер обмена')
  }

  const openInvoiceLink = (invoiceLink: string, onPaid?: () => void) => {
    const webApp = (window as any)?.Telegram?.WebApp

    if (webApp?.openInvoice) {
      webApp.openInvoice(invoiceLink, (status: string) => {
        if (status === 'paid') {
          onPaid?.()
        } else if (status !== 'pending') {
          setError('Оплата не завершена')
        }
        setUnlocking(false)
      })
      return
    }

    if (webApp?.openLink) {
      webApp.openLink(invoiceLink)
      setError('Ссылка открыта через Telegram. Если окно не появилось, открой WebApp снова.')
      setUnlocking(false)
      return
    }

    setFallbackInvoiceLink(invoiceLink)
    setError('Открытие оплаты доступно только внутри Telegram WebApp')
    setUnlocking(false)
  }

  const handleUnlock = async () => {
    setUnlocking(true)
    setError(null)
    setFallbackInvoiceLink(null)
    const response = await createStarsInvoice({
      itemSlug: config.starsItemSlug,
      userId: telegramUserId,
      starsAmount: config.starsPrice,
    })

    if (!response.invoiceLink) {
      setError(response.error || 'Не удалось создать счет')
      setUnlocking(false)
      return
    }

    openInvoiceLink(response.invoiceLink, onUnlock)
  }

  const handleTestInvoice = async () => {
    setUnlocking(true)
    setError(null)
    setFallbackInvoiceLink(null)
    const response = await createStarsInvoice({
      itemSlug: config.starsItemSlug,
      userId: telegramUserId,
      starsAmount: config.starsPrice,
    })

    if (!response.invoiceLink) {
      setError(response.error || 'Не удалось создать счет')
      setUnlocking(false)
      return
    }

    openInvoiceLink(response.invoiceLink)
  }

  useEffect(() => {
    const saveResult = async () => {
      if (!supabase) return
      if (node.type !== 'result') return
      if (saveStatus !== 'idle') return

      setSaveStatus('saving')

      try {
        let userId: string | null = null
        if (telegramUserId) {
          const { data: userRow } = await supabase
            .from('users')
            .upsert(
              {
                telegram_user_id: telegramUserId,
                username: telegramUsername,
                is_admin: isAdmin,
              },
              { onConflict: 'telegram_user_id' },
            )
            .select('id')
            .single()

          userId = userRow?.id ?? null
        }

        const { error: insertError } = await supabase.from('diagnostic_results').insert({
          user_id: userId,
          tree_id: null,
          answers_json: answers,
          result_json: { ...node, treeId: tree.id },
        })

        if (insertError) {
          setSaveStatus('error')
          return
        }

        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }

    void saveResult()
  }, [answers, isAdmin, node, saveStatus, telegramUserId, telegramUsername, tree.id])

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <button className="text-xs text-muted" onClick={handleBack}>
          ← назад
        </button>
        <p className="text-[11px] uppercase tracking-[0.3em] text-faint">Диагностика</p>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
        <div
          className="h-full rounded-full bg-[color:var(--accent)] transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mt-5">
        {node.type === 'question' ? (
          <QuestionNode node={node} onSelect={handleOption} />
        ) : (
          <ResultNode
            node={node}
            tree={tree}
            answers={answers}
            canAccessPremium={canAccessPremium}
            onRestart={handleRestart}
            onShare={handleShare}
            onUnlock={handleUnlock}
            onTestInvoice={handleTestInvoice}
            unlocking={unlocking}
            isAdmin={isAdmin}
            saveStatus={saveStatus}
            webAppStatus={webAppStatus}
          />
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 px-4 py-3 text-xs text-[color:var(--accent-contrast)]">
          {error}
        </div>
      )}
      {fallbackInvoiceLink && (
        <div className="mt-3 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-3 text-xs text-muted">
          <p className="text-[11px] uppercase tracking-[0.2em] text-faint">Invoice link</p>
          <p className="mt-2 break-all text-[11px]">{fallbackInvoiceLink}</p>
          <button
            onClick={() => navigator.clipboard.writeText(fallbackInvoiceLink)}
            className="btn-outline mt-3 text-[11px]"
          >
            Скопировать ссылку
          </button>
        </div>
      )}
      {!webAppStatus.available && (
        <div className="mt-3 rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 px-4 py-3 text-xs text-[color:var(--danger)]">
          WebApp не обнаружен. Открой приложение через кнопку бота.
          {config.botUsername && (
            <a
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-3 py-2 text-[11px] font-semibold"
              href={`https://t.me/${config.botUsername}?startapp=lab`}
            >
              Открыть в Telegram
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function QuestionNode({
  node,
  onSelect,
}: {
  node: DiagnosticQuestion
  onSelect: (option: { label: string; next: string }) => void
}) {
  return (
    <motion.div {...fadeUp}>
      <p className="text-lg font-semibold text-[color:var(--text-primary)]">{node.text}</p>
      {node.helper && <p className="mt-2 text-xs text-muted">{node.helper}</p>}
      <div className="mt-4 grid gap-3">
        {node.options.map((option) => (
          <button
            key={option.label}
            onClick={() => onSelect(option)}
            className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-3 text-left text-sm text-[color:var(--text-primary)] transition hover:border-[color:var(--accent)]/40 hover:bg-[color:var(--accent)]/10"
          >
            {option.label}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function ResultNode({
  node,
  tree,
  answers,
  canAccessPremium,
  onRestart,
  onShare,
  onUnlock,
  onTestInvoice,
  unlocking,
  isAdmin,
  saveStatus,
  webAppStatus,
}: {
  node: DiagnosticResult
  tree: DiagnosticTree
  answers: Record<string, string>
  canAccessPremium: boolean
  onRestart: () => void
  onShare: (node: DiagnosticResult) => void
  onUnlock: () => void
  onTestInvoice: () => void
  unlocking: boolean
  isAdmin: boolean
  saveStatus: SaveStatus
  webAppStatus: WebAppStatus
}) {
  const isLocked = node.premium && !canAccessPremium
  const saveLabel = {
    idle: 'не сохранено',
    saving: 'сохранение...',
    saved: 'сохранено',
    error: 'ошибка',
  }[saveStatus]
  const answerSummary = Object.entries(answers)
    .map(([key, answer]) => {
      const questionNode = tree.nodes[key]
      if (!questionNode || questionNode.type !== 'question') return null
      return { question: questionNode.text, answer }
    })
    .filter(Boolean) as { question: string; answer: string }[]

  return (
    <motion.div {...fadeUp}>
      <p className="text-xs uppercase tracking-[0.3em] text-faint">Диагноз</p>
      <h2 className="mt-3 text-2xl font-semibold text-[color:var(--text-primary)]">{node.title}</h2>
      <p className="mt-3 text-sm text-muted">{node.diagnosis}</p>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.3em] text-faint">Рекомендации</p>
        <div className="mt-3 grid gap-2">
          {node.recommendations.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-primary)]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {answerSummary.length > 0 && (
        <div className="mt-5 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface-muted)] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-faint">Маршрут</p>
          <div className="mt-3 grid gap-2">
            {answerSummary.map((item) => (
              <div key={item.question} className="text-xs text-muted">
                <span className="text-[color:var(--text-primary)]">{item.answer}</span>
                <span className="text-faint"> — {item.question}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {node.premium && (
        <div className="mt-5 rounded-2xl border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent-contrast)]">Премиум</p>
          <p className="mt-2 text-xs text-[color:var(--accent-contrast)]/80">
            {node.premiumTeaser || 'Доступ к расширенному разбору.'}
          </p>
          {isLocked ? (
            <button onClick={onUnlock} disabled={unlocking} className="btn-accent mt-3">
              {unlocking ? 'Открываю оплату...' : `Открыть за ${config.starsPrice} Star`}
            </button>
          ) : (
            <p className="mt-3 text-xs text-[color:var(--accent-contrast)]/70">
              Доступ открыт {isAdmin ? 'админом' : 'по оплате'}.
            </p>
          )}
        </div>
      )}

      {isAdmin && (
        <button onClick={onTestInvoice} disabled={unlocking} className="btn-outline mt-4 text-xs">
          {unlocking ? 'Открываю счет...' : 'Тест оплаты (админ)'}
        </button>
      )}

      <div className="mt-6 grid gap-3">
        <button onClick={onRestart} className="btn-ghost">
          Пройти заново
        </button>
        <button onClick={() => onShare(node)} className="btn-primary">
          Поделиться результатом
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-faint">
        <span>Сохранение: {saveLabel}</span>
        <span>
          WebApp {webAppStatus.available ? 'on' : 'off'} · invoice{' '}
          {webAppStatus.openInvoice ? 'on' : 'off'}
        </span>
      </div>
    </motion.div>
  )
}
