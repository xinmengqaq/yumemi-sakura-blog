import DOMPurify from 'dompurify'

import {
  allowedBackgroundColors,
  allowedHtmlTags,
  allowedTextColors,
} from './markdownSchema'

const textColors = new Set<string>(allowedTextColors)
const backgroundColors = new Set<string>(allowedBackgroundColors)
const safeAlignments = new Set(['left', 'center', 'right'])
const safeWidth = /^(?:[1-9]\d{0,3}px|(?:100|[1-9]?\d)%)$/

const sanitizeStyle = (style: string) =>
  style
    .split(';')
    .map((declaration) =>
      declaration.split(':', 2).map((value) => value.trim()),
    )
    .filter(([name, value]) => {
      const property = name.toLowerCase()
      const normalized = value?.toLowerCase()
      if (!normalized) {
        return false
      }
      if (property === 'color') {
        return textColors.has(normalized)
      }
      if (property === 'background-color') {
        return backgroundColors.has(normalized)
      }
      if (property === 'text-align') {
        return safeAlignments.has(normalized)
      }
      return property === 'width' && safeWidth.test(normalized)
    })
    .map(([name, value]) => `${name.toLowerCase()}:${value.toLowerCase()}`)
    .join(';')

export const sanitizeEditorHtml = (html: string) => {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...allowedHtmlTags],
    ALLOWED_ATTR: ['style', 'rowspan', 'colspan'],
    FORBID_TAGS: [
      'script',
      'style',
      'iframe',
      'object',
      'embed',
      'video',
      'audio',
    ],
  })
  const document = new DOMParser().parseFromString(clean, 'text/html')

  document.body.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
    const style = sanitizeStyle(element.getAttribute('style') ?? '')
    if (style) {
      element.setAttribute('style', style)
    } else {
      element.removeAttribute('style')
    }
  })

  document.body
    .querySelectorAll<HTMLElement>('[rowspan], [colspan]')
    .forEach((element) => {
      for (const attribute of ['rowspan', 'colspan']) {
        const value = Number(element.getAttribute(attribute))
        if (!Number.isInteger(value) || value < 1 || value > 100) {
          element.removeAttribute(attribute)
        }
      }
    })

  return document.body.innerHTML
}
