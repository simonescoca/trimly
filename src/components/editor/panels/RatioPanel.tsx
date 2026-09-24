import { RectangleHorizontal, RectangleVertical } from 'lucide-react'
import type { Dispatch } from 'react'
import { useI18n } from '../../../i18n/context'
import { RATIO_PRESETS, type Action, type Doc, type RatioId } from '../../../state/editor'
import { IconButton } from '../../ui/Button'
import { Chip, Chips } from '../../ui/Chip'
import { NumberField } from '../../ui/NumberField'
import s from './panels.module.css'

export function RatioPanel({ doc, dispatch }: { doc: Doc; dispatch: Dispatch<Action> }) {
  const { t } = useI18n()
  const presetLabel = (w: number, h: number) => (doc.portrait && w !== h ? `${h}:${w}` : `${w}:${h}`)
  const choose = (id: RatioId) => dispatch({ type: 'ratio', id })
  // Swapping means nothing for a square or for the photo's own ratio.
  const canSwap = doc.ratioId !== '1:1' && doc.ratioId !== 'original'
  const isPortrait = doc.ratioId === 'free' ? doc.crop.h > doc.crop.w : doc.ratioId === 'custom' ? doc.custom.h > doc.custom.w : doc.portrait

  return (
    <div className={s.stack}>
      <div className={s.ratioRow}>
        <div className={s.scrollChips}>
          <Chips label={t('panel.ratio')}>
            <Chip selected={doc.ratioId === 'free'} onClick={() => choose('free')}>
              {t('ratio.free')}
            </Chip>
            <Chip selected={doc.ratioId === 'original'} onClick={() => choose('original')}>
              {t('ratio.original')}
            </Chip>
            {RATIO_PRESETS.map((p) => (
              <Chip key={p.id} selected={doc.ratioId === p.id} onClick={() => choose(p.id)}>
                {presetLabel(p.w, p.h)}
              </Chip>
            ))}
            <Chip selected={doc.ratioId === 'custom'} onClick={() => choose('custom')}>
              {t('ratio.custom')}
            </Chip>
          </Chips>
        </div>
        <IconButton label={t('ratio.swap')} disabled={!canSwap} onClick={() => dispatch({ type: 'swapRatio' })}>
          {isPortrait ? <RectangleVertical size={18} /> : <RectangleHorizontal size={18} />}
        </IconButton>
      </div>
      {doc.ratioId === 'custom' && (
        <div className={s.custom}>
          <NumberField
            label={t('ratio.customWidth')}
            value={doc.custom.w}
            decimals={2}
            min={0.01}
            max={1000}
            onCommit={(w) => dispatch({ type: 'customRatio', w, h: doc.custom.h })}
          />
          <span>:</span>
          <NumberField
            label={t('ratio.customHeight')}
            value={doc.custom.h}
            decimals={2}
            min={0.01}
            max={1000}
            onCommit={(h) => dispatch({ type: 'customRatio', w: doc.custom.w, h })}
          />
        </div>
      )}
    </div>
  )
}
