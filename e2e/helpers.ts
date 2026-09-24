import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type Page } from '@playwright/test'

export const FIXTURES = join(import.meta.dirname, 'fixtures')
export const fixturePath = (name: string) => join(FIXTURES, name)

export const COLORS = {
  red: [255, 0, 0],
  green: [0, 200, 0],
  blue: [0, 0, 255],
  yellow: [255, 215, 0],
} as const

/** Opens a fixture through the real file picker input. */
export async function openFixture(page: Page, name: string) {
  await page.getByTestId('file-input').setInputFiles(fixturePath(name))
}

export async function expectEditorWith(page: Page, info: string | RegExp) {
  await expect(page.getByTestId('stage-canvas')).toHaveAttribute('data-image', info)
}

type FilePayload = { name: string; type: string; base64: string }
export const payload = (name: string, type = ''): FilePayload => ({
  name,
  type,
  base64: readFileSync(fixturePath(name)).toString('base64'),
})

/** Simulates dragging files from the desktop and dropping them on the page. */
export async function dropFiles(page: Page, files: FilePayload[], { release = true } = {}) {
  await page.evaluate(
    ({ files, release }) => {
      const dt = new DataTransfer()
      for (const f of files) {
        const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0))
        dt.items.add(new File([bytes], f.name, { type: f.type }))
      }
      const fire = (type: string) => document.body.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }))
      fire('dragenter')
      fire('dragover')
      if (release) fire('drop')
    },
    { files, release },
  )
}

/** Simulates ⌘V / Ctrl+V with an image on the clipboard. */
export async function pasteFile(page: Page, file: FilePayload) {
  await page.evaluate((f) => {
    const dt = new DataTransfer()
    const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0))
    dt.items.add(new File([bytes], f.name, { type: f.type }))
    document.body.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }))
  }, file)
}

/** RGB of the stage canvas at an offset (CSS px) from its centre. */
export async function stagePixel(page: Page, dx: number, dy: number): Promise<number[]> {
  return page.getByTestId('stage-canvas').evaluate(
    (canvas: HTMLCanvasElement, [dx, dy]) => {
      const dpr = canvas.width / canvas.clientWidth
      const x = Math.round((canvas.clientWidth / 2 + dx) * dpr)
      const y = Math.round((canvas.clientHeight / 2 + dy) * dpr)
      return Array.from(canvas.getContext('2d')!.getImageData(x, y, 1, 1).data.slice(0, 3))
    },
    [dx, dy],
  )
}

export function expectColor(actual: number[], expected: readonly number[], tolerance = 40) {
  // Compare only the channels given (RGB), ignoring alpha when present.
  const close = expected.every((v, i) => Math.abs(actual[i] - v) <= tolerance)
  expect(close, `expected rgb(${expected}) but got rgba(${actual})`).toBe(true)
}

/** Checks the four quadrants of the test pattern around the stage centre. */
export async function expectPatternOnStage(page: Page, d = 30) {
  await expect.poll(async () => (await stagePixel(page, -d, -d)).join()).not.toBe('0,0,0')
  expectColor(await stagePixel(page, -d, -d), COLORS.red)
  expectColor(await stagePixel(page, d, -d), COLORS.green)
  expectColor(await stagePixel(page, -d, d), COLORS.blue)
  expectColor(await stagePixel(page, d, d), COLORS.yellow)
}
