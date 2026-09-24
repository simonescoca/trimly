import { Circle, Crop, ImagePlus, LockKeyhole, Proportions, Sparkles } from 'lucide-react'
import { useI18n } from '../i18n/context'
import { Button } from './ui/Button'
import s from './EmptyState.module.css'

type Props = {
  busyMessage?: string | null
  onChoose: () => void
  onSample: () => void
}

const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export function EmptyState({ busyMessage, onChoose, onSample }: Props) {
  const { t } = useI18n()
  const shortcut = isApple ? '⌘V' : 'Ctrl+V'
  const [pasteBefore, pasteAfter] = t('empty.pasteHint').split('{shortcut}')

  return (
    <main className={s.wrap}>
      <div className={s.inner}>
        <section
          className={s.card}
          aria-busy={!!busyMessage}
          // The whole card is a big target; the button inside stays the accessible control.
          onClick={(e) => {
            if (!busyMessage && !(e.target as HTMLElement).closest('button')) onChoose()
          }}
        >
          <div className={s.icon}>
            <ImagePlus size={30} strokeWidth={1.75} />
          </div>
          <h1 className={s.title}>{t('empty.title')}</h1>
          <p className={s.subtitle}>{t('empty.subtitle')}</p>
          <div className={s.cta}>
            {busyMessage ? (
              <span className={s.busy} role="status">
                <span className={s.spinner} aria-hidden />
                {busyMessage}
              </span>
            ) : (
              <Button variant="primary" size="lg" onClick={onChoose} autoFocus>
                {t('empty.choose')}
              </Button>
            )}
          </div>
          <p className={s.hints}>
            <span>{t('empty.dropHint')}</span>
            <span className={s.paste}>
              · {pasteBefore}
              <kbd>{shortcut}</kbd>
              {pasteAfter}
            </span>
          </p>
        </section>

        <div className={s.features}>
          <span className={s.feature}>
            <Crop size={15} /> {t('empty.feature.free')}
          </span>
          <span className={s.feature}>
            <Proportions size={15} /> {t('empty.feature.ratios')}
          </span>
          <span className={s.feature}>
            <Circle size={15} /> {t('empty.feature.circle')}
          </span>
        </div>

        <p className={s.formats}>{t('empty.formats')}</p>

        <div className={s.foot}>
          <span className={s.privacy}>
            <LockKeyhole size={15} /> {t('empty.privacy')}
          </span>
          <Button variant="ghost" size="sm" icon={<Sparkles size={15} />} onClick={onSample} disabled={!!busyMessage}>
            {t('empty.sample')}
          </Button>
        </div>
      </div>
    </main>
  )
}
