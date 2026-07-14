# Admin Articles UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 `docs/UI设计目录/文章UI/2026-07-08-后台文章模块UI设计.md` 完成后台文章模块：文章列表、新建文章、编辑文章、删除文章和内嵌块状 Markdown 编辑器。

**Architecture:** 文章业务按 `types -> api -> queries -> views` 接入真实后端接口，页面只负责筛选、表单和跳转编排。文章列表卡片、状态标签、封面预览等留在文章模块内；`BlockMarkdownEditor` 放在 `src/components/editor/block-markdown-editor/`，只通过 `value/onChange/readOnly/placeholder/className/onSaveShortcut` 对外通信，不依赖后台路由、接口、登录态和文章状态。

**Tech Stack:** React + TypeScript + Vite + React Router + TanStack Query + Axios + Zustand + Vitest + Testing Library + lucide-react + unified/remark + DOMPurify + Floating UI React DOM。

## Global Constraints

- 目标 UI 规格：`D:/daimai/项目学习/blog-web/docs/UI设计目录/文章UI/2026-07-08-后台文章模块UI设计.md`。
- 文章模块页面只做桌面端后台工作台验收，真实浏览器宽度使用 `1440x900` 和 `1536x960`，不按原型图片自身像素尺寸机械复刻。
- UI 还原必须拆成页面 UI 和编辑器工具 UI 任务；一个任务不得同时完成多个页面和多个工具面板。
- 页面禁止直接调用 Axios；请求方法放 `src/api/article.ts`，查询和变更放 `src/queries/article.ts`，类型放 `src/types/article.ts`。
- 页面优先复用 `Button`、`Input`、`FormField`、`Alert`、`ConfirmDialog`、`LoadingState`、`ErrorState`、`EmptyState`、`PageHeader`、`DataSection`。
- 不引入完整富文本编辑器框架，不用 Tiptap、ProseMirror、Slate、Quill、Monaco 或 CodeMirror 替代本阶段的块状 Markdown 编辑体验。
- 不新增完整后台 UI 组件库；现有组件和原生 `select`、`textarea`、`input[type=radio]` 足够覆盖页面表单，浮层定位只引入小型定位库。
- 新增依赖只解决明确问题：Markdown 解析/序列化、GFM、HTML 清理和浮层定位。
- 不做分类、标签、置顶、推荐、批量删除、文件上传、正文图片上传、Markdown 源码视图、自动保存、移动端适配和前台文章展示页。
- 正式功能代码实现前必须按项目规则执行 BDD 门禁：先写 Given-When-Then 中文行为注释空测试，再向用户确认继续。
- 实施功能代码前先同步已有设计文档；只在目标设计文档中小范围追加实现确认，不新建新的设计规格文档。
- 文档说明使用中文；命令和脚本统一 UTF-8；命令输出必须按仓库规则做 byte cap。
- 前后端服务联调时使用两个普通可见 `cmd` 窗口，不使用脚本、`Start-Process`、Windows Terminal 调度封装或自写启动器。

---

## 已查资料

### UI 规格与原型

- 设计文档：`D:/daimai/项目学习/blog-web/docs/UI设计目录/文章UI/2026-07-08-后台文章模块UI设计.md`
- 文章列表原型：`D:/daimai/项目学习/blog-web/docs/UI设计目录/文章UI/imagegen/article-list-standard.png`，尺寸 `1365x1152`
- 编辑页原型：`D:/daimai/项目学习/blog-web/docs/UI设计目录/文章UI/imagegen/article-editor-standard.png`，尺寸 `1608x978`
- 列表状态集合：`D:/daimai/项目学习/blog-web/docs/UI设计目录/文章UI/imagegen/article-list-state-board.png`，尺寸 `1717x916`
- 块工具浮层：`D:/daimai/项目学习/blog-web/docs/UI设计目录/文章UI/imagegen/editor-block-tools.png`，尺寸 `1536x1024`
- 文字工具浮层：`D:/daimai/项目学习/blog-web/docs/UI设计目录/文章UI/imagegen/editor-text-tools.png`，尺寸 `1536x1024`
- 表格工具浮层：`D:/daimai/项目学习/blog-web/docs/UI设计目录/文章UI/imagegen/editor-table-tools.png`，尺寸 `1536x1024`
- 快捷键抽屉：`D:/daimai/项目学习/blog-web/docs/UI设计目录/文章UI/imagegen/editor-shortcut-drawer.png`，尺寸 `1586x992`

### 后端真实契约

读取的后端文件：

- `D:/daimai/项目学习/springboot/springboot-article/src/main/java/com/xinmengqaq/springboot/article/controller/ArticleController.java`
- `D:/daimai/项目学习/springboot/springboot-article/src/main/java/com/xinmengqaq/springboot/article/dto/ArticleDTO.java`
- `D:/daimai/项目学习/springboot/springboot-article/src/main/java/com/xinmengqaq/springboot/article/dto/ArticlePageQueryDTO.java`
- `D:/daimai/项目学习/springboot/springboot-article/src/main/java/com/xinmengqaq/springboot/article/vo/ArticleVO.java`
- `D:/daimai/项目学习/springboot/springboot-common/src/main/java/com/xinmengqaq/springboot/common/PageResult.java`

前端 `request.ts` 的 `baseURL` 已是 `/api`，所以 `src/api/article.ts` 中路径写 `/admin/articles`，不要写 `/api/admin/articles`。


| 能力         | 方法   | 前端请求路径           | 后端控制器路径             | 响应 data               |
| ------------ | ------ | ---------------------- | -------------------------- | ----------------------- |
| 分页查询文章 | GET    | `/admin/articles`      | `/api/admin/articles`      | `PageResult<ArticleVO>` |
| 查询文章详情 | GET    | `/admin/articles/{id}` | `/api/admin/articles/{id}` | `ArticleVO`             |
| 新增文章     | POST   | `/admin/articles`      | `/api/admin/articles`      | `{ id: number }`        |
| 修改文章     | PUT    | `/admin/articles/{id}` | `/api/admin/articles/{id}` | `ArticleVO`             |
| 删除文章     | DELETE | `/admin/articles/{id}` | `/api/admin/articles/{id}` | `void`                  |

后端 `PageResult` 字段为：

```ts
type PageResult<T> = {
  page: number
  size: number
  total: number
  pages: number
  list: T[]
}
```

契约风险：当前后端 `ArticleController.deleteById` 返回 `new Result()` 后只设置 `msg`，没有设置成功 `code`。前端统一响应拦截会把它识别为失败。本计划把它列为删除联调前置修复项，执行时应在后端改成 `return Result.success()` 或 `return Result.success(null)`，不要在前端放宽全局 `request` 成功判断。

### 外部库依据

- `remark-parse` 官方说明其作用是把 Markdown 输入解析为语法树，适合本编辑器的 Markdown 入站解析。[来源](https://unifiedjs.com/explore/package/remark-parse/)
- `remark-stringify` 官方说明其作用是把语法树序列化为 Markdown，适合保存前输出 Markdown 字符串。[来源](https://unifiedjs.com/explore/package/remark-stringify/)
- `remark-gfm` 官方说明支持 GFM 的删除线、表格、任务列表等扩展，匹配本阶段 CommonMark + GFM 范围。[来源](https://github.com/remarkjs/remark-gfm)
- DOMPurify 官方说明用于清理 HTML 并阻止 XSS，适合粘贴 HTML 和受限 HTML 白名单清理。[来源](https://github.com/cure53/DOMPurify)
- Floating UI React 文档说明 `@floating-ui/react-dom` 可只做定位，体积小于完整交互包，适合块工具、文字工具、表格工具浮层定位。[来源](https://floating-ui.com/docs/react)

## 文件结构

### 设计文档

- 修改：`docs/UI设计目录/文章UI/2026-07-08-后台文章模块UI设计.md`

### 依赖

- 修改：`package.json`
- 修改：`package-lock.json`

新增运行依赖：

```text
unified
remark-parse
remark-stringify
remark-gfm
dompurify
@floating-ui/react-dom
```

新增开发依赖：

```text
@types/mdast
```

### 类型、接口、查询

- 修改：`src/types/api.ts`
- 创建：`src/types/article.ts`
- 创建：`src/api/article.ts`
- 创建：`src/api/article.test.ts`
- 创建：`src/queries/article.ts`
- 创建：`src/queries/article.test.ts`

### 路由和后台导航

- 修改：`src/router/routes.tsx`
- 修改：`src/router/guards.test.tsx`
- 修改：`src/components/admin/AdminSidebar.tsx`

### 文章页面

- 创建：`src/views/admin/articles/ArticleListView.tsx`
- 创建：`src/views/admin/articles/ArticleEditorView.tsx`
- 创建：`src/views/admin/articles/ArticleListFilters.tsx`
- 创建：`src/views/admin/articles/ArticleListItem.tsx`
- 创建：`src/views/admin/articles/ArticleListPagination.tsx`
- 创建：`src/views/admin/articles/ArticleCover.tsx`
- 创建：`src/views/admin/articles/ArticleStatusBadge.tsx`
- 创建：`src/views/admin/articles/ArticleSaveStatus.tsx`
- 创建：`src/views/admin/articles/articlePages.css`
- 创建：`src/views/admin/articles/ArticleListView.test.tsx`
- 创建：`src/views/admin/articles/ArticleEditorView.test.tsx`

### 编辑器组件

- 创建：`src/components/editor/block-markdown-editor/index.ts`
- 创建：`src/components/editor/block-markdown-editor/BlockMarkdownEditor.tsx`
- 创建：`src/components/editor/block-markdown-editor/blockMarkdownEditor.css`
- 创建：`src/components/editor/block-markdown-editor/types.ts`
- 创建：`src/components/editor/block-markdown-editor/core/blockModel.ts`
- 创建：`src/components/editor/block-markdown-editor/core/commands.ts`
- 创建：`src/components/editor/block-markdown-editor/core/history.ts`
- 创建：`src/components/editor/block-markdown-editor/markdown/parseMarkdown.ts`
- 创建：`src/components/editor/block-markdown-editor/markdown/serializeMarkdown.ts`
- 创建：`src/components/editor/block-markdown-editor/markdown/sanitizeHtml.ts`
- 创建：`src/components/editor/block-markdown-editor/markdown/markdownSchema.ts`
- 创建：`src/components/editor/block-markdown-editor/blocks/ParagraphBlock.tsx`
- 创建：`src/components/editor/block-markdown-editor/blocks/HeadingBlock.tsx`
- 创建：`src/components/editor/block-markdown-editor/blocks/ListBlock.tsx`
- 创建：`src/components/editor/block-markdown-editor/blocks/QuoteBlock.tsx`
- 创建：`src/components/editor/block-markdown-editor/blocks/CodeBlock.tsx`
- 创建：`src/components/editor/block-markdown-editor/blocks/ImageBlock.tsx`
- 创建：`src/components/editor/block-markdown-editor/blocks/TableBlock.tsx`
- 创建：`src/components/editor/block-markdown-editor/blocks/DividerBlock.tsx`
- 创建：`src/components/editor/block-markdown-editor/toolbars/BlockToolbar.tsx`
- 创建：`src/components/editor/block-markdown-editor/toolbars/BlockInsertMenu.tsx`
- 创建：`src/components/editor/block-markdown-editor/toolbars/TextToolbar.tsx`
- 创建：`src/components/editor/block-markdown-editor/toolbars/TableToolbar.tsx`
- 创建：`src/components/editor/block-markdown-editor/toolbars/ShortcutDrawer.tsx`
- 创建：`src/components/editor/block-markdown-editor/utils/clipboard.ts`
- 创建：`src/components/editor/block-markdown-editor/utils/keyboard.ts`
- 创建：`src/components/editor/block-markdown-editor/utils/dom.ts`
- 创建：`src/components/editor/block-markdown-editor/core/blockModel.test.ts`
- 创建：`src/components/editor/block-markdown-editor/markdown/parseMarkdown.test.ts`
- 创建：`src/components/editor/block-markdown-editor/markdown/serializeMarkdown.test.ts`
- 创建：`src/components/editor/block-markdown-editor/markdown/sanitizeHtml.test.ts`
- 创建：`src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx`

### 后端契约前置修复

- 修改：`D:/daimai/项目学习/springboot/springboot-article/src/main/java/com/xinmengqaq/springboot/article/controller/ArticleController.java`

## 核心接口

### `src/types/article.ts`

```ts
export type ArticleStatus = 'draft' | 'published' | 'hidden'

export type ArticleVO = {
  id: number
  categoryId?: number | null
  title: string
  summary?: string | null
  content?: string | null
  coverUrl?: string | null
  status: ArticleStatus
  isTop?: boolean | null
  isRecommend?: boolean | null
  viewCount: number
  commentCount: number
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type ArticlePageQueryParams = {
  page: number
  size: number
  keyword?: string
  status?: ArticleStatus
}

export type ArticleSaveParams = {
  title: string
  summary?: string
  content: string
  coverUrl?: string
  status: ArticleStatus
}

export type CreateArticleResult = {
  id: number
}
```

### `BlockMarkdownEditor` 对外接口

```ts
export type BlockMarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  className?: string
  onSaveShortcut?: () => void
}
```

## Task 1: 同步文章 UI 设计文档实现确认

**Files:**

- Modify: `docs/UI设计目录/文章UI/2026-07-08-后台文章模块UI设计.md`

**Interfaces:**

- Consumes: 现有 UI 设计文档中的 `## 实施边界` 和 `## 外部库策略`。
- Produces: 实施阶段必须遵守的依赖、拆分和浏览器验收确认。

- [ ]  **Step 1: 对齐插入位置**

Run:

```powershell
Select-String -LiteralPath 'D:\daimai\项目学习\blog-web\docs\UI设计目录\文章UI\2026-07-08-后台文章模块UI设计.md' -Pattern '## 外部库策略|## 实施边界'
```

Expected: 输出两个标题附近行号，用于小范围追加，不整段替换。

- [ ]  **Step 2: 追加实现确认**

在 `## 实施边界` 前追加：

```markdown
## 第一版实施拆分确认

文章模块第一版实现按以下工程边界落地：

- 页面 UI 拆成文章列表页、新建文章页和编辑文章页；筛选区、横向文章卡片、分页、删除弹窗、右侧文章信息栏分别作为独立任务验收。
- 编辑器工具 UI 拆成块工具浮层、文字工具浮层、表格工具浮层和快捷键抽屉；工具 UI 属于 `BlockMarkdownEditor` 内部，不依赖后台文章页面样式类名。
- 原型还原以真实桌面浏览器工作区为准，验收宽度使用 `1440x900` 和 `1536x960`；参考图片只作为视觉关系依据，不按图片像素尺寸机械复刻。
- 文章页面优先复用现有 `Button`、`Input`、`FormField`、`Alert`、`ConfirmDialog`、`LoadingState`、`ErrorState`、`EmptyState`、`PageHeader`、`DataSection`。
- 外部依赖只引入 `unified`、`remark-parse`、`remark-stringify`、`remark-gfm`、`dompurify`、`@floating-ui/react-dom` 和类型依赖 `@types/mdast`。
- 不引入完整富文本编辑器框架，不引入完整后台 UI 组件库，不为分类、标签、置顶、推荐、上传、自动保存和移动端提前铺代码。
- 后端删除接口必须返回统一成功 `code`；前端不为单个删除接口放宽全局 `request` 成功判断。
```

- [ ]  **Step 3: 检查文档编码和新增段落**

Run:

```powershell
Get-Content -LiteralPath 'D:\daimai\项目学习\blog-web\docs\UI设计目录\文章UI\2026-07-08-后台文章模块UI设计.md' -Encoding UTF8 | Select-String -Pattern '第一版实施拆分确认'
```

Expected: 能找到新增标题，无乱码。

- [ ]  **Step 4: Commit**

```bash
git add docs/UI设计目录/文章UI/2026-07-08-后台文章模块UI设计.md
git commit -m "docs: confirm admin article implementation split"
```

## Task 2: BDD 门禁空测试

**Files:**

- Create: `src/api/article.test.ts`
- Create: `src/queries/article.test.ts`
- Create: `src/views/admin/articles/ArticleListView.test.tsx`
- Create: `src/views/admin/articles/ArticleEditorView.test.tsx`
- Create: `src/components/editor/block-markdown-editor/core/blockModel.test.ts`
- Create: `src/components/editor/block-markdown-editor/markdown/parseMarkdown.test.ts`
- Create: `src/components/editor/block-markdown-editor/markdown/serializeMarkdown.test.ts`
- Create: `src/components/editor/block-markdown-editor/markdown/sanitizeHtml.test.ts`
- Create: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx`

**Interfaces:**

- Consumes: 设计文档测试范围。
- Produces: 只含 Given-When-Then 中文行为注释和测试函数名的空测试文件。

- [ ]  **Step 1: 创建 API 行为空测试**

`src/api/article.test.ts`：

```ts
import { describe, it } from 'vitest'

describe('文章 API', () => {
  it('分页查询文章时应使用 GET /admin/articles 并传递页码每页数量关键词和状态', () => {
    // Given 管理员位于文章列表页，并设置页码、每页数量、关键词和文章状态
    // When 页面请求文章分页数据
    // Then 前端应调用 GET /admin/articles，并只传递后端支持的查询参数
  })

  it('查询文章详情时应使用 GET /admin/articles/:id', () => {
    // Given 管理员进入已有文章编辑页
    // When 页面读取指定文章详情
    // Then 前端应调用 GET /admin/articles/:id，并返回文章标题、摘要、正文、封面和状态
  })

  it('新增文章时应使用 POST /admin/articles 并返回新文章 ID', () => {
    // Given 管理员在新建文章页填写标题、正文、摘要、封面和状态
    // When 管理员点击保存文章
    // Then 前端应调用 POST /admin/articles，并从响应中读取新文章 ID
  })

  it('修改文章时应使用 PUT /admin/articles/:id 并返回修改后的文章', () => {
    // Given 管理员在编辑文章页修改文章内容
    // When 管理员点击保存文章
    // Then 前端应调用 PUT /admin/articles/:id，并用响应刷新当前文章详情
  })

  it('删除文章时应使用 DELETE /admin/articles/:id', () => {
    // Given 管理员确认删除某篇文章
    // When 前端提交删除请求
    // Then 前端应调用 DELETE /admin/articles/:id，并在成功后刷新列表或返回列表页
  })
})
```

- [ ]  **Step 2: 创建 Query 行为空测试**

`src/queries/article.test.ts` 覆盖：

```text
分页查询 key 应包含 page、size、keyword、status
新增成功后应失效文章列表缓存
修改成功后应失效文章列表和当前详情缓存
删除成功后应失效文章列表缓存
编辑页保存成功后应更新当前详情缓存
```

- [ ]  **Step 3: 创建文章列表页行为空测试**

`src/views/admin/articles/ArticleListView.test.tsx` 覆盖：

```text
首次进入文章列表页时显示加载状态
加载成功后显示横向文章卡片
列表为空时显示还没有文章并提供新建入口
筛选无结果时显示没有找到符合条件的文章并提供重置入口
关键词超过 50 字符时不发查询请求
点击查询时使用当前关键词和状态请求第一页
点击重置时清空关键词和状态并回到第一页
点击新建文章时进入 /admin/articles/new
点击编辑时进入 /admin/articles/:id/edit
点击删除时打开确认弹窗并显示文章标题
删除失败时显示后端 msg
```

- [ ]  **Step 4: 创建文章编辑页行为空测试**

`src/views/admin/articles/ArticleEditorView.test.tsx` 覆盖：

```text
新建页默认标题摘要封面为空且状态为草稿
编辑页进入后请求文章详情并填充右侧信息栏和正文编辑器
标题为空时不发保存请求
标题超过 120 字符时不发保存请求
摘要超过 300 字符时不发保存请求
封面 URL 超过 500 字符时不发保存请求
正文为空时不发保存请求
保存中禁用保存按钮并显示保存中
新建成功后进入 /admin/articles/:id/edit
修改成功后显示已保存并刷新详情缓存
保存失败时显示后端 msg
编辑页点击删除文章时打开确认弹窗
编辑页删除成功后返回 /admin/articles
Ctrl + S 触发保存文章
```

- [ ]  **Step 5: 创建编辑器行为空测试**

编辑器测试覆盖：

```text
Markdown 能解析为扁平块列表
块列表能序列化回 Markdown
段落标题引用列表任务列表代码块图片分割线表格能往返转换
受限 span 能保留颜色和背景高亮
受限 table 能保留合并单元格列宽和对齐
危险 HTML 会被清理
粘贴纯文本会拆成段落块
粘贴 Markdown 会转换为对应块
输入 / 打开块类型菜单
输入 Markdown 快捷语法能转换块
选中块显示块工具浮层
选中文字显示文字工具浮层
右键表格显示表格工具浮窗
快捷键抽屉默认隐藏且点击后显示
```

- [ ]  **Step 6: 向用户确认继续**

使用 AskUserQuestion：

```text
已按 BDD 门禁写好后台文章模块行为注释空测试。是否继续实现功能代码？
```

Expected: 用户确认后继续。未确认前不写正式功能代码。

- [ ]  **Step 7: Commit**

```bash
git add src/api/article.test.ts src/queries/article.test.ts src/views/admin/articles src/components/editor/block-markdown-editor
git commit -m "test: outline admin article behavior gate"
```

## Task 3: 后端删除响应契约修正

已完成，跳过task 3，直接task 4

## Task 4: 安装必要外部依赖

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**

- Consumes: 当前 React + Vite + TypeScript 工程。
- Produces: 编辑器解析、清理和浮层定位依赖。

- [x]  **Step 1: 安装运行依赖**

Run:

```powershell
npm install unified remark-parse remark-stringify remark-gfm dompurify @floating-ui/react-dom
```
Expected: `package.json` dependencies 增加上述包，`package-lock.json` 同步更新。

- [x]  **Step 2: 安装类型依赖**

Run:

```powershell
npm install -D @types/mdast
```
Expected: `package.json` devDependencies 增加 `@types/mdast`，`package-lock.json` 同步更新。

- [x]  **Step 3: 依赖类型检查**

Run:

```powershell
npm run typecheck
```
Expected: 0 errors。

- [x]  **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add editor parsing and floating dependencies"
```
## Task 5: 接入文章类型、API 和 Query

**Files:**

- Modify: `src/types/api.ts`
- Create: `src/types/article.ts`
- Create: `src/api/article.ts`
- Modify: `src/api/article.test.ts`
- Create: `src/queries/article.ts`
- Modify: `src/queries/article.test.ts`

**Interfaces:**

- Consumes: 后端 `ArticleDTO`、`ArticleVO`、`PageResult`。
- Produces: 页面可用的文章查询和变更 hooks。

- [x]  **Step 1: 更新分页类型**

`src/types/api.ts`：

```ts
export type ApiResult<T> = {
  code: string
  msg: string
  data: T
}

export type PageResult<T> = {
  page: number
  size: number
  total: number
  pages: number
  list: T[]
}

export type ApiError = {
  code: string
  message: string
  status?: number
}
```
- [x]  **Step 2: 新增文章类型**

按本计划“核心接口”中的 `src/types/article.ts` 创建类型。

- [x]  **Step 3: 新增文章 API**

`src/api/article.ts`：

```ts
import type { PageResult } from '@/types/api'
import type {
  ArticlePageQueryParams,
  ArticleSaveParams,
  ArticleVO,
  CreateArticleResult,
} from '@/types/article'
import { request } from '@/utils/request'

const normalizeArticlePageParams = (params: ArticlePageQueryParams) => ({
  page: params.page,
  size: params.size,
  ...(params.keyword?.trim() ? { keyword: params.keyword.trim() } : {}),
  ...(params.status ? { status: params.status } : {}),
})

export const getArticlePage = (params: ArticlePageQueryParams) =>
  request.get<PageResult<ArticleVO>>('/admin/articles', {
    params: normalizeArticlePageParams(params),
  })

export const getArticleDetail = (id: number) =>
  request.get<ArticleVO>(`/admin/articles/${id}`)

export const createArticle = (params: ArticleSaveParams) =>
  request.post<CreateArticleResult>('/admin/articles', params)

export const updateArticle = (id: number, params: ArticleSaveParams) =>
  request.put<ArticleVO>(`/admin/articles/${id}`, params)

export const deleteArticle = (id: number) =>
  request.delete<void>(`/admin/articles/${id}`)
```
- [x]  **Step 4: 新增文章 Query hooks**

`src/queries/article.ts` 提供：

```ts
export const articleQueryKeys = {
  all: ['articles'] as const,
  pages: () => [...articleQueryKeys.all, 'page'] as const,
  page: (params: ArticlePageQueryParams) =>
    [...articleQueryKeys.pages(), params] as const,
  detail: (id: number) => [...articleQueryKeys.all, 'detail', id] as const,
}

export const useArticlePageQuery = (params: ArticlePageQueryParams) => useQuery(...)
export const useArticleDetailQuery = (id: number | null) => useQuery(...)
export const useCreateArticleMutation = () => useMutation(...)
export const useUpdateArticleMutation = () => useMutation(...)
export const useDeleteArticleMutation = () => useMutation(...)
```
规则：

```text
列表 query key 必须包含 page、size、keyword、status
新增成功后 invalidate articleQueryKeys.pages()
修改成功后 invalidate articleQueryKeys.pages()，并 setQueryData articleQueryKeys.detail(id)
删除成功后 invalidate articleQueryKeys.pages()
```
- [x]  **Step 5: 实现 API 和 Query 测试**

Run:

```powershell
npm run test:run -- src/api/article.test.ts src/queries/article.test.ts
```
Expected: 测试通过。

- [x]  **Step 6: Commit**

```bash
git add src/types/api.ts src/types/article.ts src/api/article.ts src/api/article.test.ts src/queries/article.ts src/queries/article.test.ts
git commit -m "feat: add admin article data layer"
```
## Task 6: 增加文章路由和后台导航

**Files:**

- Modify: `src/router/routes.tsx`
- Modify: `src/router/guards.test.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`

**Interfaces:**

- Consumes: `ArticleListView`、`ArticleEditorView` 页面入口。
- Produces: `/admin/articles`、`/admin/articles/new`、`/admin/articles/:id/edit` 路由和侧边栏菜单。

- [x]  **Step 1: 在路由中加入文章页面**

`src/router/routes.tsx` 引入：

```ts
import { ArticleEditorView } from '@/views/admin/articles/ArticleEditorView'
import { ArticleListView } from '@/views/admin/articles/ArticleListView'
```
AdminLayout children 增加：

```tsx
{ path: '/admin/articles', element: <ArticleListView /> },
{ path: '/admin/articles/new', element: <ArticleEditorView mode="create" /> },
{ path: '/admin/articles/:id/edit', element: <ArticleEditorView mode="edit" /> },
```
- [x]  **Step 2: 增加侧边栏菜单**

`src/components/admin/AdminSidebar.tsx` 引入 `Newspaper`：

```ts
import { LayoutDashboard, Leaf, Newspaper, UserCog } from 'lucide-react'
```
菜单改为：

```ts
const adminNavItems = [
  { label: '后台首页', to: '/admin', icon: LayoutDashboard },
  { label: '管理员设置', to: '/admin/settings/admin', icon: UserCog },
  { label: '文章管理', to: '/admin/articles', icon: Newspaper },
]
```
- [x]  **Step 3: 扩充路由守卫测试**

`src/router/guards.test.tsx` 增加：

```ts
it('未登录访问文章管理页时应跳转后台登录页', () => {
  // Given 本地没有 Token
  // When 用户访问 /admin/articles
  // Then 路由守卫应跳转 /admin/login
})
```
- [x]  **Step 4: 运行路由测试**

Run:

```powershell
npm run test:run -- src/router/guards.test.tsx
```
Expected: 路由守卫测试通过。

- [x]  **Step 5: Commit**

```bash
git add src/router/routes.tsx src/router/guards.test.tsx src/components/admin/AdminSidebar.tsx
git commit -m "feat: add admin article routes"
```
## Task 7: 实现文章页面专属小组件和样式基座

**Files:**

- Create: `src/views/admin/articles/ArticleCover.tsx`
- Create: `src/views/admin/articles/ArticleStatusBadge.tsx`
- Create: `src/views/admin/articles/ArticleSaveStatus.tsx`
- Create: `src/views/admin/articles/articlePages.css`

**Interfaces:**

- Consumes: `ArticleStatus`、现有 CSS 变量、lucide-react 图标。
- Produces: 列表页和编辑页复用的文章封面、状态标签、保存状态样式。

- [ ]  **Step 1: 实现 `ArticleStatusBadge`**

状态映射：

```ts
const articleStatusLabels: Record<ArticleStatus, string> = {
  draft: '草稿',
  published: '已发布',
  hidden: '隐藏',
}
```
输出：

```tsx
<span className={`article-status-badge article-status-badge--${status}`}>
  {articleStatusLabels[status]}
</span>
```
- [ ]  **Step 2: 实现 `ArticleCover`**

规则：

```text
有 coverUrl 且图片加载成功：显示图片
coverUrl 为空：显示封面占位
图片加载失败：显示封面占位
占位可以使用 FileText 图标，因为这是封面缺失状态，不替代真实封面图片
```
- [ ]  **Step 3: 实现 `ArticleSaveStatus`**

保存状态类型：

```ts
export type ArticleSaveState =
  | 'clean'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'failed'
```
文案：

```ts
const saveStateLabels: Record<ArticleSaveState, string> = {
  clean: '保存状态：未修改',
  dirty: '保存状态：有未保存修改',
  saving: '保存状态：保存中',
  saved: '保存状态：已保存',
  failed: '保存状态：保存失败',
}
```
- [ ]  **Step 4: 建立文章页面样式基座**

`articlePages.css` 至少包含：

```css
.article-page {
  display: grid;
  gap: 22px;
  margin: 0 auto;
  max-width: 1260px;
}

.article-card {
  align-items: stretch;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: grid;
  gap: 24px;
  grid-template-columns: 240px minmax(0, 1fr) auto;
  min-height: 178px;
  padding: 24px;
}
```
要求：所有圆角不超过 `var(--radius-lg)`，卡片不套卡片，active/hover 不改变元素尺寸。

- [ ]  **Step 5: Commit**

```bash
git add src/views/admin/articles/ArticleCover.tsx src/views/admin/articles/ArticleStatusBadge.tsx src/views/admin/articles/ArticleSaveStatus.tsx src/views/admin/articles/articlePages.css
git commit -m "feat: add article page primitives"
```
## Task 8: 实现文章列表筛选、卡片、分页和删除弹窗

**Files:**

- Create: `src/views/admin/articles/ArticleListFilters.tsx`
- Create: `src/views/admin/articles/ArticleListItem.tsx`
- Create: `src/views/admin/articles/ArticleListPagination.tsx`
- Create: `src/views/admin/articles/ArticleListView.tsx`
- Modify: `src/views/admin/articles/ArticleListView.test.tsx`
- Modify: `src/views/admin/articles/articlePages.css`

**Interfaces:**

- Consumes: `useArticlePageQuery`、`useDeleteArticleMutation`、`ArticleCover`、`ArticleStatusBadge`。
- Produces: 完整 `/admin/articles` 页面。

- [ ]  **Step 1: 实现筛选区**

`ArticleListFilters` props：

```ts
type ArticleListFiltersProps = {
  keyword: string
  status: ArticleStatus | ''
  loading: boolean
  onKeywordChange: (keyword: string) => void
  onStatusChange: (status: ArticleStatus | '') => void
  onSearch: () => void
  onReset: () => void
}
```
规则：

```text
关键词最多 50 字符，超过时显示字段错误，不触发查询
状态使用原生 select，选项为 全部、草稿、已发布、隐藏
查询按钮触发 onSearch
重置按钮触发 onReset
```
- [ ]  **Step 2: 实现横向文章卡片**

`ArticleListItem` 展示：

```text
封面
标题
摘要或 暂无摘要
状态标签
阅读 {viewCount} · 评论 {commentCount} · 发布 {publishedAt 或 尚未发布}
更新 {updatedAt}
编辑
删除
```
编辑按钮：

```ts
navigate(`/admin/articles/${article.id}/edit`)
```
删除按钮只打开确认弹窗，不直接请求。

- [ ]  **Step 3: 实现分页**

`ArticleListPagination` props：

```ts
type ArticleListPaginationProps = {
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
}
```
规则：

```text
上一页在 page <= 1 时禁用
下一页在 page >= pages 时禁用
显示 共 {total} 条 和 {page} / {pages || 1}
```
- [ ]  **Step 4: 组合 `ArticleListView`**

状态规则：

```text
首次加载显示列表骨架或 LoadingState
接口失败显示 ErrorState 和重新加载
无筛选且 list 为空显示 还没有文章，并提供新建文章按钮
有筛选且 list 为空显示 没有找到符合条件的文章，并提供重置筛选按钮
删除成功后关闭弹窗并刷新列表
删除失败显示 Alert type="error"
```
- [ ]  **Step 5: 实现列表页测试**

Run:

```powershell
npm run test:run -- src/views/admin/articles/ArticleListView.test.tsx
```
Expected: 列表页行为测试通过。

- [ ]  **Step 6: Commit**

```bash
git add src/views/admin/articles/ArticleListFilters.tsx src/views/admin/articles/ArticleListItem.tsx src/views/admin/articles/ArticleListPagination.tsx src/views/admin/articles/ArticleListView.tsx src/views/admin/articles/ArticleListView.test.tsx src/views/admin/articles/articlePages.css
git commit -m "feat: build admin article list page"
```
## Task 9: 实现编辑器核心模型、历史和命令

**Files:**

- Create: `src/components/editor/block-markdown-editor/types.ts`
- Create: `src/components/editor/block-markdown-editor/core/blockModel.ts`
- Create: `src/components/editor/block-markdown-editor/core/commands.ts`
- Create: `src/components/editor/block-markdown-editor/core/history.ts`
- Modify: `src/components/editor/block-markdown-editor/core/blockModel.test.ts`

**Interfaces:**

- Consumes: 设计文档中的扁平块列表模型。
- Produces: 编辑器 UI 和 Markdown 转换层可用的块模型和命令函数。

- [ ]  **Step 1: 定义块类型**

`types.ts` 定义：

```ts
export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'quote'
  | 'unordered-list'
  | 'ordered-list'
  | 'task-list'
  | 'code'
  | 'image'
  | 'table'
  | 'divider'

export type TextAlign = 'left' | 'center' | 'right'

export type EditorBlockBase = {
  id: string
  type: BlockType
}

export type TextBlock = EditorBlockBase & {
  type: 'paragraph' | 'quote'
  html: string
}

export type HeadingBlock = EditorBlockBase & {
  type: 'heading'
  level: 1 | 2 | 3 | 4
  html: string
}

export type ListItem = {
  id: string
  html: string
  checked?: boolean
  indent: 0 | 1 | 2
}

export type ListBlock = EditorBlockBase & {
  type: 'unordered-list' | 'ordered-list' | 'task-list'
  items: ListItem[]
}

export type CodeBlock = EditorBlockBase & {
  type: 'code'
  language?: string
  code: string
}

export type ImageBlock = EditorBlockBase & {
  type: 'image'
  url: string
  alt?: string
}

export type TableCell = {
  id: string
  html: string
  rowspan: number
  colspan: number
  align: TextAlign
}

export type TableBlock = EditorBlockBase & {
  type: 'table'
  hasHeader: boolean
  columnWidths: string[]
  rows: TableCell[][]
}

export type DividerBlock = EditorBlockBase & {
  type: 'divider'
}

export type EditorBlock =
  | TextBlock
  | HeadingBlock
  | ListBlock
  | CodeBlock
  | ImageBlock
  | TableBlock
  | DividerBlock
```
- [ ]  **Step 2: 实现模型工厂**

`blockModel.ts` 输出：

```ts
export const createBlockId = () => crypto.randomUUID()
export const createParagraphBlock = (html = ''): TextBlock => (...)
export const createHeadingBlock = (level: 1 | 2 | 3 | 4, html = ''): HeadingBlock => (...)
export const createDefaultTableBlock = (): TableBlock => (...)
export const ensureNonEmptyDocument = (blocks: EditorBlock[]) => (...)
export const getPlainTextFromHtml = (html: string) => (...)
export const isBlockEmpty = (block: EditorBlock) => (...)
```
`crypto.randomUUID()` 在测试环境不可用时用可注入 id 工厂，不引入 uuid 依赖。

- [ ]  **Step 3: 实现命令函数**

`commands.ts` 输出纯函数：

```ts
export const insertBlockAfter = (blocks, targetId, block) => (...)
export const updateBlock = (blocks, blockId, patch) => (...)
export const removeBlock = (blocks, blockId) => (...)
export const moveBlock = (blocks, blockId, direction) => (...)
export const duplicateBlock = (blocks, blockId) => (...)
export const convertBlockType = (blocks, blockId, nextType) => (...)
export const insertTableRow = (table, rowIndex, placement) => (...)
export const insertTableColumn = (table, columnIndex, placement) => (...)
export const deleteTableRow = (table, rowIndex) => (...)
export const deleteTableColumn = (table, columnIndex) => (...)
export const setTableAlignment = (table, cellId, align) => (...)
```
- [ ]  **Step 4: 实现历史**

`history.ts`：

```ts
export type EditorHistory = {
  past: EditorBlock[][]
  present: EditorBlock[]
  future: EditorBlock[][]
}

export const createHistory = (blocks: EditorBlock[]): EditorHistory => (...)
export const pushHistory = (history: EditorHistory, blocks: EditorBlock[]) => (...)
export const undoHistory = (history: EditorHistory) => (...)
export const redoHistory = (history: EditorHistory) => (...)
```
- [ ]  **Step 5: 实现核心测试**

Run:

```powershell
npm run test:run -- src/components/editor/block-markdown-editor/core/blockModel.test.ts
```
Expected: 块创建、移动、复制、删除、历史撤销重做测试通过。

- [ ]  **Step 6: Commit**

```bash
git add src/components/editor/block-markdown-editor/types.ts src/components/editor/block-markdown-editor/core
git commit -m "feat: add block editor core model"
```
## Task 10: 实现 Markdown 解析、序列化和 HTML 清理

**Files:**

- Create: `src/components/editor/block-markdown-editor/markdown/markdownSchema.ts`
- Create: `src/components/editor/block-markdown-editor/markdown/sanitizeHtml.ts`
- Create: `src/components/editor/block-markdown-editor/markdown/parseMarkdown.ts`
- Create: `src/components/editor/block-markdown-editor/markdown/serializeMarkdown.ts`
- Modify: `src/components/editor/block-markdown-editor/markdown/parseMarkdown.test.ts`
- Modify: `src/components/editor/block-markdown-editor/markdown/serializeMarkdown.test.ts`
- Modify: `src/components/editor/block-markdown-editor/markdown/sanitizeHtml.test.ts`

**Interfaces:**

- Consumes: Task 9 的 `EditorBlock`。
- Produces: `parseMarkdownToBlocks(markdown)`、`serializeBlocksToMarkdown(blocks)`、`sanitizeEditorHtml(html)`。

- [ ]  **Step 1: 定义 HTML 白名单和色板**

`markdownSchema.ts`：

```ts
export const allowedTextColors = [
  '#111827',
  '#6b7280',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#0891b2',
] as const

export const allowedBackgroundColors = [
  '#ffffff',
  '#e5e7eb',
  '#fecdd3',
  '#fed7aa',
  '#fef3c7',
  '#bbf7d0',
  '#bfdbfe',
  '#ddd6fe',
  '#fbcfe8',
  '#a5f3fc',
] as const

export const allowedHtmlTags = [
  'span',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'colgroup',
  'col',
] as const
```
- [ ]  **Step 2: 实现 DOMPurify 清理**

`sanitizeHtml.ts` 规则：

```text
只允许白名单标签和属性
style 只允许 color、background-color、text-align、width
color/background-color 必须来自预设色板
text-align 只允许 left、center、right
width 只允许 1-9999px 或 1-100%
移除 script、style、iframe、object、embed、video、audio 和所有 on* 事件属性
```
- [ ]  **Step 3: 实现 Markdown 入站解析**

`parseMarkdown.ts` 使用：

```ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
```
解析规则：

```text
heading -> heading block
paragraph -> paragraph block
blockquote -> quote block
list ordered=false -> unordered-list 或 task-list
list ordered=true -> ordered-list
code -> code block
image -> image block
thematicBreak -> divider block
table -> table block
html table -> sanitize 后转 table block
未知节点 -> paragraph block，保留纯文本
解析失败 -> 返回一个 paragraph block，内容为原文转义文本，并提供错误标记给 UI
```
- [ ]  **Step 4: 实现 Markdown 出站序列化**

`serializeMarkdown.ts` 规则：

```text
paragraph -> 普通段落
heading -> # 到 #### 标题
quote -> > 引用
unordered-list -> - 列表
ordered-list -> 1. 列表
task-list -> - [ ] / - [x]
code -> fenced code
image -> ![alt](url)
divider -> ---
简单 table -> GFM table
带 rowspan/colspan/width 的复杂 table -> 受限 HTML table
span 样式 -> 保留受限 HTML span
```
- [ ]  **Step 5: 实现解析和清理测试**

Run:

```powershell
npm run test:run -- src/components/editor/block-markdown-editor/markdown
```
Expected: Markdown 往返、受限 HTML 保留和危险 HTML 清理测试通过。

- [ ]  **Step 6: Commit**

```bash
git add src/components/editor/block-markdown-editor/markdown
git commit -m "feat: add block markdown conversion"
```
## Task 11: 实现编辑器基础画布和块渲染

**Files:**

- Create: `src/components/editor/block-markdown-editor/index.ts`
- Create: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.tsx`
- Create: `src/components/editor/block-markdown-editor/blockMarkdownEditor.css`
- Create: `src/components/editor/block-markdown-editor/blocks/ParagraphBlock.tsx`
- Create: `src/components/editor/block-markdown-editor/blocks/HeadingBlock.tsx`
- Create: `src/components/editor/block-markdown-editor/blocks/ListBlock.tsx`
- Create: `src/components/editor/block-markdown-editor/blocks/QuoteBlock.tsx`
- Create: `src/components/editor/block-markdown-editor/blocks/CodeBlock.tsx`
- Create: `src/components/editor/block-markdown-editor/blocks/ImageBlock.tsx`
- Create: `src/components/editor/block-markdown-editor/blocks/TableBlock.tsx`
- Create: `src/components/editor/block-markdown-editor/blocks/DividerBlock.tsx`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx`

**Interfaces:**

- Consumes: Tasks 9-10 的模型和 Markdown 转换。
- Produces: 可编辑的连续文档画布。

- [ ]  **Step 1: 实现 `BlockMarkdownEditor` 状态同步**

规则：

```text
初次渲染用 value 解析 blocks
用户编辑 blocks 后序列化 Markdown 并调用 onChange
外部 value 变化且编辑器未聚焦时重新解析
readOnly=true 时禁止编辑、工具浮层和快捷键修改
```
- [ ]  **Step 2: 实现块渲染组件**

每种块只负责自身视觉和本块内容变更：

```text
ParagraphBlock：contentEditable 段落
HeadingBlock：contentEditable h1/h2/h3/h4
QuoteBlock：连续文档中的引用块，左侧蓝线
ListBlock：无序、有序、任务列表，支持勾选
CodeBlock：语义代码容器和语言输入
ImageBlock：URL 图片、空 URL 占位、加载失败占位和原始 URL
TableBlock：表格编辑基础渲染
DividerBlock：分割线
```
- [ ]  **Step 3: 实现连续文档画布样式**

CSS 要求：

```text
编辑器是一块连续白色文档画布
普通块默认不加独立卡片边框
代码块和表格保留语义容器
块 hover/selected 状态不改变文档布局尺寸
工具浮层使用 absolute/fixed overlay，不挤压内容
```
- [ ]  **Step 4: 实现基础编辑器测试**

Run:

```powershell
npm run test:run -- src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx
```
Expected: 渲染、输入、onChange、readOnly、基础块展示测试通过。

- [ ]  **Step 5: Commit**

```bash
git add src/components/editor/block-markdown-editor
git commit -m "feat: render block markdown editor canvas"
```
## Task 12: 实现块创建菜单和 Markdown 快捷转换

**Files:**

- Create: `src/components/editor/block-markdown-editor/toolbars/BlockInsertMenu.tsx`
- Create: `src/components/editor/block-markdown-editor/utils/keyboard.ts`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.tsx`
- Modify: `src/components/editor/block-markdown-editor/blockMarkdownEditor.css`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx`

**Interfaces:**

- Consumes: Task 9 命令函数。
- Produces: `/` 菜单、块旁 `+` 菜单和 Markdown 快捷语法转换。

- [ ]  **Step 1: 实现块类型菜单**

菜单项：

```text
段落
一级标题
二级标题
三级标题
引用
无序列表
有序列表
任务列表
代码块
图片
表格
分割线
```
点击菜单后在当前块后插入对应块，并聚焦新块。

- [ ]  **Step 2: 实现 `/` 触发**

规则：

```text
当前空段落输入 / 时打开菜单
Esc 关闭菜单
上下键移动菜单焦点
Enter 选择当前菜单项
```
- [ ]  **Step 3: 实现 Markdown 快捷转换**

转换表：


| 输入       | 转换结果 |
| ---------- | -------- |
| `# `       | 一级标题 |
| `## `      | 二级标题 |
| `### `     | 三级标题 |
| `- `       | 无序列表 |
| `1. `      | 有序列表 |
| `- [ ] `   | 任务列表 |
| `> `       | 引用     |
| 三个反引号 | 代码块   |
| `---`      | 分割线   |

- [ ]  **Step 4: 测试块创建和快捷转换**

Run:

```powershell
npm run test:run -- src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx
```
Expected: `/` 菜单、块旁加号和 Markdown 快捷语法测试通过。

- [ ]  **Step 5: Commit**

```bash
git add src/components/editor/block-markdown-editor
git commit -m "feat: add editor block insertion"
```
## Task 13: 实现块工具浮层

**Files:**

- Create: `src/components/editor/block-markdown-editor/toolbars/BlockToolbar.tsx`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.tsx`
- Modify: `src/components/editor/block-markdown-editor/blockMarkdownEditor.css`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx`

**Interfaces:**

- Consumes: `@floating-ui/react-dom`、Task 9 命令函数。
- Produces: 选中块时显示的块工具浮层。

- [ ]  **Step 1: 实现浮层定位**

使用 `@floating-ui/react-dom`：

```text
reference 为当前块操作柄
placement 使用 top-start
middleware 使用 offset、flip、shift
whileElementsMounted 使用 autoUpdate
```
- [ ]  **Step 2: 实现块工具按钮**

能力：

```text
切换段落
切换 H1 / H2 / H3 / H4
切换引用
切换无序列表
切换有序列表
切换任务列表
插入代码块
插入图片 URL
插入表格
插入分割线
上移块
下移块
复制块
删除块
```
使用 lucide-react 图标；不手写 SVG。

- [ ]  **Step 3: 实现禁用规则**

规则：

```text
第一个块的上移按钮禁用
最后一个块的下移按钮禁用
文档只有一个空段落时删除按钮禁用
readOnly 时不显示工具浮层
```
- [ ]  **Step 4: 测试块工具**

Run:

```powershell
npm run test:run -- src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx
```
Expected: 块切换、移动、复制、删除测试通过，浮层出现不改变块尺寸。

- [ ]  **Step 5: Commit**

```bash
git add src/components/editor/block-markdown-editor/toolbars/BlockToolbar.tsx src/components/editor/block-markdown-editor/BlockMarkdownEditor.tsx src/components/editor/block-markdown-editor/blockMarkdownEditor.css src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx
git commit -m "feat: add editor block toolbar"
```
## Task 14: 实现文字工具浮层

**Files:**

- Create: `src/components/editor/block-markdown-editor/toolbars/TextToolbar.tsx`
- Create: `src/components/editor/block-markdown-editor/utils/dom.ts`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.tsx`
- Modify: `src/components/editor/block-markdown-editor/blockMarkdownEditor.css`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx`

**Interfaces:**

- Consumes: 选择区间、HTML 清理白名单、预设色板。
- Produces: 选中文字后的格式工具浮层。

- [ ]  **Step 1: 实现选区检测**

规则：

```text
selection 为空不显示
selection 不在编辑器内不显示
readOnly 不显示
浮层 reference 使用 Range.getBoundingClientRect() 虚拟元素
```
- [ ]  **Step 2: 实现文字格式命令**

能力：

```text
加粗
斜体
下划线
删除线
行内代码
设置链接
取消链接
文字颜色
背景高亮色
清除格式
```
格式结果必须经过 `sanitizeEditorHtml`，保存时只输出白名单内 `span` 和语义标签转换后的 Markdown/HTML。

- [ ]  **Step 3: 实现色板**

规则：

```text
文字颜色只能来自 allowedTextColors
背景高亮只能来自 allowedBackgroundColors
不允许用户输入任意 CSS
清除格式移除当前选区内 strong/em/u/del/code/a/span 样式
```
- [ ]  **Step 4: 测试文字工具**

Run:

```powershell
npm run test:run -- src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx src/components/editor/block-markdown-editor/markdown/sanitizeHtml.test.ts
```
Expected: 文字格式、链接、颜色、高亮和清除格式测试通过。

- [ ]  **Step 5: Commit**

```bash
git add src/components/editor/block-markdown-editor/toolbars/TextToolbar.tsx src/components/editor/block-markdown-editor/utils/dom.ts src/components/editor/block-markdown-editor/BlockMarkdownEditor.tsx src/components/editor/block-markdown-editor/blockMarkdownEditor.css src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx
git commit -m "feat: add editor text toolbar"
```
## Task 15: 实现列表交互

**Files:**

- Modify: `src/components/editor/block-markdown-editor/blocks/ListBlock.tsx`
- Modify: `src/components/editor/block-markdown-editor/core/commands.ts`
- Modify: `src/components/editor/block-markdown-editor/utils/keyboard.ts`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx`

**Interfaces:**

- Consumes: `ListBlock`、键盘事件处理。
- Produces: 无序、有序、任务列表的两级缩进编辑。

- [ ]  **Step 1: 实现列表键盘规则**

规则：

```text
Tab 增加缩进，最多两级
Shift + Tab 减少缩进
Enter 创建同级列表项
Backspace 在空列表项退出列表
任务列表支持勾选
列表块可转回段落
```
- [ ]  **Step 2: 实现序列化缩进**

规则：

```text
indent 0 使用无缩进
indent 1 使用两个空格
indent 2 使用四个空格
任务列表保存 - [ ] 或 - [x]
```
- [ ]  **Step 3: 测试列表交互**

Run:

```powershell
npm run test:run -- src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx src/components/editor/block-markdown-editor/markdown/serializeMarkdown.test.ts
```
Expected: 列表缩进、同级新增、退出列表和任务勾选测试通过。

- [ ]  **Step 4: Commit**

```bash
git add src/components/editor/block-markdown-editor/blocks/ListBlock.tsx src/components/editor/block-markdown-editor/core/commands.ts src/components/editor/block-markdown-editor/utils/keyboard.ts src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx
git commit -m "feat: add editor list interactions"
```
## Task 16: 实现表格工具浮层和表格编辑

**Files:**

- Modify: `src/components/editor/block-markdown-editor/blocks/TableBlock.tsx`
- Create: `src/components/editor/block-markdown-editor/toolbars/TableToolbar.tsx`
- Modify: `src/components/editor/block-markdown-editor/core/commands.ts`
- Modify: `src/components/editor/block-markdown-editor/markdown/serializeMarkdown.ts`
- Modify: `src/components/editor/block-markdown-editor/blockMarkdownEditor.css`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx`

**Interfaces:**

- Consumes: `TableBlock` 模型和 Floating UI 定位。
- Produces: 表格右键工具浮窗、行列增删、合并拆分、表头、对齐、列宽。

- [ ]  **Step 1: 实现表格基础编辑**

规则：

```text
插入表格默认 3x3
单元格 contentEditable
Tab 移动到下一个单元格
Shift + Tab 移动到上一个单元格
Enter 单元格内换行
```
- [ ]  **Step 2: 实现行列操作**

能力：

```text
插入上方行
插入下方行
插入左侧列
插入右侧列
删除当前行
删除当前列
```
- [ ]  **Step 3: 实现表格结构操作**

能力：

```text
合并单元格
拆分单元格
表头开关
单元格左对齐
单元格居中
单元格右对齐
清空单元格内容
删除表格
```
- [ ]  **Step 4: 实现视觉交互**

规则：

```text
鼠标悬浮表格边缘或行列间隙显示 + 号
拖拽列边界调整列宽
当前单元格显示蓝色选中边框
工具浮窗不遮挡当前单元格输入区域
```
- [ ]  **Step 5: 测试表格**

Run:

```powershell
npm run test:run -- src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx src/components/editor/block-markdown-editor/markdown/serializeMarkdown.test.ts
```
Expected: 表格插入、行列操作、表头、对齐、列宽、受限 HTML 序列化测试通过。

- [ ]  **Step 6: Commit**

```bash
git add src/components/editor/block-markdown-editor/blocks/TableBlock.tsx src/components/editor/block-markdown-editor/toolbars/TableToolbar.tsx src/components/editor/block-markdown-editor/core/commands.ts src/components/editor/block-markdown-editor/markdown/serializeMarkdown.ts src/components/editor/block-markdown-editor/blockMarkdownEditor.css src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx
git commit -m "feat: add editor table tools"
```
## Task 17: 实现粘贴、图片块和快捷键抽屉

**Files:**

- Create: `src/components/editor/block-markdown-editor/utils/clipboard.ts`
- Create: `src/components/editor/block-markdown-editor/toolbars/ShortcutDrawer.tsx`
- Modify: `src/components/editor/block-markdown-editor/blocks/ImageBlock.tsx`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.tsx`
- Modify: `src/components/editor/block-markdown-editor/blockMarkdownEditor.css`
- Modify: `src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx`

**Interfaces:**

- Consumes: Markdown 解析、HTML 清理和图片块模型。
- Produces: 粘贴处理、正文图片 URL 能力和快捷键帮助抽屉。

- [ ]  **Step 1: 实现粘贴处理**

规则：

```text
剪贴板有 text/markdown：解析成块并插入当前块后
剪贴板只有 text/plain：按空行拆段落，单换行保留为块内换行
剪贴板有 text/html：安全降级，只保留白名单结构和样式
危险 HTML 被移除，不导致页面白屏
```
- [ ]  **Step 2: 完善图片块**

规则：

```text
正文图片只支持 URL
URL 为空显示图片块占位
图片加载失败显示错误占位和原始 URL
alt 可编辑，可为空
```
- [ ]  **Step 3: 实现快捷键抽屉**

抽屉分类：

```text
基础编辑
块操作
文字格式
列表
表格
```
只显示本阶段已经实现的快捷键：

```text
Ctrl + S
Ctrl + Z
Ctrl + Shift + Z / Ctrl + Y
Esc
/
Alt + ↑
Alt + ↓
Ctrl + Shift + D
Ctrl + Backspace
Enter
Shift + Enter
Ctrl + B
Ctrl + I
Ctrl + U
Ctrl + Shift + X
Ctrl + E
Ctrl + K
Tab
Shift + Tab
Ctrl + Enter
Ctrl + Shift + Enter
```
- [ ]  **Step 4: 实现全局快捷键边界**

规则：

```text
Ctrl + S 在编辑器聚焦时调用 onSaveShortcut 并 preventDefault
浏览器系统快捷键优先，不拦截刷新、打开开发者工具、地址栏等组合键
Esc 只关闭当前打开的浮层或抽屉
```
- [ ]  **Step 5: 测试粘贴、图片和快捷键**

Run:

```powershell
npm run test:run -- src/components/editor/block-markdown-editor/BlockMarkdownEditor.test.tsx
```
Expected: 粘贴、图片失败占位、快捷键抽屉和 Ctrl+S 测试通过。

- [ ]  **Step 6: Commit**

```bash
git add src/components/editor/block-markdown-editor
git commit -m "feat: add editor paste and shortcuts"
```
## Task 18: 实现文章编辑页信息栏、保存和删除

**Files:**

- Create: `src/views/admin/articles/ArticleEditorView.tsx`
- Modify: `src/views/admin/articles/ArticleEditorView.test.tsx`
- Modify: `src/views/admin/articles/articlePages.css`

**Interfaces:**

- Consumes: `BlockMarkdownEditor`、`ArticleCover`、`ArticleSaveStatus`、article query hooks。
- Produces: `/admin/articles/new` 和 `/admin/articles/:id/edit` 共用编辑页。

- [ ]  **Step 1: 实现页面模式**

Props：

```ts
type ArticleEditorViewProps = {
  mode: 'create' | 'edit'
}
```
规则：

```text
create 模式不读取详情，不显示危险区删除按钮
edit 模式从 useParams 读取 id，请求文章详情，显示危险区删除按钮
id 不是数字时显示 ErrorState 并提供返回文章列表按钮
```
- [ ]  **Step 2: 实现表单状态**

本地状态：

```ts
type ArticleForm = {
  title: string
  summary: string
  coverUrl: string
  status: ArticleStatus
  content: string
}
```
默认值：

```ts
const emptyArticleForm: ArticleForm = {
  title: '',
  summary: '',
  coverUrl: '',
  status: 'draft',
  content: '',
}
```
- [ ]  **Step 3: 实现右侧信息栏**

字段：

```text
标题：必填，最多 120 字符
摘要：可空，最多 300 字符
封面 URL：可空，最多 500 字符
封面预览：复用 ArticleCover
状态：radio，草稿、已发布、隐藏
保存文章：主按钮
危险区删除文章：仅 edit 模式显示
```
- [ ]  **Step 4: 实现保存流程**

校验：

```text
标题 trim 后不能为空
标题最多 120 字符
摘要最多 300 字符
封面 URL 最多 500 字符
正文 trim 后不能为空
```
提交：

```text
create -> createArticle -> 成功后 navigate('/admin/articles/{id}/edit', { replace: true })
edit -> updateArticle -> 成功后显示 已保存 并刷新详情缓存
失败 -> Alert 显示后端 msg
保存中 -> 禁用保存按钮
```
- [ ]  **Step 5: 实现删除流程**

规则：

```text
点击删除文章打开 ConfirmDialog
弹窗显示当前文章标题
确认后调用 deleteArticle(id)
成功后 navigate('/admin/articles', { replace: true })
失败时留在当前页并显示后端 msg
```
- [ ]  **Step 6: 实现编辑页布局样式**

真实浏览器桌面布局：

```text
顶部：返回文章列表 + 保存状态居中或右侧
主体：grid，左侧 minmax(0, 1fr)，右侧 360px-390px
左侧编辑器是连续文档画布
右侧信息栏 sticky 在内容滚动容器内
```
- [ ]  **Step 7: 实现编辑页测试**

Run:

```powershell
npm run test:run -- src/views/admin/articles/ArticleEditorView.test.tsx
```
Expected: 新建、编辑、校验、保存、删除、Ctrl+S 行为测试通过。

- [ ]  **Step 8: Commit**

```bash
git add src/views/admin/articles/ArticleEditorView.tsx src/views/admin/articles/ArticleEditorView.test.tsx src/views/admin/articles/articlePages.css
git commit -m "feat: build admin article editor page"
```
## Task 19: 视觉还原整合和浏览器截图验收

**Files:**

- Modify: `src/views/admin/articles/articlePages.css`
- Modify: `src/components/editor/block-markdown-editor/blockMarkdownEditor.css`
- Modify: `src/components/admin/admin.css`
- Modify: `src/styles/variables.css`

**Interfaces:**

- Consumes: 文章页面和编辑器全部 UI。
- Produces: 符合原型关系的桌面端视觉。

- [ ]  **Step 1: 启动前端服务**

使用普通可见 `cmd` 窗口：

```cmd
cd /d D:\daimai\项目学习\blog-web
npm run dev
```
Expected: Vite 输出本地 URL，例如 `http://localhost:5173/`。

- [ ]  **Step 2: 启动后端服务**

使用另一个普通可见 `cmd` 窗口：

```cmd
cd /d D:\daimai\项目学习\springboot
mvn spring-boot:run
```
Expected: Spring Boot 后端启动并监听前端 Vite 代理目标端口。

- [ ]  **Step 3: 使用真实浏览器检查文章列表**

验收 URL：

```text
http://localhost:5173/admin/articles
```
检查：

```text
侧边栏文章管理 active 尺寸不跳动
标题、说明、新建文章按钮位置接近原型
筛选区在 1440 和 1536 宽度下不挤压
横向文章卡片封面、标题、摘要、状态、元信息、操作按钮对齐
空列表、筛选无结果、加载失败、删除确认弹窗符合状态集合图
无文字溢出、遮挡、重叠、裁切
```
- [ ]  **Step 4: 使用真实浏览器检查编辑页**

验收 URL：

```text
http://localhost:5173/admin/articles/new
http://localhost:5173/admin/articles/{id}/edit
```
检查：

```text
编辑页左侧文档画布和右侧文章信息栏比例接近 70/30
顶部返回入口和保存状态没有拥挤
右侧标题、摘要、封面 URL、状态和保存按钮对齐
封面预览按真实 URL 显示，失败时显示占位
编辑器普通块不是一块一个卡片
代码块、表格、引用块视觉符合原型
块工具、文字工具、表格工具浮层不造成布局跳动
快捷键抽屉默认隐藏，打开后不遮挡核心表单操作
```
- [ ]  **Step 5: Playwright 截图记录**

Run:

```powershell
npx --yes --package @playwright/cli playwright-cli screenshot --viewport-size=1440,900 http://localhost:5173/admin/articles .playwright-cli/admin-articles-1440.png
npx --yes --package @playwright/cli playwright-cli screenshot --viewport-size=1536,960 http://localhost:5173/admin/articles/new .playwright-cli/admin-article-editor-1536.png
```
Expected: 截图非空，页面完整渲染，无控制台明显错误。

- [ ]  **Step 6: 修正视觉缺陷**

只修正以下类型问题：

```text
不符合原型的明显错位
真实浏览器宽度下的溢出和遮挡
工具浮层位置错误
按钮 loading 或 active 导致布局跳动
色彩状态语义错误
编辑器画布被做成卡片堆叠
```
- [ ]  **Step 7: Commit**

```bash
git add src/views/admin/articles/articlePages.css src/components/editor/block-markdown-editor/blockMarkdownEditor.css src/components/admin/admin.css src/styles/variables.css .playwright-cli
git commit -m "style: align admin article UI prototypes"
```
## Task 20: 全量质量门禁

**Files:**

- All touched frontend files

**Interfaces:**

- Consumes: 所有前端实现。
- Produces: 可交付的文章模块前端。

- [ ]  **Step 1: 类型检查**

Run:

```powershell
npm run typecheck
```
Expected: 0 errors。

- [ ]  **Step 2: Lint**

Run:

```powershell
npm run lint
```
Expected: 0 errors。

- [ ]  **Step 3: 单次测试**

Run:

```powershell
npm run test:run
```
Expected: 所有 Vitest 测试通过。

- [ ]  **Step 4: 构建**

Run:

```powershell
npm run build
```
Expected: TypeScript build 和 Vite build 成功。

- [ ]  **Step 5: 格式检查**

Run:

```powershell
npm run format:check
```
Expected: 格式检查通过。

- [ ]  **Step 6: 浏览器联调回归**

真实浏览器中回归：

```text
登录后台
进入文章管理
筛选文章
新建草稿
编辑刚新建的文章
保存已发布状态
删除文章
退出登录
```
Expected:

```text
流程可完成
请求走 /api/admin/articles 代理
401 会清理登录态
没有控制台 error
没有可见 UI 遮挡、错位和文字溢出
```
- [ ]  **Step 7: Commit**

```bash
git status --short
git add .
git commit -m "feat: complete admin article module"
```
## 自检

- 规格覆盖：文章列表页、新建文章页、编辑文章页、侧边栏菜单、删除弹窗、状态集合、块编辑器、块工具、文字工具、表格工具、快捷键抽屉均有任务覆盖。
- 任务拆分：页面 UI、文章业务数据层、编辑器核心、块工具、文字工具、表格工具、快捷键抽屉分别拆开，没有把一堆 UI 和功能塞进同一个任务。
- 依赖取舍：没有引入完整富文本框架和完整后台 UI 组件库；只新增 Markdown 解析/序列化、HTML 清理和浮层定位依赖。
- 后端契约：识别了删除接口缺少成功 `code` 的真实问题，并把修复放在删除联调前置任务，避免前端绕开统一 request。
- 维护边界：文章页面在 `src/views/admin/articles/`，编辑器在 `src/components/editor/block-markdown-editor/`，编辑器不依赖后台业务和登录态。
- 测试策略：BDD 门禁、API/query 测试、列表页测试、编辑页测试、编辑器核心测试和真实浏览器验收均覆盖。
- 浏览器还原：验收使用真实桌面浏览器 `1440x900` 和 `1536x960`，不按原图像素尺寸机械复刻。
