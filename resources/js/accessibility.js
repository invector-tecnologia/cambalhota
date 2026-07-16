function ensureMainContentId() {
  const main = document.querySelector('main')
  if (!main) return null

  if (!main.id) {
    main.id = 'main-content'
  }

  return main
}

function injectSkipLink() {
  const main = ensureMainContentId()
  if (!main) return

  if (document.getElementById('skip-to-main')) return

  const skipLink = document.createElement('a')
  skipLink.id = 'skip-to-main'
  skipLink.href = `#${main.id}`
  skipLink.className = 'app-skip-link'
  skipLink.textContent = 'Pular para o conteúdo principal'

  document.body.prepend(skipLink)
}

function ensureLiveRegions() {
  if (!document.getElementById('app-live-polite')) {
    const polite = document.createElement('div')
    polite.id = 'app-live-polite'
    polite.className = 'app-live-region'
    polite.setAttribute('aria-live', 'polite')
    polite.setAttribute('aria-atomic', 'true')
    document.body.appendChild(polite)
  }

  if (!document.getElementById('app-live-assertive')) {
    const assertive = document.createElement('div')
    assertive.id = 'app-live-assertive'
    assertive.className = 'app-live-region'
    assertive.setAttribute('aria-live', 'assertive')
    assertive.setAttribute('aria-atomic', 'true')
    document.body.appendChild(assertive)
  }
}

function normalizeAlerts() {
  const selectors = [
    '.bg-green-50',
    '.bg-red-50',
    '.bg-yellow-50',
    '.bg-blue-50'
  ]

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (node.closest('table')) return

      if (node.classList.contains('bg-red-50') || node.classList.contains('bg-yellow-50')) {
        node.setAttribute('role', 'alert')
      } else {
        node.setAttribute('role', 'status')
      }

      if (!node.hasAttribute('tabindex')) {
        node.setAttribute('tabindex', '-1')
      }
    })
  })
}

function improveTables() {
  document.querySelectorAll('table').forEach((table) => {
    const headers = table.querySelectorAll('th')
    headers.forEach((th) => {
      if (!th.hasAttribute('scope')) {
        th.setAttribute('scope', 'col')
      }
    })
  })
}

function improveInputs() {
  document.querySelectorAll('input, select, textarea').forEach((field) => {
    const id = field.getAttribute('id')

    if (id && document.querySelector(`label[for="${id}"]`)) {
      return
    }

    if (field.getAttribute('aria-label') || field.getAttribute('aria-labelledby')) {
      return
    }

    const placeholder = field.getAttribute('placeholder')
    const name = field.getAttribute('name')
    const fallbackLabel = placeholder || name

    if (fallbackLabel) {
      field.setAttribute('aria-label', fallbackLabel)
    }
  })
}

function normalizeImagesAlt() {
  document.querySelectorAll('img').forEach((image) => {
    if (!image.hasAttribute('alt')) {
      image.setAttribute('alt', '')
    }
  })
}

function runAccessibilityPass() {
  injectSkipLink()
  ensureLiveRegions()
  normalizeAlerts()
  improveTables()
  improveInputs()
  normalizeImagesAlt()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAccessibilityPass)
} else {
  runAccessibilityPass()
}
