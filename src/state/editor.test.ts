import { describe, expect, it } from 'vitest'
import { rectInImage } from '../lib/geometry'
import { aspectOf, canRedo, canUndo, editorReducer, frameOf, initialState, type Action, type EditorState } from './editor'

const run = (s: EditorState, ...actions: Action[]) => actions.reduce(editorReducer, s)
const landscape = () => initialState(400, 300)
const valid = (s: EditorState) => rectInImage(s.doc.crop, frameOf(s, s.doc))

describe('initial state', () => {
  it('starts with the whole image selected, free ratio, rectangle', () => {
    const s = landscape()
    expect(s.doc.crop).toEqual({ x: -200, y: -150, w: 400, h: 300 })
    expect(s.doc.shape).toBe('rect')
    expect(aspectOf(s.doc, 400, 300)).toBeNull()
    expect(s.doc.portrait).toBe(false)
    expect(initialState(300, 400).doc.portrait).toBe(true)
  })
})

describe('shapes and ratios', () => {
  it('circle makes the crop square, as big as possible', () => {
    const s = run(landscape(), { type: 'shape', shape: 'circle' })
    expect(s.doc.crop.w).toBeCloseTo(300)
    expect(s.doc.crop.h).toBeCloseTo(300)
    expect(aspectOf(s.doc, 400, 300)).toBe(1)
  })

  it('rounded starts as a square when no ratio was chosen', () => {
    const s = run(landscape(), { type: 'shape', shape: 'rounded' })
    expect(s.doc.ratioId).toBe('1:1')
    expect(s.doc.crop.w).toBeCloseTo(s.doc.crop.h)
  })

  it('going back from circle to rectangle keeps the free ratio', () => {
    const s = run(landscape(), { type: 'shape', shape: 'circle' }, { type: 'shape', shape: 'rect' })
    expect(s.doc.ratioId).toBe('free')
    expect(s.doc.crop.w).toBeCloseTo(300)
  })

  it('applies presets and swaps orientation', () => {
    let s = run(landscape(), { type: 'ratio', id: '16:9' })
    expect(s.doc.crop.w).toBeCloseTo(400)
    expect(s.doc.crop.w / s.doc.crop.h).toBeCloseTo(16 / 9)
    s = run(s, { type: 'swapRatio' })
    expect(s.doc.crop.w / s.doc.crop.h).toBeCloseTo(9 / 16)
    expect(s.doc.crop.h).toBeCloseTo(300)
    expect(valid(s)).toBe(true)
  })

  it('supports the original ratio and custom ratios', () => {
    let s = run(landscape(), { type: 'ratio', id: '1:1' }, { type: 'ratio', id: 'original' })
    expect(s.doc.crop.w / s.doc.crop.h).toBeCloseTo(4 / 3)
    s = run(s, { type: 'customRatio', w: 3.5, h: 4.5 })
    expect(s.doc.ratioId).toBe('custom')
    expect(s.doc.crop.w / s.doc.crop.h).toBeCloseTo(3.5 / 4.5)
    expect(run(s, { type: 'customRatio', w: 0, h: 4 })).toBe(s) // invalid input ignored
  })

  it('swapping a free crop turns it on its side', () => {
    const s = run(landscape(), { type: 'crop', crop: { x: -50, y: -25, w: 100, h: 50 } }, { type: 'commit' }, { type: 'swapRatio' })
    expect(s.doc.crop).toEqual({ x: -25, y: -50, w: 50, h: 100 })
  })
})

describe('rotate and flip', () => {
  it('rotating turns image and crop together', () => {
    const s = run(landscape(), { type: 'ratio', id: '16:9' }, { type: 'rotate', dir: 1 })
    expect(s.doc.rot90).toBe(1)
    expect(s.doc.crop.w / s.doc.crop.h).toBeCloseTo(9 / 16)
    expect(aspectOf(s.doc, 400, 300)).toBeCloseTo(9 / 16)
    expect(valid(s)).toBe(true)
  })

  it('four rotations bring everything back', () => {
    const start = run(landscape(), { type: 'crop', crop: { x: 20, y: -100, w: 150, h: 90 } }, { type: 'commit' })
    const s = run(start, ...Array(4).fill({ type: 'rotate', dir: 1 }))
    expect(s.doc.rot90).toBe(0)
    expect(s.doc.crop.x).toBeCloseTo(20)
    expect(s.doc.crop.y).toBeCloseTo(-100)
    expect(s.doc.crop.w).toBeCloseTo(150)
  })

  it('flipping mirrors the crop and negates rotations', () => {
    const start = run(landscape(), { type: 'rotate', dir: 1 }, { type: 'straighten', degrees: 5 }, { type: 'commit' })
    const s = run(start, { type: 'flip', axis: 'x' })
    expect(s.doc.flipX).toBe(true)
    expect(s.doc.rot90).toBe(3)
    expect(s.doc.straighten).toBe(-5)
    expect(s.doc.crop.x).toBeCloseTo(-start.doc.crop.x - start.doc.crop.w)
    expect(valid(s)).toBe(true)
    const back = run(s, { type: 'flip', axis: 'x' })
    expect(back.doc.rot90).toBe(1)
    expect(back.doc.straighten).toBe(5)
    expect(back.doc.flipX).toBe(false)
  })
})

describe('straighten', () => {
  it('shrinks the crop to stay inside and restores it at 0°', () => {
    let s = run(landscape(), { type: 'straighten', degrees: 10 })
    expect(valid(s)).toBe(true)
    expect(s.doc.crop.w).toBeLessThan(400)
    s = run(s, { type: 'straighten', degrees: -20 }, { type: 'straighten', degrees: 0 }, { type: 'commit' })
    expect(s.doc.crop).toEqual({ x: -200, y: -150, w: 400, h: 300 })
  })

  it('clamps the angle', () => {
    expect(run(landscape(), { type: 'straighten', degrees: 90 }).doc.straighten).toBe(45)
  })
})

describe('undo / redo', () => {
  it('records one step per discrete action', () => {
    const s = run(landscape(), { type: 'shape', shape: 'circle' }, { type: 'rotate', dir: 1 })
    expect(s.past).toHaveLength(2)
    const u = run(s, { type: 'undo' })
    expect(u.doc.rot90).toBe(0)
    expect(u.doc.shape).toBe('circle')
    const uu = run(u, { type: 'undo' })
    expect(uu.doc.shape).toBe('rect')
    expect(canUndo(uu)).toBe(false)
    const r = run(uu, { type: 'redo' }, { type: 'redo' })
    expect(r.doc.rot90).toBe(1)
    expect(canRedo(r)).toBe(false)
  })

  it('records a whole drag as a single step', () => {
    const s = run(
      landscape(),
      { type: 'begin' },
      { type: 'crop', crop: { x: -100, y: -100, w: 100, h: 100 } },
      { type: 'crop', crop: { x: -90, y: -100, w: 100, h: 100 } },
      { type: 'crop', crop: { x: -80, y: -100, w: 100, h: 100 } },
      { type: 'commit' },
    )
    expect(s.past).toHaveLength(1)
    expect(run(s, { type: 'undo' }).doc.crop).toEqual({ x: -200, y: -150, w: 400, h: 300 })
  })

  it('a slider interaction is a single step too', () => {
    const s = run(landscape(), { type: 'straighten', degrees: 1 }, { type: 'straighten', degrees: 2 }, { type: 'straighten', degrees: 3 }, { type: 'commit' })
    expect(s.past).toHaveLength(1)
    expect(run(s, { type: 'undo' }).doc.straighten).toBe(0)
  })

  it('does not record interactions that changed nothing', () => {
    const s = run(landscape(), { type: 'begin' }, { type: 'commit' }, { type: 'shape', shape: 'rect' })
    expect(s.past).toHaveLength(0)
  })

  it('a new change clears the redo stack', () => {
    const s = run(landscape(), { type: 'rotate', dir: 1 }, { type: 'undo' }, { type: 'flip', axis: 'y' })
    expect(canRedo(s)).toBe(false)
  })

  it('reset is undoable', () => {
    const s = run(landscape(), { type: 'shape', shape: 'circle' }, { type: 'rotate', dir: -1 }, { type: 'reset' })
    expect(s.doc.shape).toBe('rect')
    expect(run(s, { type: 'undo' }).doc.rot90).toBe(3)
  })

  it('keeps at most 100 steps', () => {
    const actions: Action[] = Array.from({ length: 150 }, (_, i) => ({ type: 'rotate', dir: i % 2 ? 1 : -1 }) as Action)
    expect(run(landscape(), ...actions).past).toHaveLength(100)
  })
})
