# 前台首页与文章阅读 Design QA

## 比较基准

- 视觉真值：`docs/前端设计目录/首页设计/前台首页原型.png`、`文章列表原型.png`、`文章详情原型.png`
- 实现证据：
  - `output/playwright/front-home-featured-desktop-track-final.png`
  - `output/playwright/front-home-featured-mobile-track-final.png`
  - `output/playwright/front-header-aligned-final.png`
  - `output/playwright/front-articles-desktop-final.png`
  - `output/playwright/front-articles-mobile-final.png`
  - `output/playwright/front-detail-desktop-final-v2.png`
  - `output/playwright/front-detail-mobile-final.png`
  - `output/playwright/front-detail-mobile-settings-final.png`
  - `output/playwright/front-articles-shared-banner-final.png`
  - `output/playwright/front-detail-shared-wave-final.png`
  - `output/playwright/front-home-unframed-time-sign-final.png`
  - `output/playwright/front-home-unframed-time-sign-mobile-final.png`
- 视口：桌面 `1440x900`，移动端 `390x844`
- 状态：首页精选使用浏览器临时响应验证 4 条推荐与真实最新文章并存；其他页面连接真实后端。临时响应已移除。

## 全景比较

- 首页保留车站首屏、动态波浪、时间牌、站牌、主精选、轨道次精选和最近文章的原型层级。站牌按反馈与时间牌并排，次精选为等高文章卡片并保留轨道节点。
- 列表页保留轻量横幅、筛选轴线、左右交错文章与灰色固定比例封面；移动端收为单列。
- 详情页保留顶部横幅、正文与目录双栏、阅读进度、桌面阅读设置和移动阅读工具。右栏实测 `280px`，移动端仅保留目录、设置、返回顶部三个按钮。

## 聚焦比较

- 导航与首屏：桌面导航保持单行，移动端汉堡菜单可展开并在分类跳转后收起；时间与站牌均直接融入头图，不使用卡片、边框或阴影。
- 宽屏导航：Logo 位于左侧安全边距，主菜单左边缘与首屏正文容器左边缘实测同为 `352.5px`；较窄桌面自动回到居中布局。
- 精选区：桌面 3 张次精选卡片封面统一为 `112x83`，移动端保留前 2 张，封面统一为 `96x72`，卡片外高约 `92.5px`。
- 详情头部：文章封面只作为顶部横幅；正文不重复封面，也不重复渲染与文章标题同名的首个 Markdown `H1`。
- 不另做裁切图：现有全页原图分辨率足以读取导航、卡片、元数据、目录和移动工具细节。

## 必查表面

- 字体与排版：展示标题使用 Georgia/宋体回退，正文与操作使用清晰无衬线字体；桌面和移动端无文字溢出。
- 间距与布局：三页容器轴线稳定，无横向溢出；精选、最新和详情双栏比例符合原型及用户修订。
- 颜色与令牌：前台统一使用暖白到浅樱粉背景，粉色作为单一强调色；动画开关和菜单使用暖白樱粉纸张语言，在浅色背景上仍有清晰边界。
- 图片与资产：按用户明确要求全部使用灰色占位；占位保持稳定比例，不属于未完成资产。
- 文案与内容：可见文案来自既定前台规格和真实接口；推荐只由 `featuredArticles/isRecommend` 驱动，未用最新文章冒充。

## Findings

无可执行的 P0/P1/P2 问题。

可接受差异：原型中的实景图片由灰色占位替代，这是用户明确约束；详情正文封面移至顶部横幅、背景改为浅粉渐变、精选次卡保留轨道但取消目录式编号，均来自本轮明确反馈。

## 本轮补丁

- 修复桌面导航汉堡、动态双层波浪与动画开关对比度。
- 提取 `FrontSceneBanner`，首页与列表共享车站媒体层，详情使用文章封面或灰色占位；三页共享动态双层波浪。
- 桌面头部改为全宽轴线，并将宽屏主导航与首屏文案左边缘对齐。
- 放大详情右栏，精简移动阅读工具。
- 桌面详情右栏补齐字号、行高、正文宽度和返回顶部，复用移动端同一偏好状态。
- 文章封面移至详情顶部，去除正文重复封面和同名一级标题。
- 前台三页统一浅粉纸张渐变。
- 时间与站牌去除卡片、背景、边框和阴影，桌面并排、移动纵排；精选次卡等高化并恢复轨道节点。
- 验证移动导航、筛选 URL、目录抽屉、减少动态效果和真实接口。

## Implementation Checklist

- [x] 桌面与移动端无横向溢出
- [x] 真实接口恢复且浏览器控制台 0 error / 0 warning
- [x] 正常与减少动态效果均验证
- [x] 类型、Lint、181 项测试与生产构建通过

final result: passed
