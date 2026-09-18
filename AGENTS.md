# AGENTS.md

## 项目概览

AriaNg 是一个让 [aria2](https://github.com/aria2/aria2) 更易用的现代 Web 前端。

当前仓库为 **Vite + React 19 + TypeScript + Tailwind CSS 4** 重写版本（v2.0）：路由使用 Hash 模式，产物为纯静态资源，无需服务端 rewrite。原 AngularJS 实现归档在 `legacy/`，可独立构建；除语言源文件外不要修改 `legacy/`。

技术栈：React 19、TypeScript 5、Tailwind CSS 4、zustand、react-router-dom 7、react-i18next、lucide-react、@dnd-kit、recharts、vitest。

## 环境与命令

Node.js `>= 20`，包管理器使用 npm（仓库包含 `package-lock.json`）。开发服务器默认 `http://localhost:9000`。

| 命令                    | 说明                                          |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | 开发服务器                                    |
| `npm run build`         | `tsc --noEmit` + `vite build`，产物在 `dist/` |
| `npm run preview`       | 预览构建产物                                  |
| `npm run typecheck`     | 仅类型检查                                    |
| `npm run lint`          | ESLint                                        |
| `npm test`              | Vitest 单元测试（jsdom）                      |
| `npm test:watch`        | Vitest watch 模式                             |
| `npm run format`        | Prettier 写入                                 |
| `npm run format:check`  | Prettier 校验（CI 使用）                      |
| `npm run convert-langs` | 由 legacy 语言文件重新生成 `src/locales/**`   |

### 完成标准

- 任何改动在完成前必须通过：`npm run lint && npm run typecheck && npm test`。
- 涉及构建配置、依赖或入口的改动，额外运行 `npm run build`。
- 修改 UI 行为时同步更新或新增测试（测试文件与源码同目录，`*.test.ts(x)`）。
- 纯视觉/交互效果（canvas、响应式布局等）无法被 jsdom 覆盖时，建议在 `npm run dev` 下用浏览器实际验证。

## 源码结构

```
src/
  App.tsx  main.tsx            # 路由入口（HashRouter）
  styles/index.css             # Tailwind 入口、主题变量、dark 变体声明
  styles/components.css        # 公共组件样式类（btn/card/chip/input 等，@layer components）
  components/                  # 通用组件（AppLayout、工具栏、OptionForm、PieceBar/PieceMap 等）
  features/                    # 按功能划分：task-list / new-task / task-detail / settings / status / debug / command
  hooks/                       # useAria2（轮询/主题/标题/快捷键）、useScrollRestoration、useMediaQuery 等
  services/                    # rpc/（http、websocket、index）、taskService、aria2SettingService、settingService、notification、log、monitor
  stores/                      # zustand：settingStore、taskStore、taskDetailStore、rpcDraftStore
  config/                      # constants、aria2Options、aria2OptionGroups、fileTypes、languages、aria2Errors
  types/aria2.ts               # 共享领域类型（Aria2Task/File/Peer、TaskResponse 等）
  utils/                       # common、format、task、peerId、fileIcon、clipboard、navigation、file
  i18n/                        # i18next 初始化与资源按需加载
  locales/                     # 生成产物（见 i18n 流程），不要手改
legacy/                        # 原 AngularJS 版本（归档）
tools/convert-langs.mjs        # 语言 txt -> i18next JSON 转换脚本
```

## 架构要点

- **路由**：`src/App.tsx` 集中定义（HashRouter）。兼容旧式 `#!/` 路径与 `#!/new/:url`、`#!/settings/rpc/set/...` 命令行链接。
- **全局布局**：`src/components/AppLayout.tsx`。
  - 顶栏/底栏内容按路由映射：`headerContentByPattern` / `footerContentByPattern` + `matchPath`（任务列表 → `TaskListToolbar`；`/task/detail/:gid` → `TaskDetailToolbar`；`/settings/*` → `SettingsToolbar`；未命中则隐藏）。
  - 新增需要顶栏/底栏的页面时，在映射表中追加 `pattern` 即可。
  - 主滚动容器是 `<main data-scroll-container>`；`useScrollRestoration` 依赖该属性（列表页返回时恢复滚动位置）。
- **响应式**：断点使用 Tailwind 默认（`sm` 640、`lg` 1024 等）。桌面与移动端布局差异明显：移动端设置页为分级列表（`features/settings/` 中的 `SettingsMenu`、`RpcSettingsMenu`），其中下拉类设置项渲染为与根菜单一致的入口条目，点击进入选项子页（`OptionChoiceList`，选择后停留并显示选中态），布尔设置项统一用 `Switch` 开关（所有尺寸）；桌面保留页签 + 下拉布局。设置页层级路由为 `/settings/aria2/:type/:sub/:item`（RPC 字段子页多一段 `/:field`），标题与返回目标由 `SettingsToolbar` 的 `resolveSettingsLocation` 解析。改设置页时需考虑两套布局。
- **状态**：zustand。`settingStore`（`AriaNgOptions`，持久化 localStorage）、`taskStore`（任务列表、选中、RPC 状态、全局统计）、`taskDetailStore`（当前详情任务标题，由 `useTaskDetail` 写入，供 `TaskDetailToolbar` 展示）、`rpcDraftStore`（RPC 编辑草稿，按 `item` 键控，编辑页与字段子页共享，保存/移除后清理）。
- **服务层**：`services/rpc/` 提供 HTTP/WebSocket 双传输（Promise + mitt 事件）；RPC 连接在模块加载时根据当前设置创建，**切换默认 RPC 后需要重载页面生效**（统一使用 `@/utils/navigation` 的 `reloadPage()`）。
- **设置表单**：数据驱动。Aria2 选项定义在 `config/aria2Options.ts`（桌面由 `components/OptionForm.tsx` 渲染；移动端为 `features/settings/Aria2OptionItemList.tsx` + 选项子页），AriaNg 设置项定义在 `features/settings/ariaNgSettingItems.ts`，避免逐项硬编码。
- **分片可视化**：`PieceBar`（条状，canvas）与 `PieceMap`（方块图，canvas，监听父容器尺寸变化）。
- **主题**：`useTheme` 切换 `body.theme-dark` class，Tailwind dark 变体在 `styles/index.css` 中通过 `@custom-variant dark (&:where(.theme-dark, .theme-dark *))` 声明。

## i18n 流程（重要）

1. 语言源文件在 `legacy/`：`legacy/i18n/en.sample.txt`（英文基准）与 `legacy/src/langs/<lang>.txt`（各语言）。
2. 运行 `npm run convert-langs` 生成 `src/locales/<lang>/translation.json`（脚本会重建整个 locales 目录）。
3. **不要直接编辑 `src/locales/**`**（生成产物，Prettier 也忽略该目录）。
4. key 即英文原句（`keySeparator:false`），代码中统一 `t('English phrase')`；新增文案时先在 legacy 语言文件中添加 `Key=译文`，再运行转换脚本。
5. 各语言文件的行结构大体对齐；修改 legacy 语言文件时保持 `Key=Value` 格式与 LF 换行。

## 代码约定

- 格式由 Prettier 负责（`prettier.config.mjs`）：4 空格缩进、单引号、保留分号、`printWidth` 120、`trailingComma: all`；`legacy/`、`src/locales/`、`dist/` 被忽略。
- 不添加注释（除非确有必要说明非直观逻辑）。
- 组件为函数组件 + hooks；图标统一来自 `lucide-react`。
- 不要在 JS 字符串中使用 HTML 实体（如 `'&#9654;'` 不会被解码、会按字面显示）；需要符号时使用图标组件。
- 样式优先引用 `src/styles/components.css` 中的公共组件类（`btn`/`card`/`chip`/`input`/`toolbar-btn` 等），其余使用 Tailwind 工具类（含 `dark:` 变体）；主题色用 `@theme` 中的 `primary` 等变量，不要硬编码色值；新增公共样式加到 `components.css`。
- 路径别名：`@` → `src`。

## 测试约定

- vitest + jsdom + `@testing-library/react`；测试与源码同目录（`src/**/*.test.ts(x)`）。
- jsdom 的限制与对策：
  - 无 Canvas 实现（`getContext` 返回 null），canvas 组件只能断言 DOM 存在。
  - 无真实布局与滚动高度，滚动恢复等逻辑需用模拟容器测试。
  - `window.matchMedia` 需手动 stub（参考 `src/App.test.tsx` 的 `stubMatchMedia`）。
  - `window.location.reload` 不可 mock，页面重载统一走 `@/utils/navigation` 的 `reloadPage()`，测试中通过 `vi.mock` 替换。
- 认证/网络请求在测试中通常被 `fetch` stub 挂起，断言应基于渲染结果而非网络返回。

## 浏览器验证建议

jsdom 无法覆盖视觉效果时，可在 `npm run dev` 后用无头浏览器（Edge/Chrome `--headless=new` + CDP）验证：

- 通过 `Runtime.evaluate` 动态 `import('/src/...')` 渲染组件并对页面截图（适用于 canvas、响应式布局）。
- 在真实页面中 `import('/src/stores/taskStore.ts')` 后 `useTaskStore.setState({ tasks: [...] })` 注入 mock 数据，验证任务卡片等交互。
- 用 `Emulation.setDeviceMetricsOverride` 切换视口宽度验证响应式断点。

## 注意事项与已知坑

- `src/locales/**`、`dist/**` 为生成/构建产物，不要手工修改。
- `legacy/**` 为归档实现；转换脚本会读取其中的语言文件，其余内容保持不变。
- 版本信息通过 Vite `define` 注入（`__APP_VERSION__`、`__APP_COMMIT__`），经 `services/version.ts` 读取。
- 应用不注册 Service Worker、不做离线缓存（`public/manifest.json` 仅提供 PWA 元数据与 magnet 协议注册）。
- PLAN.md 记录重写阶段与决策，可作为历史背景参考。
