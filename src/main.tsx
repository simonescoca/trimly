import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/global.css'
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

const Gallery = import.meta.env.DEV ? lazy(() => import('./dev/Gallery')) : null
const showGallery = Gallery && new URLSearchParams(location.search).has('gallery')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showGallery && Gallery ? (
      <Suspense>
        <Gallery />
      </Suspense>
    ) : (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    )}
  </StrictMode>,
)
