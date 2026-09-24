// Security and caching headers, shared by the production host (_headers file, written at build
// time) and `vite preview` (so the end-to-end tests run under the same rules as the live site).

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' lets the HEIC decoder (WebAssembly) run; no JavaScript eval is allowed.
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-Frame-Options': 'DENY',
}

/** Netlify / Cloudflare Pages `_headers` file. */
export function headersFile(): string {
  const block = (path: string, headers: Record<string, string>) =>
    [path, ...Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`)].join('\n')
  return [
    block('/*', SECURITY_HEADERS),
    // Hashed file names never change content: cache them for a year.
    block('/assets/*', { 'Cache-Control': 'public, max-age=31536000, immutable' }),
    // These must always be fresh so updates reach people.
    block('/', { 'Cache-Control': 'no-cache' }),
    block('/index.html', { 'Cache-Control': 'no-cache' }),
    block('/sw.js', { 'Cache-Control': 'no-cache' }),
    block('/registerSW.js', { 'Cache-Control': 'no-cache' }),
    block('/manifest.webmanifest', { 'Cache-Control': 'no-cache' }),
    '',
  ].join('\n\n')
}
