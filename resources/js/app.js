import './offline-sync.js'
import './number-formatter.js'
import './date-formatter.js'
import './timestamp-formatter.js'
import './accessibility.js'

function ensureGlobalFavicons() {
  try {
    const head = document.head
    if (!head) return
    const faviconVersion = '20260301b'

    const upsertLink = (selector, attrs) => {
      let link = head.querySelector(selector)
      if (!link) {
        link = document.createElement('link')
        head.appendChild(link)
      }

      Object.entries(attrs).forEach(([key, value]) => {
        link.setAttribute(key, value)
      })
    }

    upsertLink('link[rel="icon"][type="image/svg+xml"]', {
      rel: 'icon',
      type: 'image/svg+xml',
      href: `/favicon.svg?v=${faviconVersion}`,
    })

    upsertLink('link[rel="icon"][type="image/png"]', {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: `/favicon.png?v=${faviconVersion}`,
    })

    upsertLink('link[rel="icon"][type="image/x-icon"]', {
      rel: 'icon',
      type: 'image/x-icon',
      href: `/favicon.ico?v=${faviconVersion}`,
    })

    upsertLink('link[rel="apple-touch-icon"]', {
      rel: 'apple-touch-icon',
      href: `/apple-touch-icon.png?v=${faviconVersion}`,
    })

    upsertLink('link[rel="manifest"]', {
      rel: 'manifest',
      href: '/manifest.webmanifest',
    })
  } catch (error) {
    console.warn('Não foi possível garantir os favicons globais:', error)
  }
}

// Registrar timezone do navegador em cookie para uso no backend
function setTimezoneCookie() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!timezone) return

    const cookieKey = 'tz='
    const cookies = document.cookie.split(';').map((entry) => entry.trim())
    const existing = cookies.find((entry) => entry.startsWith(cookieKey))
    const currentValue = existing ? decodeURIComponent(existing.slice(cookieKey.length)) : null

    if (currentValue !== timezone) {
      const maxAge = 60 * 60 * 24 * 365
      document.cookie = `tz=${encodeURIComponent(timezone)}; path=/; max-age=${maxAge}; samesite=lax`
    }
  } catch (error) {
    // Melhor esforço: nao bloquear o carregamento do app
    console.warn('Não foi possível registrar o timezone do navegador:', error)
  }
}

function formatNowElements() {
  const now = new Date()
  document.querySelectorAll('[data-now]').forEach((el) => {
    const mode = el.getAttribute('data-now') || 'datetime'
    let text = ''

    if (mode === 'date') {
      text = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } else if (mode === 'date-long') {
      text = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    } else if (mode === 'time') {
      text = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      text = now.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    el.textContent = text
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ensureGlobalFavicons()
    setTimezoneCookie()
    formatNowElements()
  })
} else {
  ensureGlobalFavicons()
  setTimezoneCookie()
  formatNowElements()
}

// Suprimir erros de scripts externos bloqueados por adblockers
// (ex: Cloudflare Insights, analytics, etc)
window.addEventListener('error', function(event) {
  // Lista de scripts que podem ser bloqueados sem afetar funcionalidade
  const ignoredScripts = [
    'cloudflareinsights.com',
    'beacon.min.js',
    'analytics',
    'gtag',
    'googletagmanager'
  ]
  
  const shouldIgnore = ignoredScripts.some(script => 
    event.filename?.includes(script) || 
    event.target?.src?.includes(script)
  )
  
  if (shouldIgnore) {
    event.preventDefault()
    return true
  }
}, true)

// Suprimir avisos de recursos bloqueados no console
const originalConsoleError = console.error
console.error = function(...args) {
  const message = args[0]?.toString() || ''
  
  if (
    message.includes('ERR_BLOCKED_BY_') ||
    message.includes('cloudflareinsights') ||
    message.includes('beacon.min.js')
  ) {
    return // Silenciar esses erros
  }
  
  originalConsoleError.apply(console, args)
}
