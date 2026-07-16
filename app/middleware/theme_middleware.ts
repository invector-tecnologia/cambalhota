import type { HttpContext } from '@adonisjs/core/http'

/**
 * ThemeMiddleware
 * - Reads `theme` from session and shares it with views
 * - Provides only Light and Dark themes for user selection
 * - Falls back to 'Light' if no theme is set
 * - Supports all themes internally for backward compatibility
 */
export default class ThemeMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const { session, view } = ctx

    // All valid themes (for backward compatibility with existing data)
    // const validThemes = [
    //   'Cyberpunk',
    //   'Dark',
    //   'Fast',
    //   'Italiano',
    //   'Light',
    //   'Marítimo',
    //   'Medieval',
    //   'Retrowave',
    //   'Retrô',
    // ]

    // Only themes available for user selection
    const displayThemes = ['Light', 'Dark']

    // Persisted theme in session (fallback to 'Light' as default theme)
    const currentTheme = session.get('theme') || 'Light'

    // Share with views (themes = only the ones to display)
    view.share({ theme: currentTheme, themes: displayThemes })

    await next()
  }
}
