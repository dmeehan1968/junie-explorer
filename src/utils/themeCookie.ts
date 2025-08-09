// Utility to parse theme from cookie and produce SSR attribute
// Theme values: 'auto' | any DaisyUI theme name like 'light' | 'dark' | etc.
// We cannot evaluate 'auto' server-side; we only return a concrete theme when cookie stores a non-'auto' theme.

export type ThemeValue = string; // keep generic for DaisyUI theme names

export function parseThemeFromCookie(cookieHeader: string | undefined): ThemeValue | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(';').map(p => p.trim());
  const entry = parts.find(p => p.startsWith('junie-explorer-theme='));
  if (!entry) return undefined;
  const value = decodeURIComponent(entry.split('=')[1] || '').trim();
  if (!value) return undefined;
  return value;
}

// Returns something like: data-theme="light" or empty string when we cannot determine it server-side
export function themeAttributeForHtml(cookieHeader: string | undefined): string {
  const theme = parseThemeFromCookie(cookieHeader);
  if (!theme || theme === 'auto') return '';
  // Sanitize: only allow simple token
  const safe = theme.replace(/[^a-z0-9_-]/gi, '');
  if (!safe) return '';
  return `data-theme="${safe}"`;
}
