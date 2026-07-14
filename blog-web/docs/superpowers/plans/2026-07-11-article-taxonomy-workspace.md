# Article Taxonomy Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有文章管理工作台中完整接入分类、标签、文章关联、状态流转、置顶推荐、组合筛选与批量删除，并通过真实浏览器和真实 Spring Boot 后端完成闭环验收。

**Architecture:** 保持现有 `types -> api -> queries -> views` 数据边界，分类标签使用独立领域文件，文章列表和编辑页只组合小型业务组件。文章列表保持紧凑响应，仅支持 `tagId` 筛选而不返回标签集合；文章详情继续返回真实标签用于编辑回填。视觉完全复用现有后台变量、UI 组件和连续行列表语言。

**Tech Stack:** React、TypeScript strict、Vite、TanStack Query、React Router、Zustand、Vitest、Testing Library、Lucide React、Spring Boot 4、MyBatis、PageHelper、JUnit 5、H2、Playwright CLI。

## Global Constraints

- 视觉基线只使用 `output/playwright/task19-articles-initial.png` 与 `output/playwright/task19-shortcut-drawer.png`，禁止引用旧版蓝色原型。
- 后台仅按真实桌面浏览器窗口验收，不向 Playwright 传固定 viewport，不做移动端布局。
- 启动前后端时使用两个普通可见 `cmd` 窗口；禁止 `Start-Process`、Windows Terminal、脚本封装和自写启动器。
- 正式功能代码执行前先更新现有设计文档 `docs/前端设计目录/分类标签UI/2026-07-11-文章运营工作台分类标签UI设计.md`，禁止另建同主题设计文档。
- 前端正式功能代码触发 BDD/TDD 门禁：先创建只含测试函数名和中文 Given-When-Then 注释的空测试，再询问用户是否继续；用户批准前禁止写测试实现和生产代码。
- 页面禁止直接调用 Axios；请求必须经过 `api` 和 TanStack Query。
- 不做空壳、假数据、假接口、前端模拟成功或未接后端的 UI。
- 不新增或扩写 `.test.tsx` UI 测试；页面、导航、组件、布局和交互全部使用真实浏览器连接真实后端验收。
- 页面负责状态编排，重复控件和独立交互拆成聚焦组件，避免继续膨胀 `ArticleListView.tsx` 与 `ArticleEditorView.tsx`。
- 先复用现有 `Button`、`Input`、`FormField`、`Modal`、`ConfirmDialog`、`Alert` 和 CSS 变量。
- 不安装 GSAP。当前交互使用 CSS `transition`；只有真实浏览器证明存在 CSS 无法维护的复杂序列动画时，才另行设计和引入 GSAP。
- 动画只用于菜单、更多筛选和子导航轻量显隐，持续约 `120-180ms`，并遵守 `prefers-reduced-motion`。
- 分类不做关键词搜索和分页；标签不做分页；文章不做自定义排序；不做跨页批量选择。
- 每个任务只提交本任务文件，不纳入工作区已有无关改动。

## File Structure

### Frontend

- `src/types/taxonomy.ts`: 分类、标签、查询与保存类型。
- `src/api/taxonomy.ts`: 分类、标签接口。
- `src/queries/taxonomy.ts`: 分类、标签 Query Key、查询和变更。
- `src/types/article.ts`, `src/api/article.ts`, `src/queries/article.ts`: 补全文章关联、筛选、状态和批量操作。
- `src/components/ui/Menu.tsx`: 文章行与分类标签行共用的轻量操作菜单。
- `src/components/ui/Switch.tsx`: 置顶与推荐开关。
- `src/components/admin/AdminArticleNavGroup.tsx`: 文章父子导航。
- `src/views/admin/taxonomy/TaxonomyDialog.tsx`: 分类标签对话框骨架。
- `src/views/admin/taxonomy/CategoryListView.tsx`, `CategoryListItem.tsx`: 分类管理。
- `src/views/admin/taxonomy/TagListView.tsx`, `TagListItem.tsx`: 标签管理。
- `src/views/admin/articles/ArticleTaxonomyFields.tsx`: 编辑页分类标签关联。
- `src/views/admin/articles/TaxonomyQuickCreateDialog.tsx`: 编辑页快捷创建。
- `src/views/admin/articles/ArticlePublishFields.tsx`: 状态、置顶、推荐。
- `src/views/admin/articles/ArticleListActions.tsx`: 单篇更多菜单。
- `src/views/admin/articles/ArticleBatchBar.tsx`: 批量模式工具栏。
- 页面 CSS 继续放在现有 `articlePages.css`、`admin.css`、`ui.css`，分类标签页新增单一 `taxonomyPages.css`。

### Backend

- `D:/daimai/项目学习/springboot/springboot-article/src/main/java/com/xinmengqaq/springboot/article/vo/ArticleListVO.java`: 保持列表展示字段，不返回标签集合。
- `springboot-article/.../service/impl/ArticleServiceImpl.java`: 分页查询不装配标签，详情查询继续返回 `ArticleDetailVO.tags`。
- `springboot-article/.../service/impl/ArticleServiceImplTest.java`: 不保留文章列表标签装配测试。

---

### Task 1: BDD Behavior Gate

**Files:**
- Modify: `docs/前端设计目录/分类标签UI/2026-07-11-文章运营工作台分类标签UI设计.md`
- Create: `src/api/taxonomy.test.ts`
- Modify: `src/api/article.test.ts`
- Create: `src/queries/taxonomy.test.ts`
- Modify: `src/queries/article.test.ts`

**Produces:** 仅包含测试函数名和中文 Given-When-Then 行为注释的门禁测试。

- [ ] **Step 1: 更新现有设计文档的实施确认**

追加真实浏览器、真实后端、文件拆分、复用优先和默认不安装 GSAP 的约束。

- [ ] **Step 2: 创建空行为测试**

每个新增行为只能采用以下结构，禁止 `render`、`expect`、mock 和生产代码：

```ts
describe('文章分类 API', () => {
  it('查询分类时应只传递后端支持的状态参数', () => {
    // Given 管理员选择分类显示状态
    // When 前端请求文章分类列表
    // Then 请求只应包含后端支持的 status 参数
  })
})
```

只覆盖分类标签 CRUD API、文章组合筛选参数、状态/置顶/推荐 API、批量删除 API 和缓存失效。父子导航、管理页、关联选择、快捷新建和隐藏分类等 UI 行为不创建自动化 UI 测试。

- [ ] **Step 3: 检查门禁内容**

Run:

```powershell
rg -n "Given|When|Then|expect\(|render\(|vi\.mock" src/api/taxonomy.test.ts src/api/article.test.ts src/queries/taxonomy.test.ts src/queries/article.test.ts
```

Expected: 新增测试有中文 Given-When-Then，新增空测试没有实现代码。

- [ ] **Step 4: 暂停并询问用户是否继续**

用户明确批准前停止，不执行后续任务。

- [ ] **Step 5: 提交行为门禁**

```powershell
git add -- docs/前端设计目录/分类标签UI/2026-07-11-文章运营工作台分类标签UI设计.md src/api/taxonomy.test.ts src/api/article.test.ts src/queries/taxonomy.test.ts src/queries/article.test.ts
git commit -m "Add article taxonomy behavior specs"
```

### Task 2: Keep Tags Out of the Article List Contract

**Files:**
- Modify: `D:/daimai/项目学习/springboot/springboot-article/src/main/java/com/xinmengqaq/springboot/article/vo/ArticleListVO.java`
- Modify: `D:/daimai/项目学习/springboot/springboot-article/src/main/java/com/xinmengqaq/springboot/article/service/impl/ArticleServiceImpl.java`
- Modify: `D:/daimai/项目学习/springboot/springboot-article/src/test/java/com/xinmengqaq/springboot/article/service/impl/ArticleServiceImplTest.java`

**Preserves:** `ArticleDetailVO.tags` 与 `ArticleTagMapper.selectTagsByArticleId(Long)`，仅用于文章详情和编辑页关联回填。

**Produces:** 文章分页响应不返回 `tags`，仍支持 `tagId` 筛选；文章详情继续真实返回标签集合。

- [ ] **Step 1: 删除列表标签返回改造**

从 `ArticleListVO` 删除 `tags` 字段；从 `ArticleServiceImpl.selectPage` 删除逐篇标签装配；从 `ArticleServiceImplTest` 删除列表标签装配测试。不得改动 `selectDetailById` 的标签查询和回填。

- [ ] **Step 2: 确认文章列表筛选契约**

保留 `ArticlePageQueryDTO.tagId`、`ArticleMapper` 的标签筛选 SQL 和对应 Mapper 测试，不新增列表标签摘要或前端详情补查。

- [ ] **Step 3: 运行后端测试**

```powershell
.\mvnw.cmd -pl springboot-article -am -Dtest=ArticleServiceImplTest,ArticleMapperTest test
```

Expected: PASS，且文章详情标签测试与文章列表 `tagId` 筛选测试继续通过。

- [ ] **Step 4: 在后端仓库提交**

```powershell
git add springboot-article/src/main/java/com/xinmengqaq/springboot/article/vo/ArticleListVO.java springboot-article/src/main/java/com/xinmengqaq/springboot/article/service/impl/ArticleServiceImpl.java springboot-article/src/test/java/com/xinmengqaq/springboot/article/service/impl/ArticleServiceImplTest.java
git commit -m "保持文章列表响应精简"
```

### Task 3: Frontend Types and API Contracts

**Files:**
- Create: `src/types/taxonomy.ts`
- Modify: `src/types/article.ts`
- Create: `src/api/taxonomy.ts`
- Modify: `src/api/article.ts`
- Implement tests: `src/api/taxonomy.test.ts`, `src/api/article.test.ts`

**Produces:** 分类标签类型、文章关联类型和所有真实请求函数。

- [ ] **Step 1: 实现 API 测试**

```ts
expect(request.get).toHaveBeenCalledWith('/admin/categories', {
  params: { status: 'visible' },
})
expect(request.patch).toHaveBeenCalledWith('/admin/articles/8/top', {
  isTop: true,
})
expect(request.post).toHaveBeenCalledWith('/admin/articles/batch-delete', {
  ids: [2, 5],
})
```

- [ ] **Step 2: 运行失败测试**

```powershell
npm run test:run -- src/api/taxonomy.test.ts src/api/article.test.ts
```

- [ ] **Step 3: 实现类型与 API**

```ts
export type CategoryStatus = 'visible' | 'hidden'
export type CategoryVO = {
  id: number
  name: string
  description?: string | null
  sortOrder: number
  status: CategoryStatus
  articleCount: number
  createdAt: string
  updatedAt: string
}
export type TagVO = {
  id: number
  name: string
  articleCount: number
  createdAt: string
  updatedAt: string
}
```

文章 API 新增 `batchDeleteArticles`、`updateArticleStatus`、`updateArticleTop`、`updateArticleRecommend`；分页参数增加 `categoryId`、`tagId`。

- [ ] **Step 4: 运行测试与类型检查**

```powershell
npm run test:run -- src/api/taxonomy.test.ts src/api/article.test.ts
npm run typecheck
```

Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/types/taxonomy.ts src/types/article.ts src/api/taxonomy.ts src/api/article.ts src/api/taxonomy.test.ts src/api/article.test.ts
git commit -m "Add article taxonomy API contracts"
```

### Task 4: Query Hooks and Cache Invalidation

**Files:**
- Create: `src/queries/taxonomy.ts`
- Modify: `src/queries/article.ts`
- Implement tests: `src/queries/taxonomy.test.ts`, `src/queries/article.test.ts`

**Produces:** `taxonomyQueryKeys`、分类标签 CRUD hooks、文章 patch hooks 和批量删除 hook。

- [ ] **Step 1: 实现 Query 行为测试**

断言分类标签写操作使 taxonomy 查询失效，文章写操作使 `articleQueryKeys.pages()` 失效，文章保存更新详情缓存。

- [ ] **Step 2: 运行失败测试**

```powershell
npm run test:run -- src/queries/taxonomy.test.ts src/queries/article.test.ts
```

- [ ] **Step 3: 实现 Query keys**

```ts
export const taxonomyQueryKeys = {
  all: ['taxonomy'] as const,
  categories: (status: CategoryStatus | '') =>
    [...taxonomyQueryKeys.all, 'categories', status] as const,
  tags: (keyword: string) =>
    [...taxonomyQueryKeys.all, 'tags', keyword] as const,
}
```

创建、修改、删除分类标签后统一失效 `taxonomyQueryKeys.all`，不维护多套手写缓存同步分支。

- [ ] **Step 4: 运行测试并提交**

```powershell
npm run test:run -- src/queries/taxonomy.test.ts src/queries/article.test.ts
git add src/queries/taxonomy.ts src/queries/article.ts src/queries/taxonomy.test.ts src/queries/article.test.ts
git commit -m "Add taxonomy query hooks"
```

### Task 5: Reusable Controls and Article Navigation

**Files:**
- Create: `src/components/ui/Menu.tsx`
- Create: `src/components/ui/Switch.tsx`
- Modify: `src/components/ui/index.ts`
- Modify: `src/components/ui/ui.css`
- Create: `src/components/admin/AdminArticleNavGroup.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/components/admin/admin.css`

**Produces:** 轻量操作菜单、原生开关、文章父子导航。

- [ ] **Step 1: 实现组件**

`Menu` 只实现按钮列表、分隔线、Escape 和外部点击关闭；`Switch` 使用原生 checkbox：

```tsx
<label className="ui-switch">
  <input
    checked={checked}
    onChange={(event) => onChange(event.target.checked)}
    type="checkbox"
  />
  <span aria-hidden="true" className="ui-switch__track" />
  <span className="ui-switch__label">{label}</span>
</label>
```

导航展开使用 CSS grid/opacity transition，并补 `prefers-reduced-motion`。

- [ ] **Step 2: 执行静态检查并提交**

```powershell
npm run typecheck
npx eslint src/components/ui src/components/admin --max-warnings=0
git add src/components/ui/Menu.tsx src/components/ui/Switch.tsx src/components/ui/index.ts src/components/ui/ui.css src/components/admin/AdminArticleNavGroup.tsx src/components/admin/AdminSidebar.tsx src/components/admin/admin.css
git commit -m "Add article navigation and compact controls"
```

### Task 6: Category Management Page

**Files:**
- Create: `src/views/admin/taxonomy/TaxonomyDialog.tsx`
- Create: `src/views/admin/taxonomy/CategoryListItem.tsx`
- Create: `src/views/admin/taxonomy/CategoryListView.tsx`
- Create: `src/views/admin/taxonomy/taxonomyPages.css`
- Modify: `src/router/routes.tsx`

**Produces:** `/admin/articles/categories` 真实管理页。

- [ ] **Step 1: 实现页面**

```ts
type CategoryForm = {
  name: string
  description: string
  sortOrder: number
  status: CategoryStatus
}
```

只提供后端支持的状态筛选。占用分类的对话框提供“查看关联文章”，跳转 `/admin/articles?categoryId=<id>`，不发送删除请求。

- [ ] **Step 2: 执行静态检查并提交**

```powershell
npm run typecheck
npx eslint src/views/admin/taxonomy src/router/routes.tsx --max-warnings=0
git add src/views/admin/taxonomy src/router/routes.tsx
git commit -m "Build article category management"
```

### Task 7: Tag Management Page

**Files:**
- Create: `src/views/admin/taxonomy/TagListItem.tsx`
- Create: `src/views/admin/taxonomy/TagListView.tsx`
- Modify: `src/router/routes.tsx`

**Produces:** `/admin/articles/tags` 真实管理页。

- [ ] **Step 1: 实现标签页**

复用 `TaxonomyDialog` 的弹窗骨架和已有列表视觉，但不创建动态万能 CRUD 页面。标签页保留自己的查询状态和文案。

- [ ] **Step 2: 执行静态检查并提交**

```powershell
npm run typecheck
npx eslint src/views/admin/taxonomy src/router/routes.tsx --max-warnings=0
git add src/views/admin/taxonomy/TagListItem.tsx src/views/admin/taxonomy/TagListView.tsx src/router/routes.tsx
git commit -m "Build article tag management"
```

### Task 8: Article List Filters, Metadata, and Row Actions

**Files:**
- Create: `src/views/admin/articles/ArticleListActions.tsx`
- Modify: `src/views/admin/articles/ArticleListFilters.tsx`
- Modify: `src/views/admin/articles/ArticleListItem.tsx`
- Modify: `src/views/admin/articles/ArticleListView.tsx`
- Modify: `src/views/admin/articles/articlePages.css`

**Produces:** 组合筛选、分类信息和单篇真实快捷操作。

- [ ] **Step 1: 实现筛选与操作**

```ts
type ArticleFilters = {
  keyword: string
  status: ArticleStatus | ''
  categoryId: number | null
  tagId: number | null
}
```

更多筛选继续使用原生 `select`。单篇操作成功后依赖 Query 失效刷新，不手改文章缓存。

- [ ] **Step 2: 执行静态检查并提交**

```powershell
npm run typecheck
npx eslint src/views/admin/articles --max-warnings=0
git add src/views/admin/articles/ArticleListActions.tsx src/views/admin/articles/ArticleListFilters.tsx src/views/admin/articles/ArticleListItem.tsx src/views/admin/articles/ArticleListView.tsx src/views/admin/articles/articlePages.css
git commit -m "Extend article list operations"
```

### Task 9: Article Batch Management

**Files:**
- Create: `src/views/admin/articles/ArticleBatchBar.tsx`
- Modify: `src/views/admin/articles/ArticleListItem.tsx`
- Modify: `src/views/admin/articles/ArticleListView.tsx`
- Modify: `src/views/admin/articles/articlePages.css`

**Produces:** 当前页批量选择和真实批量删除。

- [ ] **Step 1: 实现最小状态**

```ts
const [batchMode, setBatchMode] = useState(false)
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
```

每次更新创建新 `Set`；翻页与退出清空。不建立跨页 Zustand store。

- [ ] **Step 2: 执行静态检查并提交**

```powershell
npm run typecheck
npx eslint src/views/admin/articles --max-warnings=0
git add src/views/admin/articles/ArticleBatchBar.tsx src/views/admin/articles/ArticleListItem.tsx src/views/admin/articles/ArticleListView.tsx src/views/admin/articles/articlePages.css
git commit -m "Add article batch deletion"
```

### Task 10: Editor Taxonomy Fields and Quick Create

**Files:**
- Create: `src/views/admin/articles/ArticleTaxonomyFields.tsx`
- Create: `src/views/admin/articles/TaxonomyQuickCreateDialog.tsx`
- Modify: `src/views/admin/articles/ArticleEditorView.tsx`
- Modify: `src/views/admin/articles/articlePages.css`

**Produces:** `categoryId: number | null` 与 `tagIds: number[]` 的真实编辑关联。

- [ ] **Step 1: 实现受控字段**

```ts
type ArticleTaxonomyFieldsProps = {
  categoryId: number | null
  tagIds: number[]
  currentHiddenCategory?: CategoryVO
  onCategoryChange: (categoryId: number | null) => void
  onTagIdsChange: (tagIds: number[]) => void
}
```

使用原生输入过滤和受控列表弹层，不引入选择器依赖。标签按 ID 去重，快捷创建后追加新 ID。

- [ ] **Step 2: 执行静态检查并提交**

```powershell
npm run typecheck
npx eslint src/views/admin/articles --max-warnings=0
git add src/views/admin/articles/ArticleTaxonomyFields.tsx src/views/admin/articles/TaxonomyQuickCreateDialog.tsx src/views/admin/articles/ArticleEditorView.tsx src/views/admin/articles/articlePages.css
git commit -m "Connect article taxonomy fields"
```

### Task 11: Editor Publish Fields and Complete Save Payload

**Files:**
- Create: `src/views/admin/articles/ArticlePublishFields.tsx`
- Modify: `src/views/admin/articles/ArticleEditorView.tsx`
- Modify: `src/views/admin/articles/articlePages.css`

**Produces:** 状态、置顶、推荐和完整文章保存请求。

- [ ] **Step 1: 实现右栏分组和完整保存载荷**

按“文章信息 / 内容关联 / 发布设置”组合。开关复用 Task 5 的 `Switch`，页面只维护表单状态。

保存载荷必须真实包含 `categoryId`、`tagIds`、`status`、`isTop` 和 `isRecommend`，并通过 Task 3 的 API 测试锁定请求契约。

- [ ] **Step 2: 执行静态检查并提交**

```powershell
npm run typecheck
npx eslint src/views/admin/articles --max-warnings=0
git add src/views/admin/articles/ArticlePublishFields.tsx src/views/admin/articles/ArticleEditorView.tsx src/views/admin/articles/articlePages.css
git commit -m "Complete article publishing controls"
```

### Task 12: Automated Quality Gate

**Files:** 只修改由本功能造成失败的文件。

- [ ] **Step 1: 运行定向测试**

```powershell
npm run test:run -- src/api/article.test.ts src/api/taxonomy.test.ts src/queries/article.test.ts src/queries/taxonomy.test.ts
```

- [ ] **Step 2: 运行前端门禁**

```powershell
npm run typecheck
npx eslint src --max-warnings=0
npm run test:run
npm run build
```

Expected: PASS。若全仓库格式检查被无关文件影响，只检查本任务文件。

- [ ] **Step 3: 运行后端门禁**

From `D:/daimai/项目学习/springboot`:

```powershell
.\mvnw.cmd clean test
```

Expected: PASS。

- [ ] **Step 4: 提交必要修正**

先运行 `git diff --name-only`。若门禁没有产生修正，不创建空提交；若产生修正，只对输出中属于本功能的文件逐个执行 `git add -- path/to/file`，再执行：

```powershell
git commit -m "Pass article taxonomy quality gates"
```

### Task 13: Real Backend and Browser Iteration

**Files:**
- Modify: 仅真实浏览器发现问题的前端文件。
- Create: `output/playwright/article-taxonomy-*.png`

**Produces:** 真实后端、真实桌面浏览器下完成的端到端闭环和截图证据。

- [ ] **Step 1: 启动可见后端 cmd**

```powershell
cmd /c start "blog-backend" cmd /k "chcp 65001>nul && cd /d D:\daimai\项目学习\springboot && .\mvnw.cmd spring-boot:run"
```

- [ ] **Step 2: 启动第二个可见前端 cmd**

```powershell
cmd /c start "blog-frontend" cmd /k "chcp 65001>nul && cd /d D:\daimai\项目学习\blog-web && npm run dev"
```

- [ ] **Step 3: 打开真实浏览器，不固定 viewport**

```powershell
npx --yes --package @playwright/cli playwright-cli open http://localhost:5173/admin/articles
```

记录实际 `window.innerWidth` 和 `window.innerHeight`，只作为验收事实，不写回硬编码 CSS。

- [ ] **Step 4: 验证真实流程**

1. 父子导航展开、收起、选中与路由。
2. 分类新建、编辑、隐藏、占用提示和删除。
3. 标签搜索、新建、编辑、占用提示和删除。
4. 组合筛选、状态、置顶和推荐。
5. 当前页批量选择和真实批量删除。
6. 新建文章快捷创建分类标签并保存关联。
7. 编辑文章回填关联、隐藏分类和发布设置。
8. 编辑器块工具、文字工具、表格工具和快捷键抽屉无回归。

- [ ] **Step 5: 按实际窗口逐轮调整**

每轮只修一个明确问题：裁切、溢出、跳动、密度、菜单定位、焦点或错误反馈。优先调整现有 CSS 变量和局部布局，不为截图机械硬编码宽高。

CSS 足够时保持 CSS。只有需要多元素时间线协调且 CSS 明显不可维护时，暂停并单独提议引入 GSAP。

- [ ] **Step 6: 保存最终截图**

- `output/playwright/article-taxonomy-list-final.png`
- `output/playwright/article-category-final.png`
- `output/playwright/article-tag-final.png`
- `output/playwright/article-editor-relations-final.png`
- `output/playwright/article-batch-final.png`

- [ ] **Step 7: 浏览器修正后重跑门禁**

```powershell
npm run typecheck
npx eslint src --max-warnings=0
npm run test:run
npm run build
```

- [ ] **Step 8: 提交真实浏览器结果**

```powershell
git add src output/playwright/article-taxonomy-list-final.png output/playwright/article-category-final.png output/playwright/article-tag-final.png output/playwright/article-editor-relations-final.png output/playwright/article-batch-final.png
git commit -m "Polish article taxonomy workspace"
```

### Task 14: Final Documentation and Maintainability Audit

**Files:**
- Modify: `docs/前端设计目录/分类标签UI/2026-07-11-文章运营工作台分类标签UI设计.md`
- Modify only when user requests handoff: `docs/handoff/YYYY-MM-DD.md`

- [ ] **Step 1: 更新现有设计文档**

追加实现结果、真实浏览器尺寸事实、接口闭环、截图路径、测试命令和结果，不新建第二份设计文档。

- [ ] **Step 2: 检查文件职责和规模**

```powershell
Get-ChildItem src\views\admin\articles,src\views\admin\taxonomy,src\components\ui,src\components\admin -File | Select-Object Name,@{Name='Lines';Expression={(Get-Content $_.FullName).Count}} | Sort-Object Lines -Descending
```

只在文件承担多个清晰职责时拆分，不为了任意行数制造碎片文件。

- [ ] **Step 3: 检查空壳与临时代码**

```powershell
rg -n "TODO|TBD|mock data|假数据|临时实现|console\.log|setTimeout\(" src docs/前端设计目录/分类标签UI
```

Expected: 没有未完成业务路径或模拟成功逻辑。

- [ ] **Step 4: 提交文档**

```powershell
git add docs/前端设计目录/分类标签UI/2026-07-11-文章运营工作台分类标签UI设计.md
git commit -m "Document article taxonomy delivery"
```

## Plan Self-Review

- Spec coverage: 导航、管理页、编辑关联、快捷创建、发布设置、组合筛选、单篇操作、批量删除、错误、缓存、真实浏览器和真实后端均有任务。
- Backend contract: 文章分页保持紧凑响应并支持 `tagId` 筛选，文章详情真实返回标签集合用于编辑回填。
- Type consistency: 保存使用 `categoryId`、`tagIds`、`isTop`、`isRecommend`；列表筛选使用单数 `tagId`；详情返回 `tags: TagVO[]`。
- Ponytail result: 不安装 GSAP、不建万能 CRUD 框架、不建跨页选择 store、不造第二套弹窗系统、不增加前端 N+1 详情请求、不制作虚构分页和排序 UI。
