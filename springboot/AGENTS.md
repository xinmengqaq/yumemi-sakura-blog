# Repository Guidelines

## Project Structure & Module Organization
项目为 Java 21 的 Spring Boot 单体服务，主代码在 `src/main/java/com/xinmengqaq/springboot`。按三层结构组织：`controller -> service -> service/impl -> mapper`，并配套 `entity`、`dto`、`vo`、`common`、`config`、`interceptor`、`utils`。MyBatis XML 放在 `src/main/resources/mapper`，运行配置在 `src/main/resources/application.yml`。需求与设计文档集中在 `docs/spark/个人博客后台规格/`，改功能前先对齐对应规格。

## Build, Test, and Development Commands
使用 Maven Wrapper 优先：

- `./mvnw spring-boot:run`：本地启动服务，默认读取 `application.yml`，端口 `9090`。
- `./mvnw clean test`：执行单元测试与集成测试。
- `./mvnw clean package`：完整构建，可产出可运行 jar。
- `./mvnw dependency:tree`：排查依赖冲突，尤其是 Spring Data JPA 与 MyBatis 并存阶段。

Windows PowerShell 下可用 `.\mvnw.cmd` 代替。

## Coding Style & Naming Conventions
统一使用 UTF-8、4 空格缩进、`com.xinmengqaq.springboot` 包前缀。Controller 只做参数接收和结果返回；业务编排放 `ServiceImpl`；Mapper 只负责数据访问，不写业务判断。后端编码统一遵循国内后台常见维护习惯：同一逻辑出现 2 次及以上才抽取复用、动态按需、安全防注入、明确不偷懒、结果要确定、优雅不硬编码、命名即文档、层层做防御、事务保一致、统一规范；落实到 Java、MyBatis XML、接口返回、异常、日志和事务中，避免重复逻辑、无意义字段、随机排序、直接拼接用户输入、返回多余数据、散落硬编码和半完成数据状态。MyBatis XML 中重复出现的真实字段列优先抽成 `<sql>` 片段并通过 `<include>` 复用，例如列表查询的 `select` 和 `group by` 共用同一组字段；字段片段只放数据库真实字段，不放 `count(...)`、`case when ...` 或带业务别名的计算字段，避免复用到 `group by` 时污染 SQL。类名使用 PascalCase，如 `AdminController`、`PageQueryDTO`；方法和字段用 camelCase；DTO/VO/Entity 后缀要准确，不要混用。代码实现中可以在合适位置使用 Java 合适的存储类型，也可以适当使用 Stream 流、工厂方法和 Java 自带 API 库优雅解决问题，绝不手动自研繁琐代码或重复造轮子。

## Testing Guidelines
测试框架为 `spring-boot-starter-test`、JUnit 5、MyBatis Test、H2。新增测试放 `src/test/java`，包结构与生产代码保持一致，命名使用 `*Test`，例如 `AdminServiceImplTest`。Service 层优先覆盖业务分支，Mapper 层优先验证 SQL 与分页行为。提交前至少运行 `./mvnw clean test`。

## Commit & Pull Request Guidelines
现有提交信息以简短中文为主，如 `管理员脚手架`、`规格文档更新`。继续保持“一次提交只做一类改动”，标题直接描述结果，避免空泛词。PR 需要说明变更目的、影响模块、测试结果；接口或页面行为变更应附请求示例、响应示例或截图；若修改规格，实现与 `docs/spark/个人博客后台规格/` 中对应文档保持同步。

## Security & Configuration Tips
`application.yml` 当前包含本地数据库连接信息。提交前避免引入真实密钥、生产库地址或个人账号口令；新增配置优先走环境区分或本地覆盖方案，不要把敏感信息写死在默认配置里。

## Learning Task Guidance

本项目用于学习时，拆任务和讲解前必须重新检索项目现状，不能依赖上一轮记忆，也不能只看 Java 代码。要从全局视角同时联系 `pom.xml`、`application.yml`、`logback-spring.xml`、`src/main/resources/mapper`、`src/test/java`、现有 Java 分层代码以及 `docs/spark/个人博客后台规格/` 中的对应规格，至少确认：当前文件是否已经存在、当前代码是否已经写过、依赖是否已经加过、配置是否已经存在、文档方向是否和代码一致。不能重复安排已经完成的内容。

一次只拆一个小任务，只按当前阶段和真实项目进度推进，不提前展开后续阶段完整设计。小任务必须是一个能形成理解闭环或功能闭环的学习单元，不能把一个方法、一行配置、一个字段这种孤立小修改包装成“小任务”；如果某个改动只是前置零件，应并入同一个主题下的完整任务里讲。当前阶段如果已经限定为“第二阶段：认证与管理员模块”，就只围绕该阶段推进，禁止提前带入文章、分类、评论、相册等后续模块。该阶段的讲解顺序优先按“先数据结构，再 Service 能力，再工具类，再密码校验，再 Controller，再拦截器”推进，除非对应规格已经明确要求调整顺序。

讲解输出必须按教学方式展开，不能只给简短结论或只贴完整示例代码。每次讲解至少包含：本次任务要完成什么功能、为什么现在做这个任务、用户完成后项目会多出什么能力、本次请求从入口到数据库或返回结果的执行流程、涉及哪些文件和每个文件承担什么职责、需要新增或修改哪些代码、代码关键行为什么这样写、写完后如何自查或验证。新建文件给完整示例；已有文件修改只说明行号附近怎么增删改，只给必要片段，不整文件重复输出。导包只说明类来自哪里，不逐行展开 `import`。

讲解结构优先使用：先说明“本次任务目标”，再画清“功能流程”，再列“涉及文件”，再给“代码片段”，最后讲“新增概念和注意点”。代码片段不能脱离业务流程孤立出现；如果先给代码，也必须紧跟说明这段代码在流程中的位置、由谁调用、调用后返回什么、失败时怎么处理。讲解要像教学，不要像提交摘要。

讲解只讲本次新增点，已经讲过的概念不重复讲。继续讲解前先读取 `docs/spark/个人博客后台规格/10-已讲解概念记录.md`，先判断这次内容里哪些概念已经讲过，哪些是本次第一次出现的新概念。

如果本次出现记录文件里没有的新概念，必须在本次讲解里单独讲清楚，不能一笔带过。至少讲明白：这个概念是什么、解决什么问题、为什么此时引入、放在哪一层或哪个文件、会调用什么方法或注解、关键参数和返回值是什么、不该怎么用、和当前任务的关系是什么。先把新概念讲明白，再继续后面的任务说明。

如果本次出现了新的可复用概念，那么在本次讲解结束后，必须立刻同步更新 `docs/spark/个人博客后台规格/10-已讲解概念记录.md`，把新概念用精炼语言追加进去；不能等下次再补，也不能漏记。只有在确认本次没有新增概念时，才可以不更新该文件。默认沿用国内 Spring Boot 后台常见分层：Entity 对数据库，DTO 接请求，VO 回响应，Mapper 查数据库，Service 写业务，Controller 做接口入口。登录失败统一返回“用户名或密码错误”，不要暴露“用户不存在”。

加依赖前先查 `pom.xml`，已有依赖不重复加；Spring Boot 父工程已管理版本时不手写版本号。只需要 BCrypt 时使用 `spring-security-crypto`，不要引入完整 `spring-boot-starter-security` 干扰当前 JWT 学习路线。

业务日志使用 `@Slf4j`，放在 Controller、Service、全局异常处理等业务位置；MyBatis SQL 日志继续走 `mybatis.configuration.log-impl` 的 `StdOutImpl`，不写在 `Mapper.xml`，也不由 Logback 接管。任何日志都不能输出密码、Token、数据库口令等敏感信息。

用户是在做学习项目时，不走 BDD/TDD；没有明确要求时，不私自修改代码，不私自验证，只讲下一步怎么做。只有用户明确说“修改、整理、改文件”时，才动手。
