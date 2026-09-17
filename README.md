# AriaNg

AriaNg 是一个让 [aria2](https://github.com/aria2/aria2) 更易用的现代 Web 前端。

> 当前仓库为 **Vite + React + TypeScript** 重写版本；原 AngularJS 实现保存在 [`legacy/`](./legacy) 中，可独立构建。

## 目录结构

| 路径                      | 说明                                                                        |
| ------------------------- | --------------------------------------------------------------------------- |
| 根目录                    | 新版前端（Vite + React 19 + TypeScript + Tailwind CSS + Zustand + i18next） |
| `legacy/`                 | 原 AngularJS 版本，归档并保持可独立构建                                     |
| `PLAN.md`                 | 重写计划与阶段划分（阶段 0–5 已完成）                                       |
| `tools/convert-langs.mjs` | 由 legacy 翻译文件生成新版 i18n 资源                                        |

## 环境要求

Node.js `>= 20`。

## 开发与构建

```bash
npm install

npm run dev          # 开发服务器（默认 http://localhost:9000）
npm run build        # 类型检查并构建到 dist/
npm run preview      # 预览构建产物
npm run typecheck    # 仅类型检查
npm run lint         # ESLint
npm run format       # Prettier 格式化
npm run format:check # 校验格式（不写入）
npm run test         # Vitest 单元测试
npm run convert-langs # 由 legacy 语言文件重新生成 src/locales/*/translation.json
```

### 代码格式化

格式化由 Prettier 负责，配置见 [`prettier.config.mjs`](./prettier.config.mjs)，忽略规则见 [`.prettierignore`](./.prettierignore)：

- 覆盖：`src/**`（不含 `src/locales`）、`vite.config.ts`、`eslint.config.js`、`tools/**`、根 `*.md` / `*.json`、`index.html`、`public/manifest.json`
- 忽略：`legacy/**`（归档代码）、`dist/**`、`node_modules/**`、`src/locales/**`（由 `convert-langs` 生成）、`package-lock.json`
- 风格：4 空格缩进（JSON / Markdown / YAML 为 2）、单引号、保留分号、`printWidth` 120、`trailingComma: all`
- ESLint 通过 `eslint-config-prettier` 关闭与 Prettier 冲突的规则

CI 的 `build-web` 任务会执行 `npm run format:check`。

### 版本信息

构建时会注入 `buildVersion`（取自 `package.json` 的 `version`）与 `buildCommit`（`git rev-parse --short HEAD`），并展示在「AriaNg 设置」页底部。

## 部署

- `dist/` 为纯静态资源，可直接部署到任意静态服务器。
- 路由使用 Hash 模式，服务端无需额外 rewrite 配置。
- 若部署在子路径下，请在 `vite.config.ts` 中设置 `base` 为对应子路径。
- 构建产物包含 `manifest.json` 与 PWA 图标，浏览器可将应用「安装」为 PWA；同时通过 `protocol_handlers` 注册 `magnet:` 协议（需 HTTPS 或 localhost）。
- manifest 仅声明**不透明的 8-bit PNG 图标**（144/192/512），不提供 SVG 图标；`purpose` 的 `any` 与 `maskable` 分开声明。这是为了兼容 **Firefox for Android** 的「添加到主屏幕」：它不识别 manifest 中的 SVG 图标，且对 `any maskable` 组合与带透明通道的 16-bit PNG 支持不稳定。`<link rel="manifest">` 也不使用 `crossorigin`，避免 Firefox 因凭证请求而获取 manifest 失败。
- **不注册 Service Worker，不提供离线缓存**；离线时仅受浏览器普通 HTTP 缓存影响。
- 兼容旧版 URL 命令（`#!/...` 会在启动时重写为 `#/...`），包括 `#!/new/:url` 与 `#!/settings/rpc/set/...`。

## CI 与发布

- [`.circleci/config.yml`](./.circleci/config.yml)：`build-web`（typecheck / lint / test / build）、`build-legacy`、`publish_daily_build`。
- [`scripts/publish_dailybuild.sh`](./scripts/publish_dailybuild.sh)：将 `dist/` 发布到每日构建仓库（需配置写权限部署密钥）。

## legacy 版本（AngularJS）

`legacy/` 保留重写前的完整实现，可独立安装与构建：

```bash
cd legacy
npm install

npm run build               # 标准版，输出到 legacy/dist
npx gulp clean build-bundle # all-in-one 单文件版
```

构建需要 Node.js（原项目要求 `>= 14`）。

## 文档与演示

1. [English](http://ariang.mayswind.net)
2. [Simplified Chinese (简体中文)](http://ariang.mayswind.net/zh_Hans)

## License

[MIT](./LICENSE)
