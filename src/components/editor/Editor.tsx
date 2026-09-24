import { Download, Palette, RotateCw, Shapes } from 'lucide-react'
import { useReducer, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { useExporter, type Exporter } from '../../hooks/useExporter'
import { useI18n } from '../../i18n/context'
import type { MessageKey } from '../../i18n'
import type { LoadedImage } from '../../lib/decode'
import { editorReducer, initialState } from '../../state/editor'
import { Button } from '../ui/Button'
import { EditorLayout, type Panel } from './EditorLayout'
import { ExportPanel } from './panels/ExportPanel'
import { PreviewPanel } from './panels/PreviewPanel'
import { RatioPanel } from './panels/RatioPanel'
import { ShapePanel } from './panels/ShapePanel'
import { StylePanel } from './panels/StylePanel'
import { TransformPanel } from './panels/TransformPanel'
import { Stage } from './Stage'

type Props = { image: LoadedImage }

function DownloadButton({ exporter, compact }: { exporter: Exporter; compact?: boolean }) {
  const { t } = useI18n()
  return (
    <Button
      variant="primary"
      size={compact ? 'sm' : 'lg'}
      block={!compact}
      icon={<Download size={compact ? 16 : 18} />}
      onClick={exporter.download}
      disabled={exporter.busy}
      aria-busy={exporter.busy}
    >
      {exporter.busy && !compact ? t('export.preparing') : t('export.download')}
    </Button>
  )
}

export function Editor({ image }: Props) {
  const { t } = useI18n()
  const isDesktop = useIsDesktop()
  const [state, dispatch] = useReducer(editorReducer, image, (img) => initialState(img.width, img.height))
  const exporter = useExporter(image, state)
  const { doc } = state

  // On phones the Download button lives in the header, always in reach.
  // The header is already on the page when the editor opens (it's shown on the start screen too).
  const [headerSlot] = useState(() => document.getElementById('header-slot'))

  const tab = (id: 'shape' | 'style' | 'transform' | 'export', icon: ReactNode) => ({ id, label: t(`tabs.${id}` as MessageKey), icon })
  const exportTab = tab('export', <Download size={20} />)
  const panels: Panel[] = [
    { id: 'preview', title: t('panel.preview'), tab: exportTab, content: <PreviewPanel image={image} doc={doc} exporter={exporter} /> },
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
      content: <StylePanel doc={doc} dispatch={dispatch} outputShortSide={Math.min(exporter.size.w, exporter.size.h)} />,
      hidden: doc.shape === 'rect',
    },
    {
      id: 'transform',
      title: t('panel.transform'),
      tab: tab('transform', <RotateCw size={20} />),
      content: <TransformPanel doc={doc} dispatch={dispatch} />,
    },
    { id: 'export', title: t('panel.export'), tab: exportTab, content: <ExportPanel doc={doc} exporter={exporter} /> },
  ]

  return (
    <>
      <EditorLayout
        stage={<Stage image={image} state={state} dispatch={dispatch} />}
        panels={panels}
        tabOrder={['shape', 'style', 'transform', 'export']}
        footer={<DownloadButton exporter={exporter} />}
      />
      {!isDesktop && headerSlot && createPortal(<DownloadButton exporter={exporter} compact />, headerSlot)}
    </>
  )
}
