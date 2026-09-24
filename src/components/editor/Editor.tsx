import { Download, RotateCw, Shapes } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import type { LoadedImage } from '../../lib/decode'
import { Button } from '../ui/Button'
import { EditorLayout } from './EditorLayout'

type Props = { image: LoadedImage }

// T3 placeholder: shows the decoded image. The interactive stage arrives in T5.
export function Editor({ image }: Props) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => {
      const { clientWidth: cw, clientHeight: ch } = canvas
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
      const scale = Math.min((cw - 48) / image.width, (ch - 48) / image.height)
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingQuality = 'high'
      const w = image.width * scale
      const h = image.height * scale
      ctx.drawImage(image.preview, (cw - w) / 2, (ch - h) / 2, w, h)
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [image])

  const tab = (id: string, icon: React.ReactNode) => ({ id, label: t(`tabs.${id}` as 'tabs.shape'), icon })
  return (
    <EditorLayout
      stage={
        <canvas
          ref={canvasRef}
          data-testid="stage-canvas"
          data-image={`${image.width}x${image.height} ${image.format}${image.hasAlpha ? ' alpha' : ''}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      }
      panels={[
        { id: 'shape', title: t('panel.shape'), tab: tab('shape', <Shapes size={20} />), content: null },
        { id: 'transform', title: t('panel.transform'), tab: tab('transform', <RotateCw size={20} />), content: null },
        { id: 'export', title: t('panel.export'), tab: tab('export', <Download size={20} />), content: null },
      ]}
      footer={
        <Button variant="primary" size="lg" block icon={<Download size={18} />}>
          {t('export.download')}
        </Button>
      }
    />
  )
}
