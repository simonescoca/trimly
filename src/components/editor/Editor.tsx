import { Download, Palette, RotateCw, Shapes } from 'lucide-react'
import { useReducer, type ReactNode } from 'react'
import { useI18n } from '../../i18n/context'
import type { MessageKey } from '../../i18n'
import type { LoadedImage } from '../../lib/decode'
import { editorReducer, initialState } from '../../state/editor'
import { Button } from '../ui/Button'
import { EditorLayout, type Panel } from './EditorLayout'
import { RatioPanel } from './panels/RatioPanel'
import { ShapePanel } from './panels/ShapePanel'
import { StylePanel } from './panels/StylePanel'
import { TransformPanel } from './panels/TransformPanel'
import { Stage } from './Stage'

type Props = { image: LoadedImage }

export function Editor({ image }: Props) {
  const { t } = useI18n()
  const [state, dispatch] = useReducer(editorReducer, image, (img) => initialState(img.width, img.height))
  const { doc } = state

  const tab = (id: 'shape' | 'style' | 'transform' | 'export', icon: ReactNode) => ({ id, label: t(`tabs.${id}` as MessageKey), icon })
  const panels: Panel[] = [
    { id: 'shape', title: t('panel.shape'), tab: tab('shape', <Shapes size={20} />), content: <ShapePanel doc={doc} dispatch={dispatch} /> },
    {
      id: 'ratio',
      title: t('panel.ratio'),
      tab: tab('shape', <Shapes size={20} />),
      content: <RatioPanel doc={doc} dispatch={dispatch} />,
      hidden: doc.shape === 'circle',
    },
    {
      id: 'style',
      title: t('panel.style'),
      tab: tab('style', <Palette size={20} />),
      content: <StylePanel doc={doc} dispatch={dispatch} outputShortSide={Math.min(doc.crop.w, doc.crop.h)} />,
      hidden: doc.shape === 'rect',
    },
    {
      id: 'transform',
      title: t('panel.transform'),
      tab: tab('transform', <RotateCw size={20} />),
      content: <TransformPanel doc={doc} dispatch={dispatch} />,
    },
    { id: 'export', title: t('panel.export'), tab: tab('export', <Download size={20} />), content: null },
  ]

  return (
    <EditorLayout
      stage={<Stage image={image} state={state} dispatch={dispatch} />}
      panels={panels}
      footer={
        <Button variant="primary" size="lg" block icon={<Download size={18} />}>
          {t('export.download')}
        </Button>
      }
    />
  )
}
