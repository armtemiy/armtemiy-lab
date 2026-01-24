import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { diagnosticTree } from './data/diagnosticTree'
import type { DiagnosticTree } from './data/diagnosticTree'
import { config } from './lib/config'
import { getTelegramUser, initTelegram } from './lib/telegram'
import type { TelegramUser } from './lib/telegram'
import { ModuleCard } from './components/ModuleCard'
import { AdminModule } from './modules/AdminModule'
import { AnthroModule } from './modules/AnthroModule'
import { CounterModule } from './modules/CounterModule'
import { DiagnosticWizard } from './modules/DiagnosticWizard'
import type { TreeSource, WebAppStatus } from './types'
import { fadeUp } from './ui'

type View = 'home' | 'wizard' | 'anthro' | 'counter' | 'admin'

const treeStorageKey = 'armtemiy_lab_tree_override'

function App() {
  const [view, setView] = useState<View>('home')
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [premiumUnlocked, setPremiumUnlocked] = useState(false)
  const [tree, setTree] = useState<DiagnosticTree>(diagnosticTree)
  const [treeSource, setTreeSource] = useState<TreeSource>('default')
  const [webAppStatus, setWebAppStatus] = useState<WebAppStatus>({
    available: false,
    openInvoice: false,
    platform: 'unknown',
    launchParams: false,
  })

  useEffect(() => {
    initTelegram()
    const user = getTelegramUser()
    setTelegramUser(user)

    const webApp = (window as any)?.Telegram?.WebApp
    const params = new URLSearchParams(window.location.search)
    const hasLaunchParams = Array.from(params.keys()).some((key) => key.startsWith('tgWebApp'))
    setWebAppStatus({
      available: Boolean(webApp),
      openInvoice: Boolean(webApp?.openInvoice),
      platform: webApp?.platform || 'unknown',
      launchParams: hasLaunchParams,
    })

    const applyTheme = (nextScheme?: string) => {
      const fallback = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const scheme = nextScheme === 'light' || nextScheme === 'dark' ? nextScheme : fallback
      document.documentElement.dataset.theme = scheme
    }

    applyTheme(webApp?.colorScheme)

    if (webApp?.onEvent) {
      webApp.onEvent('themeChanged', () => {
        applyTheme(webApp?.colorScheme)
      })
    }

    const stored = localStorage.getItem(treeStorageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DiagnosticTree
        if (parsed?.start && parsed?.nodes) {
          setTree(parsed)
          setTreeSource('override')
        }
      } catch {
        localStorage.removeItem(treeStorageKey)
      }
    }
  }, [])

  const isAdmin = telegramUser?.id ? config.adminIds.includes(telegramUser.id) : false
  const canAccessPremium = isAdmin || premiumUnlocked

  return (
    <div className="min-h-screen px-4 pb-16 pt-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-faint">Armtemiy Lab</p>
            <h1 className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">
              Тактический
              <br />
              разбор поражения
            </h1>
          </div>
          <div className="flex flex-col items-end text-right text-xs">
            <span className="pill">Beta</span>
            {isAdmin && (
              <span className="mt-2 rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent-contrast)]">
                Admin
              </span>
            )}
            {telegramUser?.username && (
              <span className="mt-2 font-mono text-[11px] text-faint">@{telegramUser.username}</span>
            )}
            <span className="mt-2 font-mono text-[10px] text-faint">
              WebApp {webAppStatus.available ? 'on' : 'off'} · invoice{' '}
              {webAppStatus.openInvoice ? 'on' : 'off'} · {webAppStatus.platform}
              {webAppStatus.launchParams ? ' · params' : ''}
            </span>
            {telegramUser?.id && (
              <span className="mt-1 font-mono text-[10px] text-faint">id:{telegramUser.id}</span>
            )}
          </div>
        </header>

        <div className="card">
          <p className="text-sm text-muted">
            Ответь на 5–7 вопросов. Алгоритм даст диагноз и точечную рекомендацию.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="pill text-white">60 секунд</span>
            <span className="pill text-white">Без воды</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" {...fadeUp} className="flex flex-col gap-4">
              <div className="card">
                <p className="text-sm text-muted">Модули</p>
                <div className="mt-4 grid gap-3">
                  <ModuleCard
                    title="Диагностика поражения"
                    description="Пошаговый разбор на 60 секунд."
                    actionLabel="Запустить"
                    onAction={() => setView('wizard')}
                  />
                  <ModuleCard
                    title="Антропометрия"
                    description="Подбор базового стиля по рычагам."
                    actionLabel="Открыть"
                    onAction={() => setView('anthro')}
                  />
                  <ModuleCard
                    title="Контр-матрица"
                    description="Быстрый подбор контр-приема."
                    actionLabel="Открыть"
                    onAction={() => setView('counter')}
                  />
                  {isAdmin && (
                    <ModuleCard
                      title="Админ: Логика"
                      description="Загрузка и экспорт дерева решений."
                      actionLabel="Открыть"
                      onAction={() => setView('admin')}
                    />
                  )}
                </div>
              </div>

              <div className="card">
                <p className="text-sm text-muted">Статус логики</p>
                <p className="mt-2 text-xs text-faint">
                  Дерево: {treeSource === 'override' ? 'кастомное' : 'по умолчанию'} · Узлов:{' '}
                  {Object.keys(tree.nodes).length}
                </p>
              </div>
            </motion.div>
          )}

          {view === 'wizard' && (
            <motion.div key="wizard" {...fadeUp}>
              <DiagnosticWizard
                tree={tree}
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

          {view === 'anthro' && (
            <motion.div key="anthro" {...fadeUp}>
              <AnthroModule onExit={() => setView('home')} />
            </motion.div>
          )}

          {view === 'counter' && (
            <motion.div key="counter" {...fadeUp}>
              <CounterModule onExit={() => setView('home')} />
            </motion.div>
          )}

          {view === 'admin' && isAdmin && (
            <motion.div key="admin" {...fadeUp}>
              <AdminModule
                tree={tree}
                treeSource={treeSource}
                onExit={() => setView('home')}
                onApply={(nextTree) => {
                  setTree(nextTree)
                  setTreeSource('override')
                  localStorage.setItem(treeStorageKey, JSON.stringify(nextTree))
                }}
                onReset={() => {
                  setTree(diagnosticTree)
                  setTreeSource('default')
                  localStorage.removeItem(treeStorageKey)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
