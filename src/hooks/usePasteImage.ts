import { useEffect, useEffectEvent } from 'react'

/** Calls `onFiles` when the user pastes an image anywhere (except inside text fields). */
export function usePasteImage(onFiles: (files: File[]) => void) {
  const emit = useEffectEvent(onFiles)

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return
      let files = Array.from(e.clipboardData?.items ?? [])
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((f): f is File => !!f)
      // Some browsers only expose pasted files through `files`.
      if (!files.length) files = Array.from(e.clipboardData?.files ?? [])
      if (!files.length) return
      e.preventDefault()
      emit(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])
}
