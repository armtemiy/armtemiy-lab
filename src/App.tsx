import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { diagnosticTree } from './data/diagnosticTree'
import type {
  DiagnosticNode,
  DiagnosticQuestion,
  DiagnosticResult,
} from './data/diagnosticTree'
import { config } from './lib/config'
import { createStarsInvoice } from './lib/payments'
import { supabase } from './lib/supabase'
import { getTelegramUser, initTelegram } from './lib/telegram'
import type { TelegramUser } from './lib/telegram'

type View = 'home' | 'wizard'
type WebAppStatus = {
  available: boolean
  openInvoice: boolean
  platform: string
  launchParams: boolean
}

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

const cardStyle =
  'rounded-3xl border border-white/10 bg-[rgba(17,24,39,0.75)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]'

function App() {
  const [view, setView] = useState<View>('home')
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [premiumUnlocked, setPremiumUnlocked] = useState(false)
  const [webAppStatus, setWebAppStatus] = useState<WebAppStatus>({
    available: false,
    openInvoice: false,
    platform: 'unknown',
    launchParams: false,
  })

  useEffect(() => {
    initTelegram()
    setTelegramUser(getTelegramUser())
    const webApp = (window as any)?.Telegram?.WebApp
    const hasLaunchParams = new URLSearchParams(window.location.search).has('tgWebAppData')
    setWebAppStatus({
      available: Boolean(webApp),
      openInvoice: Boolean(webApp?.openInvoice),
      platform: webApp?.platform || 'unknown',
      launchParams: hasLaunchParams,
    })
  }, [])

  const isAdmin = telegramUser?.id ? config.adminIds.includes(telegramUser.id) : false
  const canAccessPremium = isAdmin || premiumUnlocked

  return (
    <div className="min-h-screen px-4 pb-16 pt-6 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#fbbf24]/70">
              Armtemiy Lab
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">
              Тактический
              <br />
              разбор поражения
            </h1>
          </div>
          <div className="flex flex-col items-end text-right text-xs text-white/60">
            <span className="rounded-full border border-white/10 px-3 py-1">Beta</span>
            {isAdmin && (
              <span className="mt-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">
                Admin
              </span>
            )}
            {telegramUser?.username && (
              <span className="mt-2 font-mono text-[11px] text-white/40">
                @{telegramUser.username}
              </span>
            )}
            <span className="mt-2 font-mono text-[10px] text-white/40">
              WebApp {webAppStatus.available ? 'on' : 'off'} · invoice{' '}
              {webAppStatus.openInvoice ? 'on' : 'off'} · {webAppStatus.platform}
              {webAppStatus.launchParams ? ' · params' : ''}
            </span>
            {telegramUser?.id && (
              <span className="mt-1 font-mono text-[10px] text-white/30">
                id:{telegramUser.id}
              </span>
            )}
          </div>
        </header>

        <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/15 via-transparent to-transparent p-6">
          <p className="text-sm text-white/70">
            Ответь на 5–7 вопросов. Алгоритм даст диагноз и точечную рекомендацию.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
              60 секунд
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
              Без воды
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div key="home" {...fadeUp} className="flex flex-col gap-4">
              <button
                className="w-full rounded-2xl bg-amber-400 px-6 py-4 text-sm font-semibold text-black shadow-[0_12px_24px_rgba(245,158,11,0.25)]"
                onClick={() => setView('wizard')}
              >
                Запустить диагностику
              </button>

              <div className={`${cardStyle} p-5`}>
                <p className="text-sm text-white/70">Модули (скоро)</p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-sm font-medium">Антропометрия</p>
                    <p className="text-xs text-white/50">
                      Определит твой базовый стиль по рычагам.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-sm font-medium">Контр-матрица</p>
                    <p className="text-xs text-white/50">
                      Быстрый подбор контр-приема.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${cardStyle} p-5`}>
                <p className="text-sm text-white/70">Режим доступа</p>
                <p className="mt-2 text-xs text-white/50">
                  Админ-доступ включен для {config.adminIds.length} ID.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="wizard" {...fadeUp}>
              <DiagnosticWizard
                canAccessPremium={canAccessPremium}
                onExit={() => setView('home')}
                onUnlock={() => setPremiumUnlocked(true)}
                isAdmin={isAdmin}
                telegramUserId={telegramUser?.id ?? null}
                telegramUsername={telegramUser?.username ?? null}
                webAppStatus={webAppStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function DiagnosticWizard({
  canAccessPremium,
  onExit,
  onUnlock,
  isAdmin,
  telegramUserId,
  telegramUsername,
  webAppStatus,
}: {
  canAccessPremium: boolean
  onExit: () => void
  onUnlock: () => void
  isAdmin: boolean
  telegramUserId: string | null
  telegramUsername: string | null
  webAppStatus: WebAppStatus
}) {
  const [currentId, setCurrentId] = useState(diagnosticTree.start)
  const [history, setHistory] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [fallbackInvoiceLink, setFallbackInvoiceLink] = useState<string | null>(null)

  const node = diagnosticTree.nodes[currentId] as DiagnosticNode
  const totalQuestions = useMemo(
    () =>
      Object.values(diagnosticTree.nodes).filter((item) => item.type === 'question').length,
    [],
  )
  const answeredCount = Object.keys(answers).length
  const progress = Math.min(answeredCount / totalQuestions, 1)

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
    setCurrentId(diagnosticTree.start)
    setHistory([])
    setAnswers({})
    setError(null)
    setSaved(false)
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
      if (saved) return

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

      await supabase.from('diagnostic_results').insert({
        user_id: userId,
        tree_id: null,
        answers_json: answers,
        result_json: node,
      })

      setSaved(true)
    }

    void saveResult()
  }, [answers, isAdmin, node, saved, telegramUserId, telegramUsername])

  return (
    <div className={`${cardStyle} p-5`}>
      <div className="flex items-center justify-between">
        <button
          className="text-xs text-white/60"
          onClick={handleBack}
        >
          ← назад
        </button>
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
          Диагностика
        </p>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mt-5">
        {node.type === 'question' ? (
          <QuestionNode node={node} onSelect={handleOption} />
        ) : (
          <ResultNode
            node={node}
            canAccessPremium={canAccessPremium}
            onRestart={handleRestart}
            onShare={handleShare}
            onUnlock={handleUnlock}
            onTestInvoice={handleTestInvoice}
            unlocking={unlocking}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          {error}
        </div>
      )}
      {fallbackInvoiceLink && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Invoice link</p>
          <p className="mt-2 break-all text-[11px]">{fallbackInvoiceLink}</p>
          <button
            onClick={() => navigator.clipboard.writeText(fallbackInvoiceLink)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-semibold"
          >
            Скопировать ссылку
          </button>
        </div>
      )}
      {!webAppStatus.available && (
        <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          WebApp не обнаружен. Открой приложение через кнопку бота.
          {config.botUsername && (
            <a
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-100"
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
      <p className="text-lg font-semibold">{node.text}</p>
      {node.helper && <p className="mt-2 text-xs text-white/50">{node.helper}</p>}
      <div className="mt-4 grid gap-3">
        {node.options.map((option) => (
          <button
            key={option.label}
            onClick={() => onSelect(option)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-amber-400/40 hover:bg-amber-400/10"
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
  canAccessPremium,
  onRestart,
  onShare,
  onUnlock,
  onTestInvoice,
  unlocking,
  isAdmin,
}: {
  node: DiagnosticResult
  canAccessPremium: boolean
  onRestart: () => void
  onShare: (node: DiagnosticResult) => void
  onUnlock: () => void
  onTestInvoice: () => void
  unlocking: boolean
  isAdmin: boolean
}) {
  const isLocked = node.premium && !canAccessPremium

  return (
    <motion.div {...fadeUp}>
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">Диагноз</p>
      <h2 className="mt-3 text-2xl font-semibold">{node.title}</h2>
      <p className="mt-3 text-sm text-white/70">{node.diagnosis}</p>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Рекомендации</p>
        <div className="mt-3 grid gap-2">
          {node.recommendations.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {node.premium && (
        <div className="mt-5 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
            Премиум-ветка
          </p>
          <p className="mt-2 text-xs text-amber-100/80">
            {node.premiumTeaser || 'Доступ к расширенному разбору.'}
          </p>
          {isLocked ? (
            <button
              onClick={onUnlock}
              disabled={unlocking}
              className="mt-3 w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-black"
            >
              {unlocking ? 'Открываю оплату...' : `Открыть за ${config.starsPrice} Star`}
            </button>
          ) : (
            <p className="mt-3 text-xs text-amber-100/70">
              Доступ открыт {isAdmin ? 'админом' : 'по оплате'}.
            </p>
          )}
        </div>
      )}

      {isAdmin && (
        <button
          onClick={onTestInvoice}
          disabled={unlocking}
          className="mt-4 w-full rounded-xl border border-amber-300/40 bg-transparent px-4 py-3 text-xs font-semibold text-amber-100"
        >
          {unlocking ? 'Открываю счет...' : 'Тест оплаты (админ)'}
        </button>
      )}

      <div className="mt-6 grid gap-3">
        <button
          onClick={onRestart}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
        >
          Пройти заново
        </button>
        <button
          onClick={() => onShare(node)}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
        >
          Поделиться результатом
        </button>
      </div>
    </motion.div>
  )
}

export default App
