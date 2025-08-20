import { Component, Html } from "@kitajs/html"

export const HtmlPage: Component<{ cookies: Record<string, any> }> = async ({ cookies, children }) => {
  const theme = cookies['junie-explorer-theme'] || 'auto'
  return '<!DOCTYPE html>' + await (
    <html lang="en" data-theme={theme}>
    {children}
    </html>
  )
}