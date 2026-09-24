import {
  fitRect,
  flipRectX,
  flipRectY,
  maxRectWithAspect,
  placeRect,
  rectCenter,
  reshapeRect,
  rotateRect90,
  type ImageFrame,
  type Rect,
} from '../lib/geometry'

export type Shape = 'rect' | 'rounded' | 'circle'
export type RatioId = 'free' | 'original' | '1:1' | '4:3' | '3:2' | '16:9' | '5:4' | 'custom'

/** Presets are stored landscape; `portrait` flips them (4:3 → 3:4). */
export const RATIO_PRESETS: { id: RatioId; w: number; h: number }[] = [
  { id: '1:1', w: 1, h: 1 },
  { id: '5:4', w: 5, h: 4 },
  { id: '4:3', w: 4, h: 3 },
  { id: '3:2', w: 3, h: 2 },
  { id: '16:9', w: 16, h: 9 },
]

/** Everything the user edits; undo/redo snapshots this. */
export type Doc = {
  crop: Rect
  /** Quarter turns clockwise (0–3). */
  rot90: number
  /** Fine rotation in degrees (−45…45). */
  straighten: number
  flipX: boolean
  flipY: boolean
  shape: Shape
  ratioId: RatioId
  portrait: boolean
  custom: { w: number; h: number }
  /** Corner radius for the rounded shape: 0–100 % of half the short side. */
  roundness: number
  /** Colour outside the shape, or null for transparent. */
  background: string | null
  /** Border thickness as a fraction of the crop's short side (0–0.1). */
  borderWidth: number
  borderColor: string
}

export type EditorState = {
  imageW: number
  imageH: number
  doc: Doc
  past: Doc[]
  future: Doc[]
  /** Snapshot taken when a continuous interaction (drag, slider) started. */
  pending: Doc | null
  /** Crop before straightening started, so returning to 0° restores it. */
  straightenBase: Rect | null
}

export type Action =
  | { type: 'crop'; crop: Rect }
  | { type: 'begin' }
  | { type: 'commit' }
  | { type: 'shape'; shape: Shape }
  | { type: 'ratio'; id: RatioId }
  | { type: 'swapRatio' }
  | { type: 'customRatio'; w: number; h: number }
  | { type: 'rotate'; dir: 1 | -1 }
  | { type: 'flip'; axis: 'x' | 'y' }
  | { type: 'straighten'; degrees: number }
  | { type: 'roundness'; value: number }
  | { type: 'background'; color: string | null }
  | { type: 'borderWidth'; value: number }
  | { type: 'borderColor'; color: string }
  | { type: 'reset' }
  | { type: 'undo' }
  | { type: 'redo' }

const HISTORY_LIMIT = 100
export const MAX_STRAIGHTEN = 45
export const MAX_BORDER = 0.1
export const DEFAULT_ROUNDNESS = 25

export const angleOf = (doc: Pick<Doc, 'rot90' | 'straighten'>) => (doc.rot90 * Math.PI) / 2 + (doc.straighten * Math.PI) / 180
export const frameOf = (s: Pick<EditorState, 'imageW' | 'imageH'>, doc: Pick<Doc, 'rot90' | 'straighten'>): ImageFrame => ({
  w: s.imageW,
  h: s.imageH,
  angle: angleOf(doc),
})

/** Locked ratio (w/h) for the current settings, or null when free. */
export function aspectOf(doc: Doc, imageW: number, imageH: number): number | null {
  if (doc.shape === 'circle') return 1
  switch (doc.ratioId) {
    case 'free':
      return null
    case 'original':
      return doc.rot90 % 2 ? imageH / imageW : imageW / imageH
    case 'custom':
      return doc.custom.w / doc.custom.h
    default: {
      const p = RATIO_PRESETS.find((r) => r.id === doc.ratioId)!
      return doc.portrait ? p.h / p.w : p.w / p.h
    }
  }
}

export function initialDoc(imageW: number, imageH: number): Doc {
  return {
    crop: maxRectWithAspect(imageW / imageH, { w: imageW, h: imageH, angle: 0 }),
    rot90: 0,
    straighten: 0,
    flipX: false,
    flipY: false,
    shape: 'rect',
    ratioId: 'free',
    portrait: imageH > imageW,
    custom: { w: 2, h: 1 },
    roundness: DEFAULT_ROUNDNESS,
    background: null,
    borderWidth: 0,
    borderColor: '#ffffff',
  }
}

export function initialState(imageW: number, imageH: number): EditorState {
  return { imageW, imageH, doc: initialDoc(imageW, imageH), past: [], future: [], pending: null, straightenBase: null }
}

const sameDoc = (a: Doc, b: Doc) => a === b || JSON.stringify(a) === JSON.stringify(b)

/** Re-fits the crop to the settings' ratio, keeping the framing. */
function applyAspect(s: EditorState, doc: Doc): Doc {
  const aspect = aspectOf(doc, s.imageW, s.imageH)
  if (aspect === null) return doc
  const current = doc.crop.w / doc.crop.h
  if (Math.abs(current - aspect) < 1e-9) return doc
  return { ...doc, crop: reshapeRect(doc.crop, current, aspect, frameOf(s, doc)) }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Applies a change to the document. Returns [doc, continuous?]. */
function edit(s: EditorState, action: Action): [Doc, boolean] | null {
  const doc = s.doc
  switch (action.type) {
    case 'crop':
      return [{ ...doc, crop: action.crop }, true]

    case 'shape': {
      if (action.shape === doc.shape) return null
      let next: Doc = { ...doc, shape: action.shape }
      // "Rounded square": start square unless the user already chose a ratio.
      if (action.shape === 'rounded' && doc.ratioId === 'free') next = { ...next, ratioId: '1:1' }
      return [applyAspect(s, next), false]
    }

    case 'ratio':
      return [applyAspect(s, { ...doc, ratioId: action.id }), false]

    case 'customRatio': {
      if (!(action.w > 0 && action.h > 0)) return null
      return [applyAspect(s, { ...doc, ratioId: 'custom', custom: { w: action.w, h: action.h } }), false]
    }

    case 'swapRatio': {
      if (doc.ratioId === 'free') {
        const c = doc.crop
        return [{ ...doc, crop: placeRect(rectCenter(c), c.h, c.w, frameOf(s, doc)) }, false]
      }
      if (doc.ratioId === 'custom') {
        return [applyAspect(s, { ...doc, custom: { w: doc.custom.h, h: doc.custom.w } }), false]
      }
      return [applyAspect(s, { ...doc, portrait: !doc.portrait }), false]
    }

    case 'rotate': {
      // Image and crop turn together; the ratio's orientation follows.
      const next: Doc = {
        ...doc,
        rot90: (doc.rot90 + action.dir + 4) % 4,
        crop: rotateRect90(doc.crop, action.dir),
        portrait: !doc.portrait,
        custom: { w: doc.custom.h, h: doc.custom.w },
      }
      return [{ ...next, crop: fitRect(next.crop, frameOf(s, next)) }, false]
    }

    case 'flip': {
      // Mirroring on screen negates the rotation and toggles the image-space flip.
      const next: Doc = {
        ...doc,
        rot90: (4 - doc.rot90) % 4,
        straighten: doc.straighten === 0 ? 0 : -doc.straighten,
        flipX: action.axis === 'x' ? !doc.flipX : doc.flipX,
        flipY: action.axis === 'y' ? !doc.flipY : doc.flipY,
        crop: action.axis === 'x' ? flipRectX(doc.crop) : flipRectY(doc.crop),
      }
      return [{ ...next, crop: fitRect(next.crop, frameOf(s, next)) }, false]
    }

    case 'straighten': {
      const degrees = clamp(action.degrees, -MAX_STRAIGHTEN, MAX_STRAIGHTEN)
      const base = s.straightenBase ?? doc.crop
      const next: Doc = { ...doc, straighten: degrees }
      return [{ ...next, crop: fitRect(base, frameOf(s, next)) }, true]
    }

    case 'roundness':
      return [{ ...doc, roundness: clamp(action.value, 0, 100) }, true]

    case 'background':
      return [{ ...doc, background: action.color }, false]

    case 'borderWidth':
      return [{ ...doc, borderWidth: clamp(action.value, 0, MAX_BORDER) }, true]

    case 'borderColor':
      return [{ ...doc, borderColor: action.color }, false]

    case 'reset':
      return [initialDoc(s.imageW, s.imageH), false]

    default:
      return null
  }
}

export function editorReducer(s: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'begin':
      return s.pending ? s : { ...s, pending: s.doc }

    case 'commit': {
      if (!s.pending) return s
      if (sameDoc(s.pending, s.doc)) return { ...s, pending: null }
      return { ...s, past: [...s.past, s.pending].slice(-HISTORY_LIMIT), future: [], pending: null }
    }

    case 'undo': {
      const base = s.pending ?? s.doc
      if (!s.past.length) return s.pending ? { ...s, doc: base, pending: null } : s
      return {
        ...s,
        doc: s.past[s.past.length - 1],
        past: s.past.slice(0, -1),
        future: [base, ...s.future],
        pending: null,
        straightenBase: null,
      }
    }

    case 'redo': {
      if (!s.future.length || s.pending) return s
      return { ...s, doc: s.future[0], past: [...s.past, s.doc], future: s.future.slice(1), straightenBase: null }
    }
  }

  const result = edit(s, action)
  if (!result) return s
  const [doc, continuous] = result
  if (sameDoc(doc, s.doc)) return s

  const straightenBase = action.type === 'straighten' ? (s.straightenBase ?? s.doc.crop) : action.type === 'crop' || doc.crop !== s.doc.crop ? null : s.straightenBase

  if (continuous) {
    // Continuous edits start an interaction implicitly; `commit` closes it.
    return { ...s, doc, pending: s.pending ?? s.doc, straightenBase }
  }
  if (s.pending) return { ...s, doc, straightenBase }
  return { ...s, doc, past: [...s.past, s.doc].slice(-HISTORY_LIMIT), future: [], straightenBase }
}

export const canUndo = (s: EditorState) => s.past.length > 0 || (s.pending !== null && !sameDoc(s.pending, s.doc))
export const canRedo = (s: EditorState) => s.future.length > 0
