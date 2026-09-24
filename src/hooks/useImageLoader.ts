import { useCallback, useRef, useState } from 'react'
import { useToast } from '../components/ui/Toast'
import { useI18n } from '../i18n/context'
import type { MessageKey } from '../i18n'
import { DecodeError, decodeImage, type LoadedImage } from '../lib/decode'
import { FORMAT_LABEL, formatFromFileInfo } from '../lib/formats'

const ERROR_KEYS: Record<DecodeError['code'], MessageKey> = {
  notImage: 'error.notImage',
  unsupported: 'error.unsupported',
  corrupt: 'error.corrupt',
  empty: 'error.empty',
  decoderOffline: 'error.decoderOffline',
}

/** Turns dropped/picked/pasted files into a LoadedImage, with progress and friendly errors. */
export function useImageLoader(onLoaded: (image: LoadedImage) => void) {
  const { t } = useI18n()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const latest = useRef(0)

  const load = useCallback(
    async (files: File[]) => {
      if (!files.length) return
      // Prefer the first thing that looks like an image; otherwise try the first file to get a clear error.
      const file = files.find((f) => f.type.startsWith('image/') || formatFromFileInfo(f.name, f.type)) ?? files[0]
      if (files.length > 1) toast(t('notice.multiple'))

      const token = ++latest.current
      setBusy(t('load.opening'))
      try {
        const image = await decodeImage(file, (format) => {
          if (token === latest.current) setBusy(t('load.converting', { format: FORMAT_LABEL[format] }))
        })
        if (token !== latest.current) return image.dispose() // a newer file won the race
        onLoaded(image)
        if (image.downscaledFrom) toast(t('notice.downscaled', { size: `${image.width} × ${image.height}` }))
      } catch (error) {
        if (token !== latest.current) return
        console.warn('Could not open image', error)
        toast(t(error instanceof DecodeError ? ERROR_KEYS[error.code] : 'error.corrupt'), 'error')
      } finally {
        if (token === latest.current) setBusy(null)
      }
    },
    [onLoaded, t, toast],
  )

  return { load, busy }
}
