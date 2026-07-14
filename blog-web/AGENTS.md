# 仓库指南

## 项目结构与模块组织

本仓库是个人博客系统前端工程，技术栈为 React + TypeScript + Vite。源码放在 `src/`。

- `src/api/`：后端接口封装，页面禁止直接调用 Axios。
- `src/utils/`：通用工具，例如 `request.ts`、`storage.ts`。
- `src/types/`：接口响应、请求参数和业务类型。
- `src/store/`：Zustand 客户端状态，目前主要保存登录态。
- `src/queries/`：TanStack Query 查询和变更封装。
- `src/router/`：路由表、路由守卫和路由工具。
- `src/layout/`：前台、后台和空白布局。
- `src/views/`：路由页面，按 `front/`、`admin/`、`error/` 分区。
- `src/styles/`：全局样式、变量和 reset。
- `src/test/`：Vitest 测试初始化和辅助文件。
- `docs/spark/`：工程规格和设计文档，功能变更前先检查相关规范。
- `docs/handoff/`：会话交接记录，用户要求“交接下一个会话”时按日期写入。

## 构建、测试与开发命令

统一使用 npm，必须提交 `package-lock.json`。

- `npm run dev`：启动 Vite 本地开发服务。
- `npm run build`：执行 TypeScript 构建检查并生成 `dist/`。
- `npm run preview`：本地预览生产构建结果。
- `npm run typecheck`：只做 TypeScript 类型检查。
- `npm run lint`：执行 ESLint。
- `npm run test:run`：单次运行 Vitest。
- `npm run format`：用 Prettier 格式化代码。
- `npm run format:check`：检查格式是否符合 Prettier。

## 编码风格与命名规范

启用 TypeScript strict 模式，业务代码不要随意使用 `any`。格式交给 Prettier：不使用分号、单引号、保留尾随逗号。React 组件和页面文件使用 PascalCase，例如 `LoginView.tsx`。工具文件使用 camelCase，例如 `request.ts`。接口函数命名要表达动作，例如 `login()`、`logout()`。

## 测试规范

测试使用 Vitest、jsdom 和 Testing Library。测试文件优先和被测文件放在同目录，例如 `src/utils/storage.test.ts`。优先覆盖请求流转、Token 携带、登录态清理、路由守卫和错误处理。不测试颜色、间距、阴影等纯视觉细节。

## 会话交接规范

当用户明确要求“交接下一个会话”时，在 `docs/handoff/` 下维护当天交接 Markdown，文件名使用 `YYYY-MM-DD.md`。如果当天文件已存在，追加新的交接段落；如果已经是第二天，就新建新的日期文件。

交接内容要帮助下一个 Codex 快速恢复上下文，同时控制读取 token：只写关键事实，不复述完整聊天记录，不粘贴大段代码或命令输出。内容应包含当前分支、已完成事项、关键提交、验证结果、剩余未完成事项、重要约束和需要特别避免重复处理的工作。

交接文档使用中文，结构保持简短清晰。除非用户要求，不把本地工具缓存、临时目录、无关未跟踪文件写成待办。

## 提交与 Pull Request 规范

当前仓库没有 Git 历史可归纳，提交信息建议使用简短祈使句，例如 `Add auth store tests`、`Wire Vite API proxy`。PR 需要说明改动范围、关键文件、验证命令结果；涉及 UI 时附截图；正式交付前至少通过 `typecheck`、`lint`、`test:run`、`build`。

## 安全与配置提示

前端环境变量必须以 `VITE_` 开头。不要把数据库密码、JWT 密钥、管理员密码等敏感信息写入 `.env`。前端请求统一使用 `/api/...`，由 Vite 代理到 Spring Boot 后端 `http://localhost:9090`。
