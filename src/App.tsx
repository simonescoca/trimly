import { useCallback, useRef, useState } from 'react'
import { DropOverlay } from './components/DropOverlay'
import { EmptyState } from './components/EmptyState'
import { Header } from './components/Header'
import { Editor } from './components/editor/Editor'
import { ToastProvider } from './components/ui/Toast'
import { useFileDrop } from './hooks/useFileDrop'
import { useImageLoader } from './hooks/useImageLoader'
import { usePasteImage } from './hooks/usePasteImage'
import { I18nProvider } from './i18n/I18nProvider'
import type { LoadedImage } from './lib/decode'
import { ACCEPT } from './lib/formats'
import sampleUrl from './assets/sample.svg?url'
import s from './App.module.css'

function Shell() {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const current = useRef<LoadedImage | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const replaceImage = useCallback((next: LoadedImage | null) => {
    const previous = current.current
    current.current = next
    setImage(next)
    previous?.dispose()
  }, [])

  const { load, busy } = useImageLoader(replaceImage)
  const dragging = useFileDrop(load)
  usePasteImage(load)

  const openPicker = () => inputRef.current?.click()
  const loadSample = async () => {
    const blob = await (await fetch(sampleUrl)).blob()
    load([new File([blob], 'trimly-sample.svg', { type: 'image/svg+xml' })])
  }

  return (
    <div className={s.app}>
      <Header onHome={image ? () => replaceImage(null) : undefined} onNewImage={image ? openPicker : undefined} />
      {image ? (
        <Editor key={image.id} image={image} />
      ) : (
        <EmptyState busyMessage={busy} onChoose={openPicker} onSample={loadSample} />
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        data-testid="file-input"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = '' // allow picking the same file again
          load(files)
        }}
      />
      {dragging && <DropOverlay />}
    </div>
  )
}

export function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </I18nProvider>
  )
}
