# AGENTS.md

## 项目概览

AriaNg 是一个让 [aria2](https://github.com/aria2/aria2) 更易用的现代 Web 前端。

当前仓库为 **Vite + React 19 + TypeScript + Tailwind CSS 4** 重写版本（v2.0）：路由使用 Hash 模式，产物为纯静态资源，无需服务端 rewrite。原 AngularJS 实现归档在 `legacy/`，可独立构建；除语言源文件外不要修改 `legacy/`。

技术栈：React 19、TypeScript 7（原生 `tsc` 做类型检查；ESLint 走 TypeScript 6 API，见"注意事项"）、Tailwind CSS 4、zustand、react-router-dom 7、react-i18next、lucide-react、@dnd-kit、recharts、vitest。

## 环境与命令

Node.js `>= 20`，包管理器使用 npm（仓库包含 `package-lock.json`）。开发服务器默认 `http://localhost:9000`。

| 命令                    | 说明                                                      |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | 开发服务器                                                |
| `npm run build`         | `tsc --noEmit`（TS 7 原生）+ `vite build`，产物在 `dist/` |
| `npm run preview`       | 预览构建产物                                              |
| `npm run typecheck`     | 仅类型检查（TS 7 原生 `tsc`）                             |
| `npm run lint`          | ESLint                                                    |
| `npm test`              | Vitest 单元测试（jsdom）                                  |
| `npm test:watch`        | Vitest watch 模式                                         |
| `npm run format`        | Prettier 写入                                             |
| `npm run format:check`  | Prettier 校验（CI 使用）                                  |
| `npm run convert-langs` | 由 legacy 语言文件重新生成 `src/locales/**`               |

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
  components/                  # 通用组件（AppLayout、PanelBar、TopBarTabs、BottomBarButton、工具栏、settings/ 通用设置组件、PieceBar/PieceMap 等）
  features/                    # 按功能划分：home / task-list / new-task / task-detail / settings / status / debug / command
  hooks/                       # useAria2（轮询/主题/标题/快捷键）、useScrollRestoration、useTaskDetail 等
  services/                    # rpc/（http、websocket、index）、taskService、aria2SettingService、settingService、notification、log、monitor
  stores/                      # zustand：settingStore、taskStore、taskDetailStore、rpcDraftStore、newTaskStore
  config/                      # constants、aria2Options、aria2OptionGroups、fileTypes、languages、aria2Errors
  types/aria2.ts               # 共享领域类型（Aria2Task/File/Peer、TaskResponse 等）
  utils/                       # common、format、task、peerId、fileIcon、clipboard、navigation、file
  i18n/                        # i18next 初始化与资源按需加载
  locales/                     # 生成产物（见 i18n 流程），不要手改
legacy/                        # 原 AngularJS 版本（归档）
tools/convert-langs.mjs        # 语言 txt -> i18next JSON 转换脚本
```

## 架构要点

- **路由**：`src/App.tsx` 集中定义（HashRouter）。默认入口为主页 `/home`：未连接 RPC 时展示 RPC 服务器配置列表（复用 `AriaNgRpcSettingsMenu`），已连接时展示连接情况与功能入口。AriaNg 自身设置使用 `/ariang` 路由族（`/ariang/general[|:item]`、`/ariang/rpc[|:item[|:field]]`、`/ariang/importExport`），入口内嵌在主页的“AriaNg Settings”分区；`/ariang` 与未匹配的 `/ariang/*` 重定向 `/home`。aria2 设置前缀为 `/settings`，入口内嵌在主页的“Settings”分区（`SettingsMenu`），每个路由对应 `features/settings/` 的独立页面（`BasicSettingsPage`/`ProtocolSettingsPage`/`RpcGlobalSettingsPage`/`StatusPage` 等），共用 `SettingsPage` 外壳；`/settings` 列表页已移除，访问时重定向 `/home`，直接子界面（`/settings/basic` 等）的顶栏返回按钮也返回 `/home`，深层页面返回各自父级；协议分类直链（如 `/settings/bt`）重定向到 `/settings/protocol`，该页把所有协议分类合并为 `SettingsSection` 列表。新建任务页 `/new` 的顶栏返回目标由入口 `Link` 的 `state.from` 决定（主页、各任务列表页传自身路径，缺省 `/tasks/downloading`）；新建任务的选项设置是独立页面 `/new/settings`（`NewTaskSettingsPage`，顶栏返回 `/new` 并透传该 state、底栏 Confirm 写回表单状态），与 `/new` 页面通过 `newTaskStore` 共享表单状态。兼容旧式 `#!/` 路径与 `#!/new/:url`、`#!/settings/rpc/set/...` 命令行链接。
- **全局布局**：`src/components/AppLayout.tsx` 提供主滚动容器 `<main data-scroll-container>`、顶/底栏插槽（`PanelBarProvider` + `BarHost`）与通知容器。页面用 `<TopBar>`/`<BottomBar>` 声明栏内容，内容会 portal 到布局层（React 树仍在页面内，页面局部状态可直接驱动栏内容）；分裂底栏（左侧玻璃胶囊组 + 右侧独立块，分别靠屏幕两端，iOS 26 风格）用 `SplitBottomBar`（内部包 `BottomBar`，样式类为 `styles/components.css` 的 `.bottom-bar-split`/`.bottom-bar-group`/`.bottom-bar-item`），新建任务页底栏即用它；单组居中底栏（如确认按钮）用 `CenteredBottomBar`（同套玻璃样式），新建任务设置页底栏即用它；底栏按钮统一用 `BottomBarButton`（`ariaLabel`/`label`/`icon`/`iconClassName`/`to`/`onClick`/`disabled`/`hideLabelOnMobile`；有 `to` 渲染 `Link`、无 `to/onClick` 渲染 `label` 以承载隐藏的 file input），悬浮样式由 `.bottom-bar-item` 提供（`hover:bg-gray-100` / `dark:hover:bg-white/20` + `active:scale-95`），不要在各按钮上重复写 hover 类；顶/底栏槽位均无 fallback（`BottomNav` 组件目前未被渲染，保留备用）。顶栏内容示例：主页 → 内嵌 `Home` 标题栏、`TaskListPage` → 返回标题 + 任务列表页签（下载中/等待/已停止）、`TaskDetailPage` → `TaskDetailToolbar`、设置页 → `SettingsPage`（内部渲染 `SettingsToolbar`）；任务列表页底栏由 `TaskListToolbar` 渲染（左组为新建/开始/暂停/删除/全选按钮，右侧搜索钮点击后在底栏上方淡入搜索输入框，失焦且为空时淡出、有内容时保持），任务详情页底栏用 `SplitBottomBar`（左组为开始/暂停、重试、复制下载链接，右侧为删除）；文件列表进入选择模式时改由 `TaskFileList` 内部渲染 `CenteredBottomBar`（Cancel/Save）接管底栏，`TaskDetailPage` 通过 `onChoosingChange` 隐藏 `SplitBottomBar`——同一 bottom 槽位多个 `BottomBar` 会叠加，必须互斥。顶栏页签列表统一由 `TopBarTabs` 渲染（`tabs` + `activeKey`，单项支持 `to` 链接或 `onClick` 按钮、`icon`、`count` 徽标，`hideLabelsOnMobile` 控制移动端仅显示图标），任务列表、任务详情、新建任务页均用它。
  - `TopBar`/`BottomBar` 必须在 `PanelBarProvider` 内使用，否则抛错；页面级测试用 `src/test-utils/renderWithPanelBars.tsx` 包裹。
  - `useScrollRestoration` 依赖 `<main data-scroll-container>` 属性（任务列表页 `location` 与主页 `'home'` 各用独立 key，滚动时记录、返回时恢复；仅当前会话内有效）。注意不要在 effect 清理函数里保存位置：清理发生在路由内容已被替换之后，`scrollTop` 可能已被新页面高度钳制，会覆盖正确值。
- **响应式**：断点使用 Tailwind 默认（`sm` 640、`lg` 1024 等）。设置页不区分尺寸，统一为分级列表：`features/settings/` 中的 `SettingsMenu`、`AriaNgSettingsMenu`、`AriaNgRpcSettingsMenu` 用通用条目组件渲染入口，点击进入选项子页（`SettingsChoiceList`，选择后停留并显示选中态）；字符串/数值输入使用 `SettingsInputModal` 弹窗，布尔项用 `Switch`。设置页层级路由为 `/settings/:type/:sub/:item`（RPC 字段子页多一段 `/:field`）以及 AriaNg 设置的 `/ariang/*`，标题与返回目标由 `SettingsToolbar` 的 `resolveSettingsLocation` 解析。
- **状态**：zustand。`settingStore`（`AriaNgOptions`，持久化 localStorage）、`taskStore`（任务列表、选中、RPC 状态、全局统计）、`taskDetailStore`（当前详情任务标题，由 `useTaskDetail` 写入，供 `TaskDetailToolbar` 展示）、`rpcDraftStore`（RPC 编辑草稿，按 `item` 键控，编辑页与字段子页共享，保存/移除后清理）、`newTaskStore`（新建任务表单状态，`NewTaskPage` 与 `/new/settings` 共享，创建任务成功后重置）。
- **服务层**：`services/rpc/` 提供 HTTP/WebSocket 双传输（Promise + mitt 事件）；RPC 连接在模块加载时根据当前设置创建，**切换默认 RPC 后需要重载页面生效**（统一使用 `@/utils/navigation` 的 `reloadPage()`）。
- **通用设置组件**：数据驱动。通用组件位于 `components/settings/`（`SettingsItem` 条目、`SettingsCard` 卡片、`SettingsSection` 标题+卡片、`SettingsChoiceList` 候选值、`SettingsInputModal` 输入弹窗、`SettingsChoiceModal` 选择弹窗），样式类为 `styles/components.css` 中的 `.settings-*`。Aria2 选项定义在 `config/aria2Options.ts`，由 `features/settings/Aria2OptionItemList.tsx` 渲染；`features/settings/settingsItemViews.ts` 把 `Aria2OptionItem` 与 `ariaNgSettingItems` 映射为统一条目视图。设置页与任务设置（`NewTaskSettingsPage`、`TaskOptionSettings`）共用这套组件。设置路由页面共用基本形式：`SettingsPage`（外壳）、`useAria2GlobalOptions`（Aria2 选项数据）、`Aria2OptionListPage`（列表基本形式）、`Aria2OptionValueRoutePage`（值页基本形式），各路由只做薄组合。
- **任务文件列表**：`features/task-detail/TaskFileList.tsx`（状态与工具栏）+ `TaskFileRow.tsx`（行渲染）。bt multi 目录树由 `utils/task.ts` 构建（虚拟根不渲染，根级条目 `level` 为 1），渲染缩进取 `max(0, level - 1) * 16`；每行行首常驻 16px 选择槽位（选择模式为 checkbox、否则为同尺寸占位 `h-4 w-4 shrink-0`），保证切换模式时内容不跳动。选择模式下整行点击仍可折叠目录（checkbox 点击 `stopPropagation`）；工具栏为标题行（文件名 + Expand/Collapse 或排序 + `(Choose Files)`/已选计数）+ 独立选择面板（全选/不选/反选、类型与自定义扩展名筛选，移动端折叠）；底栏由组件自身渲染 `CenteredBottomBar`（见"全局布局"）。
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
- 移动端按钮用"语义色图标 + 文本"：文本加 `hidden md:inline`，按钮带 `title`/`aria-label`（参考 `TaskFileList` 的 `FileToolbarButton`、`TaskListPage` 的 Clear Stopped Tasks、`BottomBarButton` 的 `hideLabelOnMobile`）；图标颜色用 `text-primary dark:text-primary-light` 或语义色（`text-green-600 dark:text-green-500` 等，调色板已映射 Nord）。公共按钮变体见 `components.css`（`.btn-primary`/`.btn-outline`/`.btn-ghost`/`.btn-secondary`/`.btn-danger-soft` 等）。
- 路径别名：`@` → `src`。

## 测试约定

- vitest + jsdom + `@testing-library/react`；测试与源码同目录（`src/**/*.test.ts(x)`）。
- jsdom 的限制与对策：
  - 无 Canvas 实现（`getContext` 返回 null），canvas 组件只能断言 DOM 存在。
  - 无真实布局与滚动高度，滚动恢复等逻辑需用模拟容器测试。
  - `window.matchMedia` 需手动 stub（参考 `src/App.test.tsx` 的 `stubMatchMedia`）。
  - `window.location.reload` 不可 mock，页面重载统一走 `@/utils/navigation` 的 `reloadPage()`，测试中通过 `vi.mock` 替换。
- 认证/网络请求在测试中通常被 `fetch` stub 挂起，断言应基于渲染结果而非网络返回。
- 渲染包含 `TopBar`/`BottomBar` 的组件时必须用 `renderWithPanelBars` 包裹——包括组件内部自行渲染的底栏（如 `TaskFileList` 的选择底栏），直接 `render` 会抛错。

## 浏览器验证建议

jsdom 无法覆盖视觉效果时，可在 `npm run dev` 后用无头浏览器（Edge/Chrome `--headless=new` + CDP）验证：

- 通过 `Runtime.evaluate` 动态 `import('/src/...')` 渲染组件并对页面截图（适用于 canvas、响应式布局）。
- 在真实页面中 `import('/src/stores/taskStore.ts')` 后 `useTaskStore.setState({ tasks: [...] })` 注入 mock 数据，验证任务卡片等交互。
- 用 `Emulation.setDeviceMetricsOverride` 切换视口宽度验证响应式断点。
- 临时验证自建独立端口的 dev server（`node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 91xx --strictPort`）：本机已有 dev server 可能只监听 IPv6 `::1`，用 `127.0.0.1:9000` 探测会失败。
- 注入 demo 前隐藏应用根节点（`document.getElementById('root').style.display = 'none'`），重复运行脚本前先 `Page.reload` 重置；页面语言跟随浏览器（可能非英文），查找元素用 `aria-label` 或 DOM 结构而非英文文本。
- 截图用 CDP 的 `Page.captureScreenshot`；验证结束后停止临时 vite/Edge 进程并删除临时文件。

## 注意事项与已知坑

- `src/locales/**`、`dist/**` 为生成/构建产物，不要手工修改。
- `legacy/**` 为归档实现；转换脚本会读取其中的语言文件，其余内容保持不变。
- `public/sw.js` 提供最小 Service Worker（仅生产环境在 `src/main.tsx` 注册）：缓存应用外壳（`index.html`）以支持 PWA 安装与离线打开，导航请求网络优先、静态资源 stale-while-revalidate；显式跳过 `manifest.json`、`sw.js` 与所有跨域（aria2 RPC）请求，不做数据缓存。`public/manifest.json` 提供 PWA 元数据与 magnet 协议注册。
- TypeScript 为双版本方案：`@typescript/native`（别名到 `typescript@^7.0.2`）提供原生 `tsc`；包名 `typescript` 是 `@typescript/typescript6` 的别名（提供 `tsc6` 与 TS 6 API），供 typescript-eslint 使用。TS 7 不带 JS API，待 typescript-eslint 支持后方可移除别名；升级 CLI 只需升级 `@typescript/native`。
- `tsconfig.json` 不使用 `baseUrl`（TS 7 已移除该选项），`paths` 直接相对项目根书写。
- PLAN.md 记录重写阶段与决策，可作为历史背景参考。
