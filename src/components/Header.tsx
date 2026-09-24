import { Moon, Plus, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import { LOCALES, type Locale } from '../i18n'
import { useTheme } from '../hooks/useTheme'
import { Button, IconButton } from './ui/Button'
import { Segmented } from './ui/Segmented'
import { LogoMark } from './Logo'
import s from './Header.module.css'

type Props = {
  onHome?: () => void
  onNewImage?: () => void
  /** Extra actions shown at the right edge (e.g. Download on mobile). */
  trailing?: ReactNode
}

export function Header({ onHome, onNewImage, trailing }: Props) {
  const { t, locale, setLocale } = useI18n()
  const { theme, toggle } = useTheme()
  return (
    <header className={s.header}>
      <button type="button" className={s.brand} onClick={onHome} disabled={!onHome} aria-label={onHome ? t('header.home') : undefined}>
        <LogoMark />
        <span className={s.brandText}>Trimly</span>
      </button>
      <div className={s.spacer} />
      <div className={s.actions}>
        {onNewImage && (
          <>
            <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={onNewImage} className={s.hideNarrow}>
              {t('header.newImage')}
            </Button>
            <IconButton label={t('header.newImage')} onClick={onNewImage} className={s.showNarrow}>
              <Plus size={20} />
            </IconButton>
          </>
        )}
        <Segmented<Locale>
          className={s.lang}
          compact
          label={t('header.language')}
          value={locale}
          onChange={setLocale}
          options={LOCALES.map((l) => ({ value: l, label: l.toUpperCase() }))}
        />
        <IconButton label={theme === 'dark' ? t('header.themeToLight') : t('header.themeToDark')} onClick={toggle}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
        {trailing}
        {/* The editor portals its mobile Download button here. */}
        <div id="header-slot" style={{ display: 'contents' }} />
      </div>
    </header>
  )
}
