import { useEffect, useEffectEvent } from 'react'

type LaunchParams = { files: FileSystemFileHandle[] }
type LaunchQueue = { setConsumer: (consumer: (params: LaunchParams) => void) => void }

/** Installed app (Chrome/Edge): images opened with "Open with → Trimly" arrive here. */
export function useLaunchQueue(onFiles: (files: File[]) => void) {
  const emit = useEffectEvent(onFiles)
  useEffect(() => {
    const queue = (window as unknown as { launchQueue?: LaunchQueue }).launchQueue
    queue?.setConsumer(async ({ files }) => {
      if (!files?.length) return
      emit(await Promise.all(files.map((handle) => handle.getFile())))
    })
  }, [])
}
