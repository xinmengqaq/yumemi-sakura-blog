# 个人博客学习项目

这是一个以个人博客为载体，学习和实践 Java 后端、前端工程与 Python 智能体方向的项目。

当前前台仍使用旧名称 **春日轨迹**，用于表达文字、风景和日常记录的内容气质。这个名称后续会调整，暂不代表项目最终名称或品牌定位。

项目的重点不是快速做出一个固定产品，而是在持续变化的实践中学习如何设计、实现和维护一套完整应用。

## 项目定位

这是我的个人学习项目，主要用来学习和实践：

- Java 后端开发，以及 Spring Boot 相关工程能力。
- Python 智能体的设计、工具调用和任务编排方向。
- 前后端协作、工程组织、测试和持续迭代。

其中，`springboot/` 和 `blog-web/` 是当前公开的学习工程。Python 智能体方向仍在学习和整理中，后续是否纳入仓库会根据实践进度决定。

## 当前状态

项目仍在开发和学习阶段，尚未完成，也没有固定的最终功能范围。技术选型、页面表达、目录结构和实现方向都可能随时调整。

这里的代码主要服务于学习、实验和记录，不代表稳定产品，也不承诺接口或配置长期兼容。

## 仓库目录

- `springboot/`：Java 后端学习工程。
- `blog-web/`：当前使用“春日轨迹”旧名称的前台及配套 Web 工程，后续会随项目改名调整。

## 本地启动

### 环境要求

- JDK 21
- Maven
- Node.js 和 npm
- PostgreSQL

### 1. 准备后端配置

进入 `springboot/`，复制后端配置示例并填写本地数据库和 JWT 配置：

```powershell
Copy-Item springboot-web/src/main/resources/application-local.example.yml springboot-web/src/main/resources/application-local.yml
```

`application-local.yml` 已被 Git 忽略，不要提交其中的真实口令或密钥。

### 2. 启动后端

在 `springboot/` 目录执行：

```powershell
mvn -pl springboot-web -am spring-boot:run
```

后端默认使用 `9090` 端口。

### 3. 启动前端

另开终端进入 `blog-web/`，复制前端环境变量示例并安装依赖：

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Vite 开发服务器默认使用 `5173` 端口，并将 `/api` 请求代理到本地后端 `9090` 端口。

### 4. 访问项目

启动前后端后，在浏览器打开：

```text
http://localhost:5173
```

本仓库只提交不含敏感值的示例配置。真实环境变量、本地数据库配置、密钥和构建产物不会提交到 GitHub。
