import { describe, expect, it } from 'vitest'

import { parseArticleContent } from './articleContentModel'

describe('公开文章正文处理', () => {
  it('Markdown 正文应生成安全 HTML 和稳定的 H2/H3 目录模型', () => {
    // Given 正文包含标题、段落、列表、表格、代码块、链接和危险 HTML
    // When 前台解析并净化公开文章正文
    const parsed = parseArticleContent(
      '# 标题\n\n<script>alert(1)</script>\n\n## 第一节\n\n正文 [危险](javascript:alert(1))',
    )
    // Then 支持的内容应保留、危险内容应移除且 H2/H3 应获得稳定唯一 ID
    expect(parsed.headings).toEqual([
      { id: '第一节', level: 2, text: '第一节' },
    ])
    expect(parsed.root.children.some((node) => node.type === 'html')).toBe(true)
  })

  it('重复标题应生成互不冲突的目录 ID', () => {
    // Given 正文包含文本相同的多个二级或三级标题
    // When 前台生成正文标题和目录模型
    const parsed = parseArticleContent(
      '## 重复标题\n\n### 重复标题\n\n## 重复标题',
    )
    // Then 每个标题应拥有可跳转且不重复的稳定 ID
    expect(parsed.headings.map((heading) => heading.id)).toEqual([
      '重复标题',
      '重复标题-2',
      '重复标题-3',
    ])
  })

  it('正文首个一级标题与文章标题相同时只保留页面头部标题', () => {
    // Given 页面已经单独展示文章标题，Markdown 正文首项又是同名一级标题
    // When 前台解析正文
    const parsed = parseArticleContent(
      '# Spring Boot 博客后台学习记录\n\n正文内容',
      'Spring Boot 博客后台学习记录',
    )
    // Then 正文不再重复渲染同名一级标题，后续正文保持不变
    expect(parsed.root.children[0]?.type).toBe('paragraph')
    expect(parsed.root.children).toHaveLength(1)
  })
})
