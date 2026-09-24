import { Circle, RectangleHorizontal, Squircle } from 'lucide-react'
import type { Dispatch } from 'react'
import { useI18n } from '../../../i18n/context'
import { DEFAULT_ROUNDNESS, type Action, type Doc, type Shape } from '../../../state/editor'
import { Segmented } from '../../ui/Segmented'
import { Slider } from '../../ui/Slider'
import s from './panels.module.css'

export function ShapePanel({ doc, dispatch }: { doc: Doc; dispatch: Dispatch<Action> }) {
  const { t } = useI18n()
  return (
    <div className={s.stack}>
      <Segmented<Shape>
        label={t('panel.shape')}
        value={doc.shape}
        onChange={(shape) => dispatch({ type: 'shape', shape })}
        options={[
          { value: 'rect', label: t('shape.rect'), icon: <RectangleHorizontal size={20} strokeWidth={1.75} /> },
          { value: 'rounded', label: t('shape.rounded'), icon: <Squircle size={20} strokeWidth={1.75} /> },
          { value: 'circle', label: t('shape.circle'), icon: <Circle size={20} strokeWidth={1.75} /> },
        ]}
      />
      {doc.shape === 'rounded' && (
        <Slider
          label={t('shape.roundness')}
          value={doc.roundness}
          min={0}
          max={100}
          defaultValue={DEFAULT_ROUNDNESS}
          format={(v) => `${v}%`}
          onChange={(value) => dispatch({ type: 'roundness', value })}
          onCommit={() => dispatch({ type: 'commit' })}
        />
      )}
    </div>
  )
}
