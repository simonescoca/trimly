import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '../components/ui/Toast'
import { useI18n } from '../i18n/context'
import type { LoadedImage } from '../lib/decode'
import {
  DEFAULT_EXPORT,
  exportImage,
  needsTransparency,
  outputSize,
  resolveFormat,
  type ExportOptions,
  type ExportResult,
} from '../lib/export'
import type { EditorState } from '../state/editor'

const ESTIMATE_DELAY = 350

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give slow browsers (iOS) time to start the download before freeing the data.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

let shareSupport: boolean | undefined
function canShareFiles(): boolean {
  if (shareSupport === undefined) {
    try {
      shareSupport = !!navigator.canShare?.({ files: [new File(['x'], 'x.png', { type: 'image/png' })] })
    } catch {
      shareSupport = false
    }
  }
  return shareSupport
}

const canCopyImages = () => typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write

/** Export settings, live file-size estimate and the download / copy / share actions. */
export function useExporter(image: LoadedImage, state: EditorState) {
  const { t, locale } = useI18n()
  const toast = useToast()
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT)
  const [estimate, setEstimate] = useState<{ key: string; bytes: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const cache = useRef<{ key: string; result: ExportResult } | null>(null)

  const { doc } = state
  const format = resolveFormat(options, image, doc)
  const size = outputSize(doc.crop, options.size)
  const transparent = needsTransparency(image, doc)
  const key = JSON.stringify([image.id, doc, options, format])

  const render = useCallback(async (): Promise<ExportResult> => {
    if (cache.current?.key === key) return cache.current.result
    const result = await exportImage(image, doc, options)
    cache.current = { key, result }
    return result
  }, [image, doc, options, key])

  // Estimate the file size once the user pauses (not while dragging).
  const idle = state.pending === null
  useEffect(() => {
    if (!idle) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const result = await render()
        if (!cancelled) setEstimate({ key, bytes: result.blob.size })
      } catch {
        /* the download button will report real failures */
      }
    }, ESTIMATE_DELAY)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [idle, key, render])

  const download = useCallback(async () => {
    setBusy(true)
    try {
      const result = await render()
      saveBlob(result.blob, result.name)
      toast(t('export.saved', { name: result.name }), 'success')
    } catch (error) {
      console.error(error)
      toast(t('export.failed'), 'error')
    } finally {
      setBusy(false)
    }
  }, [render, t, toast])

  const copy = useCallback(async () => {
    try {
      // Safari needs the ClipboardItem created synchronously inside the click, with a promise.
      const png = exportImage(image, doc, { ...options, format: 'png' }).then((r) => r.blob)
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
      toast(t('export.copied'), 'success')
    } catch (error) {
      console.warn(error)
      toast(t('export.copyFailed'), 'error')
    }
  }, [image, doc, options, t, toast])

  const share = useCallback(async () => {
    try {
      const result = await render()
      const file = new File([result.blob], result.name, { type: result.blob.type })
      await navigator.share({ files: [file] })
    } catch (error) {
      // Closing the share sheet is not an error.
      if ((error as DOMException)?.name !== 'AbortError') {
        console.warn(error)
        toast(t('export.failed'), 'error')
      }
    }
  }, [render, t, toast])

  return {
    options,
    setOptions,
    format,
    size,
    transparent,
    bytes: estimate?.key === key ? estimate.bytes : null,
    formatBytesLocale: locale,
    busy,
    download,
    copy: canCopyImages() ? copy : null,
    share: canShareFiles() ? share : null,
  }
}

export type Exporter = ReturnType<typeof useExporter>
