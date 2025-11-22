/** @jsxImportSource @kitajs/html */

import { test, expect } from './multiPartMessage.dsl.js'

// Tests grouped by part type and prop behavior

test.describe('MultiPartMessage', () => {
  test.describe('text part', () => {
    test('renders provided text and no image', async ({ multiPart }) => {
      await multiPart.setText('Hello MultiPart')
      await expect(multiPart.img).toHaveCount(0)
      await expect(multiPart.body).toContainText('Hello MultiPart')
    })

    test('renders empty output for empty text (no image, no text)', async ({ multiPart }) => {
      await multiPart.setText('')
      await expect(multiPart.img).toHaveCount(0)
      // Body should have no text content aside from whitespace
      await expect(multiPart.body).toHaveText('')
    })
  })

  test.describe('image part', () => {
    test('renders <img> with correct src, data-fullsrc, alt, and classes', async ({ multiPart }) => {
      const contentType = 'image/png'
      const base64 = 'iVBORw0KGgoAAAANSUhEUg=='
      const dataUrl = `data:${contentType};base64,${base64}`

      await multiPart.setImage(contentType, base64)

      await expect(multiPart.img).toHaveCount(1)
      await expect(multiPart.img).toHaveAttribute('src', dataUrl)
      await expect(multiPart.img).toHaveAttribute('data-fullsrc', dataUrl)
      await expect(multiPart.img).toHaveAttribute('alt', 'Image')

      const classAttr = await multiPart.img.getAttribute('class')
      expect(classAttr).toBeTruthy()
      for (const token of ['chat-image-thumb', 'max-w-64', 'max-h-64', 'rounded', 'shadow', 'cursor-zoom-in']) {
        expect(classAttr).toContain(token)
      }
    })
  })

  test.describe('unknown/unsupported part type', () => {
    test('renders nothing', async ({ multiPart }) => {
      await multiPart.setPart({ type: 'unknown' })
      await expect(multiPart.img).toHaveCount(0)
      await expect(multiPart.body).toHaveText('')
    })
  })
})
