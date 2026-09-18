# 设置界面通用化重构计划

## 背景与目标

统一设置界面与任务设置的实现形式，抽象可复用的通用组件，消除 `SettingsItemList` / `Aria2OptionItemList` / 菜单行 / 卡片样式的重复。重构过程中，`.tsx` 内重复出现的 Tailwind 样式组合一律抽到 `src/styles/components.css` 的 `@layer components` 定义并复用。

## 决策摘要

- 范围：`/settings` 设置页 + 任务设置表单（`TaskSettingsPanel`、`TaskOptionSettings`、`QuickSettingDialog`）。
- 图标：默认不显示，仅分类菜单/重要入口保留。
- 字符串/数值输入：统一使用弹窗子界面，不新增路由。
- 页面结构：一路由一列表，`SettingsSection` 只负责“小标题 + 卡片”。
- 任务设置的选择类：使用弹窗（`SettingsChoiceModal`）。
- `OptionForm.tsx`：迁移后若不再被引用则删除。

## 一、通用组件（`src/components/settings/`）

| 组件 | 职责 | 关键 props |
| --- | --- | --- |
| `SettingsItem` | 单条目，按 `indicator` 渲染右侧指示物 | `icon?`, `label`, `description?`, `indicator`, `to?`, `onClick?`, `disabled?` |
| `SettingsCard` | 白色圆角卡片容器 | `children`, `className?` |
| `SettingsSection` | 可选小标题 + `SettingsCard` | `title?`, `children` |
| `SettingsChoiceList` | 候选值列表（勾选），保留 `role=listbox/option`、`aria-selected` | `items`, `value`, `onSelect` |
| `SettingsInputModal` | 输入弹窗（基于 `Modal`） | `title`, `value`, `type`, `history?`, `required?`, `readonly?`, `suffix?`, `onConfirm`, `onClose` |
| `SettingsChoiceModal` | 候选值弹窗（标题 + `SettingsChoiceList`），任务设置使用 | `title`, `items`, `value`, `onSelect`, `onClose` |

```ts
type SettingsIndicator =
    | { type: 'navigate' }
    | { type: 'check'; selected: boolean }
    | { type: 'switch'; checked: boolean; onChange: (v: boolean) => void }
    | { type: 'value'; text: string };
```

## 二、适配层（`src/features/settings/`）

```ts
interface SettingsItemView {
    key: string;
    icon?: LucideIcon;
    label: string;
    description?: string;
    indicator: SettingsIndicator;
    to?: string;
    onClick?: () => void;
    disabled?: boolean;
}
```

- `toAria2ItemViews(options, values, ctx)`：`boolean`→switch；有 `options`→navigate（`routeBase + '/' + key`）；string/integer/float/text→`value` + `ctx.onInput`；`readonly`→disabled 且无指示物。
- `toAriaNgItemViews(items, options, ctx)`：`select`→navigate；`switch`→switch；`text`→`value` + `ctx.onInput`。
- `Aria2OptionItemList` 与 `SettingsItemList` 合并为纯渲染的 `SettingsItemListView`。
- `ctx` 由容器给出：设置页提供 `to` 与 `onInput`；任务设置提供 `onSelect` / `onInput`（均弹窗）。

## 三、模块改造

- 设置页：菜单改用 `SettingsItem`；值选择页内部改用 `SettingsChoiceList`；字符串/数值条目改为 `value` + `SettingsInputModal`；各列表用 `SettingsSection` 加分类小标题；状态页/导入导出作为自定义 children 的 section。
- 任务设置：三处改为 `SettingsCard` + `SettingsItemListView`；选择开 `SettingsChoiceModal`；输入开 `SettingsInputModal`；`TaskSettingsPanel` 保留 draft 与 Confirm/Cancel，`TaskOptionSettings` 弹窗确认后即时写入。
- `OptionForm.tsx`：无引用后删除。

## 四、样式抽取约定

- 目标：`src/styles/components.css` 的 `@layer components`。
- 触发：同类 Tailwind 组合重复 2 处以上，或承载明确语义。
- 候选类：`.settings-card`、`.settings-section-title`、`.settings-item`、`.settings-item-label`、`.settings-item-description`、`.settings-item-value`、`.settings-item-icon`、`.settings-choice-item`。
- 约束：使用 `@theme` 变量（如 `primary`），不硬编码色值；保留 `dark:` 变体；抽取后同步替换 tsx，优先复用 `.panel` / `.card` / `.input` / `.switch`；一次性布局类不强行抽取。

## 五、分阶段实施

1. 抽象 `SettingsItem` / `SettingsCard` / `SettingsSection` / `SettingsChoiceList`；迁移设置页列表与菜单，行为与路由不变；同步抽样式。
2. 新增 `SettingsInputModal` / `SettingsChoiceModal`；设置页字符串/数值改为弹窗。
3. 迁移任务设置三处；移除 `OptionForm`。
4. 用 `SettingsSection` 统一各页标题与卡片，处理状态页/导入导出特例。
5. 补/改测试，跑 `lint && typecheck && test && build`。

每阶段结束运行 `npm run lint && npm run typecheck && npm test`。

## 六、测试计划

- 新增：`SettingsItem`、`SettingsInputModal`、`SettingsChoiceList` 单元测试。
- 更新：`SettingsItemList.test.tsx`、`AriaNgSettingValuePage.test.tsx`、`RpcSettingFieldPage.test.tsx`、`App.test.tsx`（`renders the page title as a text input` 改为“点击条目打开输入弹窗”）。
- 任务设置测试改为验证列表条目与弹窗交互。
- 保持 `role="option"` / `aria-selected` / `aria-label` 语义。

## 七、风险

- `Modal` 嵌套的层级与滚动。
- 任务设置 `readonly` 选项需禁用且无指示物。
- `TaskOptionSettings` 即时写入的并发与失败提示。
- 测试对 DOM/文案的依赖需同步更新。

## 八、验收标准

- 设置页与任务设置由同一套通用组件渲染。
- 字符串/数值经输入弹窗编辑；布尔用 `Switch`；选择类在设置页走路由、在任务设置走弹窗。
- 重复样式收敛到 `components.css` 复用。
- `lint`、`typecheck`、`test`、`build` 全部通过。

## 九、实施状态

- 阶段 1–5 已完成：新增 `components/settings/` 通用组件（`SettingsItem`/`SettingsCard`/`SettingsSection`/`SettingsChoiceList`/`SettingsInputModal`/`SettingsChoiceModal`）与 `features/settings/settingsItemViews.ts` 适配层；设置页与任务设置均完成迁移；`OptionForm`、`SettingsRow`、`OptionChoiceList` 已删除；重复样式抽到 `styles/components.css` 的 `.settings-*` 与 `.btn-secondary`/`.btn-muted`/`.btn-success`/`.btn-warning`。
- 验证：`npm run lint`、`npm run typecheck`、`npm test`、`npm run build` 全部通过。

## 十、设置页路由拆分

- 目标：消除 `Aria2SettingsPage` 对多条路由的高耦合，抽象基本形式并为每个路由实现独立页面。
- 基本形式：`SettingsPage`（外壳）、`useAria2GlobalOptions`（数据加载）、`Aria2OptionListPage`（列表）、`Aria2OptionValueRoutePage`（值页）。
- 独立页面：`SettingsHomePage`、`SettingsMenuPage`、`Basic/Advanced/RpcGlobal/ProtocolSettingsPage`、`Basic/Advanced/ProtocolOptionValuePage`、`AriaNgSettingsPage`、`RpcSettingsListPage`、`RpcSettingsEditorPage`、`ImportExportPage`、`StatusPage`；`AriaNgSettingValuePage`、`RpcSettingFieldPage` 补 `SettingsPage` 外壳并从路由取参。
- 路由：`App.tsx` 改为静态路由；协议分类直链（如 `/settings/bt`）重定向到 `/settings/protocol/:category`；删除 `Aria2SettingsPage`。
- 路径简化：设置页前缀由 `/settings/aria2` 统一为 `/settings`（不保留旧前缀重定向）。
- ProtocolSettingsPage 合并：所有协议分类改写为 `SettingsSection` 列表；取消 `/settings/protocol/:sub` 子页；协议分类直链统一重定向到 `/settings/protocol`。
- 验证：`lint`、`typecheck`、`test`（121 通过）、`build` 全部通过。
