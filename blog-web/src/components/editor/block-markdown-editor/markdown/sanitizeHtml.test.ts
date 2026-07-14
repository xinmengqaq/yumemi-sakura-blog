import { describe, expect, it } from 'vitest'

import { sanitizeEditorHtml } from './sanitizeHtml'

describe('Markdown HTML 清理', () => {
  it('受限 span 应保留颜色和背景高亮', () => {
    const clean = sanitizeEditorHtml(
      '<span style="color:#dc2626;background-color:#fef3c7;position:fixed">文字</span>',
    )

    expect(clean).toContain('color:#dc2626')
    expect(clean).toContain('background-color:#fef3c7')
    expect(clean).not.toContain('position')
  })

  it('下划线语义标签应保留且移除危险属性', () => {
    const clean = sanitizeEditorHtml('<u onclick="bad()">下划线</u>')

    expect(clean).toBe('<u>下划线</u>')
  })

  it('受限 table 应保留合并单元格列宽和对齐', () => {
    const clean = sanitizeEditorHtml(
      '<table><colgroup><col style="width:160px"></colgroup><tbody><tr><td rowspan="2" colspan="2" style="text-align:center">内容</td></tr></tbody></table>',
    )

    expect(clean).toContain('width:160px')
    expect(clean).toContain('rowspan="2"')
    expect(clean).toContain('colspan="2"')
    expect(clean).toContain('text-align:center')
  })

  it('危险 HTML 应被清理', () => {
    const clean = sanitizeEditorHtml(
      '<script>alert(1)</script><span onclick="alert(1)" style="color:red;background-image:url(x)">安全文字</span><iframe src="x"></iframe>',
    )

    expect(clean).toContain('安全文字')
    expect(clean).not.toMatch(
      /script|onclick|iframe|background-image|color:red/,
    )
  })
})
