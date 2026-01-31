import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { diagnosticTree } from './data/diagnosticTree'
import type { DiagnosticTree } from './data/diagnosticTree'
import { config } from './lib/config'
import { getTelegramUser, initTelegram } from './lib/telegram'
import type { TelegramUser } from './lib/telegram'
import { ModuleCard } from './components/ModuleCard'
import type { TreeSource, WebAppStatus } from './types'
import { fadeUp } from './ui'

const AdminModule = lazy(() => import('./modules/AdminModule').then((m) => ({ default: m.AdminModule })))
const AnthroModule = lazy(() => import('./modules/AnthroModule').then((m) => ({ default: m.AnthroModule })))
const CounterModule = lazy(() => import('./modules/CounterModule').then((m) => ({ default: m.CounterModule })))
const DiagnosticWizard = lazy(() => import('./modules/DiagnosticWizard').then((m) => ({ default: m.DiagnosticWizard })))
const PeriodizationCalculator = lazy(() => import('./modules/PeriodizationCalculator').then((m) => ({ default: m.PeriodizationCalculator })))
const SparringPage = lazy(() => import('./pages/SparringPage').then((m) => ({ default: m.SparringPage })))
const SparringMyProfilePage = lazy(() => import('./pages/SparringMyProfilePage').then((m) => ({ default: m.SparringMyProfilePage })))
const SparringProfilePage = lazy(() => import('./pages/SparringProfilePage').then((m) => ({ default: m.SparringProfilePage })))

const LoadingCard = () => (
  <div className="card">
    <p className="text-sm text-muted">Загрузка...</p>
  </div>
)

type View = 'home' | 'wizard' | 'anthro' | 'counter' | 'admin' | 'periodization'

const treeStorageKey = 'armtemiy_lab_tree_override'

function HomePage() {
  const navigate = useNavigate()
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [premiumUnlocked, setPremiumUnlocked] = useState(false)
  const [tree, setTree] = useState<DiagnosticTree>(diagnosticTree)
  const [treeSource, setTreeSource] = useState<TreeSource>('default')
  const [view, setView] = useState<View>('home')
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

  const isAdmin = telegramUser?.id ? config.adminIds.includes(String(telegramUser.id)) : false
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

        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" {...fadeUp} className="flex flex-col gap-4">
              <div className="card">
                <p className="text-sm text-muted">Модули</p>
                <div className="mt-4 grid gap-3">
                  <ModuleCard
                    title="Калькулятор периодизации"
                    description="План на 4 недели для силы на базовом упражнении."
                    actionLabel="Открыть"
                    onAction={() => setView('periodization')}
                  />

                  {isAdmin && (
                    <>
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
                      <ModuleCard
                        title="Найти спарринг-партнёра"
                        description="Карта армрестлеров рядом с тобой."
                        actionLabel="Открыть"
                        onAction={() => navigate('/sparring')}
                      />
                      <ModuleCard
                        title="Админ: Логика"
                        description="Загрузка и экспорт дерева решений."
                        actionLabel="Открыть"
                        onAction={() => setView('admin')}
                      />
                    </>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="card">
                  <p className="text-sm text-muted">Статус логики</p>
                  <p className="mt-2 text-xs text-faint">
                    Дерево: {treeSource === 'override' ? 'кастомное' : 'по умолчанию'} · Узлов:{' '}
                    {Object.keys(tree.nodes).length}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'periodization' && (
            <motion.div key="periodization" {...fadeUp}>
              <Suspense fallback={<LoadingCard />}>
                <PeriodizationCalculator onExit={() => setView('home')} />
              </Suspense>
            </motion.div>
          )}

          {view === 'wizard' && isAdmin && (
            <motion.div key="wizard" {...fadeUp}>
              <Suspense fallback={<LoadingCard />}>
                <DiagnosticWizard
                  tree={tree}
                  canAccessPremium={canAccessPremium}
                  onExit={() => setView('home')}
                  onUnlock={() => setPremiumUnlocked(true)}
                  isAdmin={isAdmin}
                  telegramUserId={telegramUser?.id ? String(telegramUser.id) : null}
                  telegramUsername={telegramUser?.username ?? null}
                  webAppStatus={webAppStatus}
                />
              </Suspense>
            </motion.div>
          )}

          {view === 'anthro' && isAdmin && (
            <motion.div key="anthro" {...fadeUp}>
              <Suspense fallback={<LoadingCard />}>
                <AnthroModule onExit={() => setView('home')} />
              </Suspense>
            </motion.div>
          )}

          {view === 'counter' && isAdmin && (
            <motion.div key="counter" {...fadeUp}>
              <Suspense fallback={<LoadingCard />}>
                <CounterModule onExit={() => setView('home')} />
              </Suspense>
            </motion.div>
          )}

          {view === 'admin' && isAdmin && (
            <motion.div key="admin" {...fadeUp}>
              <Suspense fallback={<LoadingCard />}>
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
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function App() {
  const location = useLocation()

  // Инициализация Telegram WebApp при старте
  useEffect(() => {
    initTelegram()
    
    // Применяем тему
    const webApp = (window as any)?.Telegram?.WebApp
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
  }, [])

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<div className="p-4"><LoadingCard /></div>}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sparring" element={<SparringPage />} />
          <Route path="/sparring/my-profile" element={<SparringMyProfilePage />} />
          <Route path="/sparring/profile/:id" element={<SparringProfilePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

export default App
