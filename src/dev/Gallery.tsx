// Development-only page (open /?gallery) to eyeball the UI kit in both themes.
import { Circle, Download, RectangleHorizontal, RotateCw, Shapes, Square, Sun } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { Button, IconButton } from '../components/ui/Button'
import { Chip, Chips } from '../components/ui/Chip'
import { NumberField } from '../components/ui/NumberField'
import { Segmented } from '../components/ui/Segmented'
import { Slider } from '../components/ui/Slider'
import { Swatches } from '../components/ui/Swatches'
import { ToastProvider, useToast } from '../components/ui/Toast'
import { EditorLayout } from '../components/editor/EditorLayout'
import { Header } from '../components/Header'
import { I18nProvider } from '../i18n/I18nProvider'

function Inner() {
  const { theme, toggle } = useTheme()
  const toast = useToast()
  const [shape, setShape] = useState<'rect' | 'rounded' | 'circle'>('rect')
  const [angle, setAngle] = useState(0)
  const [radius, setRadius] = useState(20)
  const [color, setColor] = useState('#ffffff')
  const [ratio, setRatio] = useState('1:1')
  const [px, setPx] = useState(1080)
  return (
    <div style={{ padding: 32, display: 'grid', gap: 24, maxWidth: 360, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong>Theme: {theme}</strong>
        <IconButton label="Toggle theme" onClick={toggle}>
          <Sun size={18} />
        </IconButton>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button variant="primary" icon={<Download size={16} />} onClick={() => toast('Downloaded!', 'success')}>
          Download
        </Button>
        <Button onClick={() => toast('Something went wrong', 'error')}>Secondary</Button>
        <Button variant="ghost" size="sm" onClick={() => toast('Just so you know')}>
          Ghost
        </Button>
      </div>
      <Segmented
        label="Shape"
        value={shape}
        onChange={setShape}
        options={[
          { value: 'rect', label: 'Rectangle', icon: <RectangleHorizontal size={18} /> },
          { value: 'rounded', label: 'Rounded', icon: <Square size={18} /> },
          { value: 'circle', label: 'Circle', icon: <Circle size={18} /> },
        ]}
      />
      <Segmented compact label="Lang" value="it" onChange={() => {}} options={[{ value: 'it', label: 'IT' }, { value: 'en', label: 'EN' }]} />
      <Chips label="Ratio">
        {['Free', '1:1', '4:5', '3:2', '16:9'].map((r) => (
          <Chip key={r} selected={ratio === r} onClick={() => setRatio(r)}>
            {r}
          </Chip>
        ))}
      </Chips>
      <Slider label="Straighten" value={angle} min={-45} max={45} step={0.1} defaultValue={0} centered format={(v) => `${v.toFixed(1)}°`} onChange={setAngle} />
      <Slider label="Roundness" value={radius} min={0} max={100} defaultValue={20} format={(v) => `${v}%`} onChange={setRadius} />
      <Swatches
        label="Background"
        customLabel="Custom colour"
        colors={[
          { value: '#ffffff', name: 'White' },
          { value: '#000000', name: 'Black' },
          { value: '#f1f1f4', name: 'Light grey' },
        ]}
        value={color}
        onChange={setColor}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <NumberField label="Width" value={px} unit="px" onCommit={setPx} />
        <NumberField label="Height" value={px} unit="px" onCommit={setPx} />
      </div>
      <div className="checker" style={{ height: 80, borderRadius: 12 }} />
    </div>
  )
}

function LayoutDemo() {
  const box = (label: string) => <div style={{ height: 90, borderRadius: 12, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>{label}</div>
  const tab = (id: string, icon: React.ReactNode) => ({ id, label: id, icon })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <Header onHome={() => {}} onNewImage={() => {}} trailing={<Button variant="primary" size="sm">Download</Button>} />
      <EditorLayout
        stage={<div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>stage</div>}
        panels={[
          { id: 'preview', title: 'Preview', tab: tab('Export', <Download size={20} />), content: box('preview') },
          { id: 'shape', title: 'Shape', tab: tab('Shape', <Shapes size={20} />), content: box('shape') },
          { id: 'ratio', title: 'Aspect ratio', tab: tab('Shape', <Shapes size={20} />), content: box('ratio') },
          { id: 'rotate', title: 'Rotate & flip', tab: tab('Rotate', <RotateCw size={20} />), content: box('rotate') },
          { id: 'export', title: 'Export', tab: tab('Export', <Download size={20} />), content: box('export') },
        ]}
        footer={<Button variant="primary" block size="lg">Download</Button>}
        tabOrder={['Shape', 'Rotate', 'Export']}
      />
    </div>
  )
}

export default function Gallery() {
  const page = new URLSearchParams(location.search).get('gallery')
  return (
    <I18nProvider>
      <ToastProvider>{page === 'layout' ? <LayoutDemo /> : <Inner />}</ToastProvider>
    </I18nProvider>
  )
}
