import { useEffect, useRef } from 'react'
import type { LoadedImage } from '../../../lib/decode'
import { renderOutput } from '../../../lib/export'
import type { Doc } from '../../../state/editor'
import type { Exporter } from '../../../hooks/useExporter'
import { useI18n } from '../../../i18n/context'
import { formatBytes, FORMAT_NAME } from '../../../lib/export'
import s from './panels.module.css'

const BOX = { w: 272, h: 160 }

/** Live thumbnail of the exact result, on a checkerboard so transparency is visible. */
export function PreviewPanel({ image, doc, exporter }: { image: LoadedImage; doc: Doc; exporter: Exporter }) {
  const { t } = useI18n()
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const canvas = ref.current
      if (!canvas) return
      const scale = Math.min(BOX.w / doc.crop.w, BOX.h / doc.crop.h)
      const w = Math.max(1, Math.round(doc.crop.w * scale))
      const h = Math.max(1, Math.round(doc.crop.h * scale))
      const dpr = window.devicePixelRatio || 1
      const rendered = renderOutput(image, doc, Math.round(w * dpr), Math.round(h * dpr), false)
      canvas.width = rendered.width
      canvas.height = rendered.height
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(rendered, 0, 0)
      rendered.width = rendered.height = 0
    })
    return () => cancelAnimationFrame(frame)
  }, [image, doc])

  const { size, format, bytes } = exporter
  return (
    <div className="stack" style={{ display: 'grid', gap: 10 }}>
      <div className={`${s.preview} checker`}>
        <canvas ref={ref} data-testid="preview-canvas" />
      </div>
      <div className={s.meta} data-testid="export-summary">
        <span>
          <strong>{t('export.summary', { size: `${size.w} × ${size.h}`, format: FORMAT_NAME[format] })}</strong>
        </span>
        <span>{bytes === null ? t('export.estimating') : `≈ ${formatBytes(bytes, exporter.formatBytesLocale)}`}</span>
      </div>
    </div>
  )
}
