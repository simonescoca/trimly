import { ImageDown } from 'lucide-react'
import { useI18n } from '../i18n/context'
import s from './DropOverlay.module.css'

export function DropOverlay() {
  const { t } = useI18n()
  return (
    <div className={s.overlay} aria-hidden>
      <div className={s.box}>
        <ImageDown size={40} strokeWidth={1.75} />
        <p className={s.title}>{t('drop.release')}</p>
        <p className={s.hint}>{t('drop.hint')}</p>
      </div>
    </div>
  )
}
