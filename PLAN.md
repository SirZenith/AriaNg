# AriaNg 使用 Vite + React 重写计划

## 目标与范围

在仓库根目录建立 **Vite + React 19 + TypeScript + Tailwind CSS + Zustand + react-i18next** 新项目，原 AngularJS 版本整体迁入 `legacy/` 保留归档。本次交付**核心链路**，其余功能分阶段迭代。

## 目录结构（目标）

```
/                          # 新项目根
  index.html  vite.config.ts  tsconfig.json  eslint.config.js
  package.json
  public/                  # favicon、manifest.json、PWA 图标（从 legacy 复制）
  tools/convert-langs.mjs  # 语言 txt -> i18next JSON 转换脚本
  src/
    main.tsx  App.tsx
    styles/index.css       # tailwind 入口 + 主题变量
    types/aria2.ts         # Aria2Task/File/Peer/GlobalStat/Options 类型
    config/                # constants、languages、aria2Options、aria2OptionGroups、aria2Errors、fileTypes
    services/
      rpc/http.ts  rpc/websocket.ts  rpc/index.ts  rpc/types.ts
      taskService.ts  aria2SettingService.ts  settingService.ts  storage.ts
      notification.ts  log.ts
    stores/                # settingStore / taskStore（zustand）
    hooks/                 # useAria2（轮询 / 主题 / 标题 / 快捷键）
    utils/                 # common、format、task（含单元测试）
    i18n/                  # i18next 初始化与语言资源按需加载
    locales/               # <lang>/translation.json（转换产出）
    components/            # AppLayout、NotificationContainer、OptionForm
    features/
      task-list/  new-task/  command/  settings/  status/
  legacy/                  # 原 AngularJS 项目，保持独立可构建
```

## 关键设计决策

- **路由**：`react-router` HashRouter；启动时将旧式 `#!/path` 重写为 `#/path`，保证 `#!/new/:url`、`#!/settings/rpc/set/:protocol/:host/:port/:interface/:secret?` 等 URL 命令行兼容（`new/:url` 用通配参数解析完整 URL）。
- **RPC 层**：把原 callback/deferred 风格改为 Promise + 轻量事件发射器（`mitt`），保留 `onFirstSuccess / onConnectionSuccess / onDownloadComplete ...` 事件语义；HTTP 与 WebSocket 双实现，接口与原 `aria2RpcService` 方法集一致（addUri/addTorrent/remove/pause/tellActive/...）。
- **状态**：`taskStore`（任务列表、选中集、RPC 状态、全局统计、速度历史环形缓冲）、`settingStore`（对应 `ariaNgDefaultOptions`，persist 到 localStorage）。默认新 key；可选一次性读取旧 `AriaNg.Options` 做迁移。
- **i18n**：转换脚本复用原 txt 解析逻辑（分类 `[global]/[error]/[format]/[rpc.error]/[option]/[options]`），输出扁平 JSON，保留英文短语作为 key；i18next 配置 `keySeparator:false, nsSeparator:false` 以支持 `format.settings.file-count` 这类含点 key，语言别名（zh_CN→zh_Hans 等）沿用 `languages.js`。
- **设置表单**：将 `aria2Options.js`（纯数据，1085 行）直译为 `config/aria2Options.ts`，实现通用 `OptionForm` 组件驱动 Aria2 设置与新任务选项，避免逐项硬编码。
- **类型与异步**：全量 TS 类型；所有原 `$scope` 方法拆分到 feature hooks 与 service。

## 分阶段计划

### 阶段 0 — 仓库重组 ✅

1. `git mv` 原 `src/ i18n/ scripts/ .circleci/ gulpfile.js package.json package-lock.json .eslintrc.json` 到 `legacy/`，修正 legacy 内路径使 `cd legacy && npm install && npm run build` 仍可用。
2. 更新根 `.gitignore`，撰写根 README（新构建说明、legacy 说明）。

### 阶段 1 — 基础设施 ✅

3. 初始化 Vite + React + TS、Tailwind、ESLint、路径别名；`npm run dev/build/typecheck/lint` 可用。
4. 迁移静态资源与 PWA manifest 到 `public/`。
5. `tools/convert-langs.mjs` 生成 `src/locales/*/translation.json`（10 种语言），接入 i18next。
6. 移植 `constants / languages / aria2Errors / fileTypes / aria2Options` 为 TS。
7. 实现 RPC 层（http、websocket、index）+ `taskService` + `settingService` + `storage/notification/log/monitor/title`。
8. 建立 stores 与类型定义。

### 阶段 2 — 核心 UI ✅

9. App 布局：顶部工具栏（新建/开始/暂停/删除/全选/排序/RPC 切换/搜索）、侧边栏（下载中/等待/已停止/设置/状态，含计数）、底部状态栏（实时速度、连接状态）。
10. 下载列表页（downloading/waiting/stopped）：任务行、进度、速度、状态翻译、选中、右键菜单、排序、轮询增量刷新、搜索过滤。
11. 新建任务页：URL/Torrent/Metalink 三种方式 + 常用/完整选项（`OptionForm`）、暂停添加、导出命令对话框基础版。
12. AriaNg 设置页（语言/主题/RPC 连接/刷新间隔等）、Aria2 设置页（`OptionForm` + 快速设置）、状态页。
13. URL 命令行处理器（`/new/:url`、`/settings/rpc/set/...`）、主题（明/暗/跟随系统）、键盘快捷键、页面标题动态刷新。
14. 关键纯函数单测（vitest：txt 解析、RPC 请求构造、排序/格式化）。

### 阶段 3 — 任务视图与可观测性 ✅

15. 任务详情页（`/task/detail/:gid`，新增 `features/task-detail/`）
    - `aria2TaskService` 补 `getTaskStatusAndBtPeers`（`system.multicall` 组合 `tellStatus` + `getPeers`）
    - `utils/task.ts` 补 `getCombinedPieces`、`processBtPeers`（peer.name / completePercent / seeder / 上下行速度对调）
    - 页签：Overview / Pieces / Files / Peers / Settings
    - Overview：基本信息、错误码描述、进度/速度/剩余/健康度、BT 信息、infoHash、单一 URL、tracker 列表、内嵌速度图表
    - Files：扁平文件列表（多目录树折叠顺延到阶段 4）、排序、单选/全选、保存 `select-file`
    - Peers：地址、客户端、进度、上下行速度、seeder、排序
    - Settings：`aria2SettingService.getAvailableTaskOptionKeys(status, isBittorrent)` + `OptionForm`，改动调用 `setTaskOption`
    - 验收：详情各页签数据正确，文件勾选与选项修改生效

16. 分片可视化
    - `PieceBar`（canvas，基于 `getCombinedPieces`）与 `PieceMap`（方格图，基于 `getPieceStatus`）
    - 按 `showPiecesInfoInTaskDetailPage` 阈值控制显示

17. 速度图表（React 原生方案，不使用 echarts）
    - 采用 `recharts` 实现折线/面积图，关闭动画以适配每秒刷新
    - 明暗主题通过 Tailwind 变量映射 `stroke` / `fill`；封装 `<SpeedChart>` 组件
    - 新增 `services/monitor.ts`：全局与任务级速度历史环形缓冲（容量 `globalStatStorageCapacity` / `taskStatStorageCapacity`）
    - 底部状态栏图表弹层与任务详情概览图表

18. 调试控制台（`/debug`）
    - 仅 Debug Mode 开启可访问；侧边栏按开关显示入口
    - Logs：级别过滤 / 排序 / 自动刷新 / 刷新 / 清空 / 详情 / 复制
    - RPC：`system.listMethods`、方法选择、JSON 参数、执行、响应展示（Ctrl+Enter）
    - `settingService` 补 `isEnableDebugMode` / `setDebugMode`

19. 浏览器通知
    - 权限申请、频率限制（unlimited / high / middle / low，历史存 `Notifications`）、声音开关
    - 接入 `onDownloadComplete` / `onBtDownloadComplete` / `onDownloadError`

### 阶段 4 — 交互增强与完整设置 ✅

20. 任务列表增强
    - 右键上下文菜单、复制下载链接 / 磁力链接、清除已停止任务
    - 落实 `afterCreatingNewTask` / `afterRetryingTask` / `removeOldTaskAfterRetrying`

21. 拖拽排序（waiting 列表）
    - 条件：`displayOrder=default` 且开启 `dragAndDropTasks`
    - `@dnd-kit/core` + `@dnd-kit/sortable`，drop 后 `changeTaskPosition`，拖拽期间暂停轮询

22. AriaNg 设置页补全
    - 浏览器通知、WebSocket 重连间隔、RPC 列表显示顺序、任务列表独立显示顺序、拖拽开关、创建后 / 重试后行为、重试后删除旧任务、复制前缀、分片阈值、Debug Mode
    - 多 RPC 服务器管理（新增 / 编辑 / 删除 / 设为默认 / 导出命令 API）
    - 导入 / 导出设置（JSON、剪贴板、文件）
    - 注册磁力链处理器、清空历史、重置设置

23. 对话框与快捷操作
    - 底部"快捷设置"（`globalSpeedLimitOptions` → `changeGlobalOption`）
    - 导出命令 API 对话框（`new-task` / `setting` 两类链接生成与复制）

24. 文件工具与筛选
    - 迁移文件读取（text / binary）与下载（Blob）
    - 多目录树折叠（由阶段 3 顺延）
    - 文件类型筛选（video / audio / picture / document / application / archive + 自定义扩展名）与自定义选择文件弹窗

### 阶段 5 — 交付与部署 ✅

25. PWA 元数据与可安装性（不做离线缓存）
    - 校验并完善 `public/manifest.json`：`start_url` / `shortcuts` / `protocol_handlers` / `file_handlers` 与 Hash 路由一致，图标与 `theme-color` 对齐
    - 明确不注册 Service Worker、不做离线缓存
    - 验收：浏览器可安装，`shortcuts` 与 `magnet:` 协议注册可用

26. 版本与元信息注入
    - 构建时注入 `buildVersion`（package.json version）与 `buildCommit`（git short），替代 legacy 的 `${ARIANG_VERSION}` / `${ARIANG_BUILD_COMMIT}`
    - 设置页展示 AriaNg 版本

27. CI 与发布
    - 更新 `.circleci/config.yml` 为新前端构建，legacy 构建改为可选
    - 适配 `scripts/publish_dailybuild.sh`
    - 根 README 补充部署与发布说明

28. 收尾
    - 更新 PLAN.md 各阶段完成状态，清理"待确认"
    - 补充 legacy 归档说明与迁移注记

> 可选（非必须，不排期）：all-in-one 单文件构建（`vite-plugin-singlefile` 或自研内联脚本）。

## 验证方式

- `npm run typecheck`、`npm run lint`、`npm run build` 全部通过。
- `npm run dev` 手动验证：无 aria2 时正确显示断开状态；连接 aria2 RPC（HTTP 与 WebSocket）后列表/统计/新建任务/设置读写正常；切换语言与主题生效；旧 URL 命令行可打开。
- `cd legacy && npm run build` 仍能产出原版 dist。

## 已确认的决策

1. `legacy/` 保持**可独立构建**（保留其 `package.json`，`cd legacy && npm install && npm run build` 可用）。
2. **兼容读取旧版 `AriaNg.Options` 存储格式**（阶段 1 已实现）。
3. `aria2Options` **全量移植**，Aria2 设置与新任务选项为完整支持。
4. 速度图表使用 **React 原生方案（`recharts`）**，不使用 `echarts`。
5. **不做 PWA 离线缓存**（不注册 Service Worker），阶段 5 仅完善 `manifest.json`。
6. all-in-one **单文件版非必须**，不排期。

## 迁移注记

- 阶段 0–5 已全部完成：新版前端位于仓库根目录，legacy 归档于 `legacy/` 并保持可独立构建。
- 已实现：布局与主题、下载列表、新建任务、AriaNg / Aria2 设置、状态页、URL 命令行、任务详情（Overview / Pieces / Files / Peers / Settings）、分片可视化、速度图表、调试控制台、浏览器通知、右键菜单与复制、拖拽排序、多 RPC 管理、导入 / 导出设置、磁力链注册、文件类型筛选、多目录树、PWA 元数据、版本注入、CI 与发布脚本。
- 已知降级：BT peer 客户端识别未移植 `angular-bittorrent-peerid`，暂显示原始 `peerId`。
- 明确排除：PWA 离线缓存 / Service Worker、all-in-one 单文件构建（均为非必须）。
- 校验命令：`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`。
