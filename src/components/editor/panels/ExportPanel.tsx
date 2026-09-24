import { Copy, Share2, TriangleAlert } from 'lucide-react'
import { useI18n } from '../../../i18n/context'
import type { MessageKey } from '../../../i18n'
import type { Exporter } from '../../../hooks/useExporter'
import { canEncodeWebp, FORMAT_NAME, type OutputFormat } from '../../../lib/export'
import type { Doc } from '../../../state/editor'
import { Button } from '../../ui/Button'
import { Chip, Chips } from '../../ui/Chip'
import { NumberField } from '../../ui/NumberField'
import { Segmented } from '../../ui/Segmented'
import { Slider } from '../../ui/Slider'
import s from './panels.module.css'

const QUICK_SIZES = [512, 1080, 2048]

export function ExportPanel({ doc, exporter }: { doc: Doc; exporter: Exporter }) {
  const { t } = useI18n()
  const { options, setOptions, format, size, transparent } = exporter
  const formats: OutputFormat[] = canEncodeWebp() ? ['png', 'jpeg', 'webp'] : ['png', 'jpeg']
  const ratio = doc.crop.w / doc.crop.h
  const setWidth = (width: number) => setOptions((o) => ({ ...o, size: { mode: 'custom', width } }))
  const longSide = Math.max(size.w, size.h)

  return (
    <div className={s.stack}>
      <div className={s.stack} style={{ gap: 8 }}>
        <span className={s.label}>{t('export.format')}</span>
        <Segmented<OutputFormat>
          compact
          label={t('export.format')}
          value={format}
          onChange={(f) => setOptions((o) => ({ ...o, format: f }))}
          options={formats.map((f) => ({ value: f, label: FORMAT_NAME[f] }))}
        />
        <p className={s.hint}>{t(`export.hint.${format}` as MessageKey)}</p>
        {format === 'jpeg' && transparent && (
          <p className={s.warn}>
            <TriangleAlert size={14} /> {t('export.noTransparency')}
          </p>
        )}
      </div>

      {format !== 'png' && (
        <Slider
          label={t('export.quality')}
          value={Math.round(options.quality * 100)}
          min={40}
          max={100}
          defaultValue={92}
          format={(v) => `${v}%`}
          onChange={(v) => setOptions((o) => ({ ...o, quality: v / 100 }))}
        />
      )}

      <div className={s.stack} style={{ gap: 8 }}>
        <span className={s.label}>{t('export.size')}</span>
        <Segmented<'original' | 'custom'>
          compact
          label={t('export.size')}
          value={options.size.mode}
          onChange={(mode) => setOptions((o) => ({ ...o, size: mode === 'original' ? { mode } : { mode, width: size.w } }))}
          options={[
            { value: 'original', label: t('export.sizeOriginal') },
            { value: 'custom', label: t('export.sizeCustom') },
          ]}
        />
        {options.size.mode === 'custom' && (
          <>
            <div className={s.sizeFields}>
              <NumberField label={t('export.width')} value={size.w} unit="px" max={16384} onCommit={setWidth} />
              <span>×</span>
              <NumberField label={t('export.height')} value={size.h} unit="px" max={16384} onCommit={(h) => setWidth(Math.max(1, Math.round(h * ratio)))} />
            </div>
            <Chips label={t('export.quickSizes')}>
              {QUICK_SIZES.map((px) => (
                <Chip key={px} selected={longSide === px} onClick={() => setWidth(ratio >= 1 ? px : Math.max(1, Math.round(px * ratio)))}>
                  {px}
                </Chip>
              ))}
            </Chips>
          </>
        )}
        {size.upscaled && (
          <p className={s.warn}>
            <TriangleAlert size={14} /> {t('export.upscale')}
          </p>
        )}
        {size.limited && (
          <p className={s.warn}>
            <TriangleAlert size={14} /> {t('export.limited', { size: `${size.w} × ${size.h}` })}
          </p>
        )}
      </div>

      {(exporter.copy || exporter.share) && (
        <div className={s.actions}>
          {exporter.copy && (
            <Button size="sm" icon={<Copy size={15} />} onClick={exporter.copy}>
              {t('export.copy')}
            </Button>
          )}
          {exporter.share && (
            <Button size="sm" icon={<Share2 size={15} />} onClick={exporter.share}>
              {t('export.share')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
