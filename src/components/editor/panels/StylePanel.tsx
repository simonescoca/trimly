import type { Dispatch } from 'react'
import { useI18n } from '../../../i18n/context'
import { MAX_BORDER, type Action, type Doc } from '../../../state/editor'
import { Segmented } from '../../ui/Segmented'
import { Slider } from '../../ui/Slider'
import { Swatches } from '../../ui/Swatches'
import s from './panels.module.css'

const ACCENT = '#5b4cf0'

export function StylePanel({ doc, dispatch, outputShortSide }: { doc: Doc; dispatch: Dispatch<Action>; outputShortSide: number }) {
  const { t } = useI18n()
  const colors = [
    { value: '#ffffff', name: t('color.white') },
    { value: '#000000', name: t('color.black') },
    { value: '#eeeef2', name: t('color.grey') },
    { value: ACCENT, name: t('color.accent') },
  ]
  const borderPx = Math.round(doc.borderWidth * outputShortSide)

  return (
    <div className={s.stack}>
      <div className={s.stack} style={{ gap: 10 }}>
        <span className={s.label}>{t('style.outside')}</span>
        <Segmented<'transparent' | 'color'>
          compact
          label={t('style.outside')}
          value={doc.background === null ? 'transparent' : 'color'}
          onChange={(v) => dispatch({ type: 'background', color: v === 'transparent' ? null : '#ffffff' })}
          options={[
            { value: 'transparent', label: t('style.transparent') },
            { value: 'color', label: t('style.color') },
          ]}
        />
        {doc.background !== null && (
          <Swatches
            label={t('style.backgroundColor')}
            customLabel={t('color.custom')}
            colors={colors}
            value={doc.background}
            onChange={(color) => dispatch({ type: 'background', color })}
          />
        )}
      </div>
      <Slider
        label={t('style.border')}
        value={Math.round(doc.borderWidth * 1000) / 10}
        min={0}
        max={MAX_BORDER * 100}
        step={0.5}
        defaultValue={0}
        format={() => (borderPx > 0 ? `${borderPx} px` : t('style.none'))}
        onChange={(v) => dispatch({ type: 'borderWidth', value: v / 100 })}
        onCommit={() => dispatch({ type: 'commit' })}
      />
      {doc.borderWidth > 0 && (
        <Swatches
          label={t('style.borderColor')}
          customLabel={t('color.custom')}
          colors={colors}
          value={doc.borderColor}
          onChange={(color) => dispatch({ type: 'borderColor', color })}
        />
      )}
    </div>
  )
}
