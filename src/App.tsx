import { EmptyState } from './components/EmptyState'
import { Header } from './components/Header'
import { ToastProvider } from './components/ui/Toast'
import { I18nProvider } from './i18n/I18nProvider'
import s from './App.module.css'

function Shell() {
  return (
    <div className={s.app}>
      <Header />
      <EmptyState onChoose={() => {}} onSample={() => {}} />
    </div>
  )
}

export function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </I18nProvider>
  )
}
