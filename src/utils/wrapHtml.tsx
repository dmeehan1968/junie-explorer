export function wrapHtml(body: string) {
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Junie Explorer Test</title>\n</head>\n<body class="min-h-screen p-8">${body}</body>\n</html>`
}