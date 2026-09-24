import { Pipette } from 'lucide-react'
import s from './ui.module.css'

type Props = {
  label: string
  customLabel: string
  colors: { value: string; name: string }[]
  value: string
  onChange: (color: string) => void
}

export function Swatches({ label, customLabel, colors, value, onChange }: Props) {
  const isPreset = colors.some((c) => c.value.toLowerCase() === value.toLowerCase())
  return (
    <div className={s.swatches} role="group" aria-label={label}>
      {colors.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={c.value.toLowerCase() === value.toLowerCase()}
          aria-label={c.name}
          title={c.name}
          className={s.swatch}
          style={{ background: c.value }}
          onClick={() => onChange(c.value)}
        />
      ))}
      {/* The native colour input is the control; the circle around it is just its look. */}
      <span className={`${s.swatch} ${s.swatchCustom}`} title={customLabel} data-checked={!isPreset || undefined} style={isPreset ? undefined : { background: value }}>
        {isPreset && <Pipette size={14} aria-hidden />}
        <input type="color" aria-label={customLabel} value={value} onChange={(e) => onChange(e.target.value)} />
      </span>
    </div>
  )
}
