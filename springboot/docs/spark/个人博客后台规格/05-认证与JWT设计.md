# 05-认证与JWT设计

## 认证目标

登录验证是管理员模块下的一个功能，用于后台登录、JWT 签发、JWT 校验、退出登录、当前管理员信息获取、Token 有效性校验和 Token 刷新。

本项目是单人后台，不做公开多人注册，也不做管理员初始化注册接口。

管理员数据由你手动入库，后端只负责校验已有管理员账号。

管理员模块不提供“管理员列表分页查询”这类接口。

后台始终只有一个管理员，管理员查询统一使用“当前管理员信息”接口，管理员资料维护只负责修改姓名、头像和密码。

## 模块划分

登录、JWT 签发、JWT 校验、退出登录、当前管理员信息获取、Token 有效性校验和 Token 刷新都归入管理员模块，不单独划分独立模块。

管理员资料维护也是管理员模块下的资料功能，只保留修改资料和修改密码，不单独提供与当前管理员信息重复的资料查询接口。

`AdminController` 使用统一前缀 `/api/admin`，登录和 Token 相关动作作为管理员接口方法存在；当前管理员查询使用 `GET /api/admin/profile`；管理员资料维护接口只维护当前库里已有的姓名、头像、密码字段，`role` 作为展示字段保留，不展开权限系统设计。

## JWT 依赖设计

JWT 组件统一使用 JJWT 官方拆分依赖，不使用旧的单包 `io.jsonwebtoken:jjwt` 写法。

多模块后，JJWT 版本统一放在根 `pom.xml` 的 `dependencyManagement` 中管理。

实际依赖放在提供 JWT 工具类和认证能力的模块中，优先由 `springboot-admin` 声明；如果 `JwtUtils` 被上沉到 `springboot-common`，则由 `springboot-common` 声明。

Maven 依赖坐标按下面配置：

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.13.0</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.13.0</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.13.0</version>
    <scope>runtime</scope>
</dependency>
```

说明：

- `jjwt-api` 作为编译期依赖。
- `jjwt-impl` 和 `jjwt-jackson` 按官方建议使用 `runtime` 作用域。
- 项目是 Spring Boot 服务端，默认使用 Jackson，因此 JSON 扩展选 `jjwt-jackson`，不选 `jjwt-gson`。

## 敏感配置规则

- 仓库中的 `application.yml` 只保存配置结构和环境变量占位符，不保存数据库口令或 JWT 密钥。
- 本地开发可以使用被 `.gitignore` 排除的 `application-local.yml` 覆盖敏感值。
- 仓库提交 `application-local.example.yml` 说明本地配置字段，示例文件中的敏感值保持为空。

## 管理员数据规则

- 第一版不提供管理员注册接口。
- 管理员记录由你手动写入数据库。
- 系统仍按单人后台处理，`admin` 表只保留一个管理员账号。
- 当前学习库里的 `admin` 表字段为 `id`、`username`、`password`、`name`、`role`、`avatar`、`password_version`。
- 用户名作为登录账号使用，项目按单管理员场景维护，不额外扩展 `nickname`、`intro`、`email` 等资料字段。
- 密码不能明文存储，手动入库时也必须写入加密后的密码。
- `password_version` 必填，默认值建议为 `1`。
- 如果已有管理员数据没有 `password_version`，需要补字段并把现有记录初始化为 `1`。

## 登录规则

- 登录参数包含用户名和密码。
- 登录成功后返回 JWT 和基础管理员信息。
- 登录失败时统一提示“用户名或密码错误”。
- 不返回具体是用户名不存在还是密码错误。
- 登录接口不返回密码。

## JWT 内容

JWT 只放必要信息：

```text
管理员 ID
用户名
密码版本号
签发时间
过期时间
```

JWT 不放：

```text
密码
姓名
角色
头像
完整管理员对象
```

## 请求头规则

后台接口使用请求头传 Token：

```text
Authorization: Bearer <token>
```

除登录接口外，所有后台接口默认需要 JWT。

## Token 过期规则

- Token 需要设置过期时间。
- Token 过期后返回未登录或登录失效。
- 前端收到登录失效后跳转登录页。

## Token 校验与刷新规则

- 校验 Token 接口只用于确认当前 Token 是否仍有效。
- 校验 Token 接口能访问成功时返回 `valid=true`。
- 无效、过期、签名错误或密码版本不一致的 Token 由 JWT 拦截器统一拦截。
- 刷新 Token 接口要求旧 Token 仍然有效。
- 刷新成功后返回新 Token，不修改数据库。
- 如果旧 Token 已过期或已因密码修改失效，不能刷新。

## 修改密码后的失效规则

管理员表需要增加 `password_version` 字段。

JWT 中写入登录时的 `password_version`。

修改密码成功后，数据库中的 `password_version` 加 1。

后续请求校验 JWT 时，如果 Token 中的版本号和数据库当前版本号不一致，则判定旧 Token 失效。

## 密码规则

- 密码不允许明文入库。
- 使用 `PasswordUtils` 封装密码加密和校验。
- 数据库只保存加密后的密码。
- 修改密码时必须校验旧密码。

## 拦截器规则

建议增加：

```text
interceptor/AuthInterceptor
config/WebMvcConfig
utils/JwtUtils
```

拦截流程：

```text
请求进入
-> 判断是否是白名单接口
-> 读取 Authorization 请求头
-> 校验 Bearer 格式
-> 校验 JWT 签名和过期时间
-> 校验管理员是否存在
-> 校验 password_version 是否一致
-> 放行请求
```

白名单：

```text
登录接口
Swagger 文档
静态资源访问
```

## 返回对象

管理员相关接口统一返回 `AdminVO`。

登录成功时 `AdminVO` 直接包含：

```text
id
username
name
role
avatar
token
```

当前阶段不再单独设计登录专用 VO 或管理员信息专用 VO。

```text
登录返回对象直接平铺上述字段；当前管理员和修改资料后的响应复用 `AdminVO`，不设置 `token` 字段。
```

不包含 `password`。
