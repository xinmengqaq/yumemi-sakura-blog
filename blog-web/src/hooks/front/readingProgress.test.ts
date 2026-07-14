import { describe, expect, it } from 'vitest'

import { calculateReadingProgress } from './readingProgress'

describe('阅读进度计算', () => {
  it('正文滚动进度应限制在零到百分之百之间', () => {
    // Given 正文顶部、底部和视口高度形成可滚动阅读区
    // When 访客位于文章之前、阅读中或文章之后
    // Then 进度应分别为 0、中间比例或 100 且不会越界
    expect(calculateReadingProgress(100, 1100, 600, 0)).toBe(0)
    expect(calculateReadingProgress(100, 1100, 600, 350)).toBe(50)
    expect(calculateReadingProgress(100, 1100, 600, 2000)).toBe(100)
  })

  it('过短正文应在到达正文后稳定完成', () => {
    // Given 正文高度小于或等于可用视口高度
    // When 访客到达正文区域
    // Then 阅读进度应稳定为完成状态且不产生除零或无效数值
    expect(calculateReadingProgress(100, 500, 600, 100)).toBe(100)
  })
})
