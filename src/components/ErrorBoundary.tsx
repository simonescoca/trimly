import { Component, type ReactNode } from 'react'

type State = { error: Error | null }

/**
 * Last-resort fallback. It sits outside the i18n provider (which may be what failed),
 * so it picks the language from the page itself.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Trimly crashed', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    const it = document.documentElement.lang === 'it' || navigator.language.startsWith('it')
    return (
      <div role="alert" style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 24, textAlign: 'center' }}>
        <div style={{ display: 'grid', gap: 12, maxWidth: 380 }}>
          <strong style={{ fontSize: 18 }}>{it ? 'Ops, qualcosa si è inceppato.' : 'Oops, something went wrong.'}</strong>
          <span style={{ color: 'var(--text-2)' }}>
            {it ? 'Ricarica la pagina per ripartire. Le tue immagini non sono mai uscite dal dispositivo.' : 'Reload the page to start again. Your images never left your device.'}
          </span>
          <button
            type="button"
            onClick={() => location.reload()}
            style={{ justifySelf: 'center', height: 40, padding: '0 18px', borderRadius: 12, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', fontWeight: 600 }}
          >
            {it ? 'Ricarica' : 'Reload'}
          </button>
        </div>
      </div>
    )
  }
}
