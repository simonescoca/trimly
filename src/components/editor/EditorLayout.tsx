import { useState, type ReactNode } from 'react'
import { useI18n } from '../../i18n/context'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import s from './EditorLayout.module.css'

export type Panel = {
  id: string
  title: string
  /** Short label + icon for the mobile tab bar; panels sharing a tab are shown together. */
  tab: { id: string; label: string; icon: ReactNode }
  content: ReactNode
  hidden?: boolean
}

type Props = {
  stage: ReactNode
  panels: Panel[]
  /** Desktop only: pinned to the bottom of the sidebar (download area). */
  footer: ReactNode
  /** Mobile tab order (panel order is the desktop order). */
  tabOrder: string[]
}

export function EditorLayout({ stage, panels, footer, tabOrder }: Props) {
  const isDesktop = useIsDesktop()
  const visible = panels.filter((p) => !p.hidden)

  if (isDesktop) {
    return (
      <main className={s.desktop}>
        <div className={s.stageArea}>{stage}</div>
        <aside className={s.sidebar}>
          <div className={s.sidebarScroll}>
            {visible.map((p) => (
              <Section key={p.id} title={p.title}>
                {p.content}
              </Section>
            ))}
          </div>
          <div className={s.footer}>{footer}</div>
        </aside>
      </main>
    )
  }
  return <MobileLayout stage={stage} panels={visible} tabOrder={tabOrder} />
}

function MobileLayout({ stage, panels, tabOrder }: { stage: ReactNode; panels: Panel[]; tabOrder: string[] }) {
  const { t } = useI18n()
  const tabs = panels
    .map((p) => p.tab)
    .filter((tab, i, all) => all.findIndex((x) => x.id === tab.id) === i)
    .sort((a, b) => tabOrder.indexOf(a.id) - tabOrder.indexOf(b.id))
  const [active, setActive] = useState(tabs[0]?.id)
  const current = tabs.some((tab) => tab.id === active) ? active : tabs[0]?.id

  return (
    <main className={s.mobile}>
      <div className={s.stageArea}>{stage}</div>
      <div className={s.sheet} role="tabpanel" id="tool-panel" aria-labelledby={`tab-${current}`}>
        {panels
          .filter((p) => p.tab.id === current)
          .map((p) => (
            <Section key={p.id} title={p.title}>
              {p.content}
            </Section>
          ))}
      </div>
      <nav className={s.tabbar} role="tablist" aria-label={t('tabs.label')}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={tab.id === current}
            aria-controls="tool-panel"
            className={s.tab}
            onClick={() => setActive(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={s.section} aria-label={title}>
      <h2 className={s.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}
