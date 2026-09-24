import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from 'lucide-react'
import type { Dispatch, ReactNode } from 'react'
import { useI18n } from '../../../i18n/context'
import { MAX_STRAIGHTEN, type Action, type Doc } from '../../../state/editor'
import { Slider } from '../../ui/Slider'
import s from './panels.module.css'

function ToolButton({ label, short, icon, onClick }: { label: string; short: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={s.toolButton} onClick={onClick} title={label} aria-label={label}>
      {icon}
      <span aria-hidden>{short}</span>
    </button>
  )
}

export function TransformPanel({ doc, dispatch }: { doc: Doc; dispatch: Dispatch<Action> }) {
  const { t } = useI18n()
  return (
    <div className={s.stack}>
      <div className={s.buttons}>
        <ToolButton label={t('transform.rotateLeft')} short={t('transform.rotateLeftShort')} icon={<RotateCcw size={20} strokeWidth={1.75} />} onClick={() => dispatch({ type: 'rotate', dir: -1 })} />
        <ToolButton label={t('transform.rotateRight')} short={t('transform.rotateRightShort')} icon={<RotateCw size={20} strokeWidth={1.75} />} onClick={() => dispatch({ type: 'rotate', dir: 1 })} />
        <ToolButton label={t('transform.flipH')} short={t('transform.flipHShort')} icon={<FlipHorizontal2 size={20} strokeWidth={1.75} />} onClick={() => dispatch({ type: 'flip', axis: 'x' })} />
        <ToolButton label={t('transform.flipV')} short={t('transform.flipVShort')} icon={<FlipVertical2 size={20} strokeWidth={1.75} />} onClick={() => dispatch({ type: 'flip', axis: 'y' })} />
      </div>
      <Slider
        label={t('transform.straighten')}
        value={doc.straighten}
        min={-MAX_STRAIGHTEN}
        max={MAX_STRAIGHTEN}
        step={0.1}
        defaultValue={0}
        centered
        format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°`}
        onChange={(degrees) => dispatch({ type: 'straighten', degrees })}
        onCommit={() => dispatch({ type: 'commit' })}
      />
    </div>
  )
}
