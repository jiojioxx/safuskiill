# SafuSkill 发射台 · 研发规格文档

**版本：** v1.0  
**页面：** 发射台（Launchpad）— 发射代币  
**协议：** Flap Protocol · BNB Chain  
**更新日期：** 2026-04-13  
**文档性质：** 面向前端 / 合约 / 后端研发，描述当前 UI 原型的完整交互逻辑与接口预期

---

## 目录

1. [技术架构](#1-技术架构)
2. [组件结构](#2-组件结构)
3. [页面布局与模块](#3-页面布局与模块)
   - 3.1 [导航栏](#31-导航栏)
   - 3.2 [发射代币表单](#32-发射代币表单)
   - 3.3 [选择技能](#33-选择技能)
   - 3.4 [交易费率面板](#34-交易费率面板)
   - 3.5 [上传技能 Modal](#35-上传技能-modal)
   - 3.6 [创建代币 Modal](#36-创建代币-modal)
   - 3.7 [链上部署 Toast 通知](#37-链上部署-toast-通知)
4. [状态管理](#4-状态管理)
5. [国际化（i18n）](#5-国际化i18n)
6. [API 接口预期](#6-api-接口预期)
   - 6.1 [技能搜索接口](#61-技能搜索接口)
   - 6.2 [技能上传接口](#62-技能上传接口)
   - 6.3 [GitHub 导入接口](#63-github-导入接口)
   - 6.4 [代币创建接口](#64-代币创建接口)
7. [链上交互流程](#7-链上交互流程)
8. [字段规范与校验](#8-字段规范与校验)
9. [费率机制（合约层）](#9-费率机制合约层)
10. [安全机制](#10-安全机制)
11. [待开发 / Mock 替换清单](#11-待开发--mock-替换清单)

---

## 1. 技术架构

### 当前原型实现

| 层 | 技术 | 说明 |
|----|------|------|
| UI 框架 | React 18 (CDN + Babel Standalone) | 单 HTML 文件，无构建步骤，直接浏览器运行 |
| 样式 | Inline style 对象 + `<style>` 全局 CSS | 动画（spin / fadeInUp / fadeOut）、Accordion（max-height）由 CSS 类驱动 |
| 状态 | `useState` / `useRef` / `useEffect` | 组件内局部状态，无全局状态库 |
| 链上交互 | 暂时 Mock（setTimeout 模拟延迟） | 正式版需接入 ethers.js / wagmi + MetaMask |
| 国际化 | 静态 JS 对象 `T = { zh, en }` | 函数值支持 JSX 动态插值 |
| 文件存储 | 暂时 Mock | 正式版需接入 IPFS（Pinata / Web3.Storage）|
| 安全扫描 | GoPlus AgentGuard（展示层已标注） | 正式版需调用 GoPlus API |

### 正式版推荐架构

```
前端（Next.js / Vite + React）
  └─ wagmi + viem（钱包连接 / 合约调用）
  └─ 技能搜索 → 后端 REST API
  └─ 文件上传 → IPFS（Pinata SDK）
  └─ 安全扫描 → GoPlus AgentGuard API

后端（Node.js / Go）
  └─ /api/skills（搜索 / 上传 / 审核状态）
  └─ /api/tokens（创建记录 / 元数据）

合约层（BNB Chain / Solidity）
  └─ Flap Protocol（BEP-20 工厂合约）
  └─ 费率分配合约（1% 自动拆分）
```

---

## 2. 组件结构

```
LaunchToken                  ← 主页面，持有所有全局状态
  ├── <nav>                  ← 导航栏（内联，无独立组件）
  ├── 表单区域               ← 内联，包含所有表单字段
  │     ├── 图片上传区
  │     ├── 代币名称 / 股票代码（两列）
  │     ├── 描述
  │     ├── 选择技能（含搜索下拉 / 已选 Chip）
  │     ├── 网站
  │     ├── 推特
  │     └── 交易费率说明（含可展开面板）
  ├── UploadSkillModal        ← 上传技能弹窗
  │     ├── Tab1：上传文件
  │     └── Tab2：GitHub 导入
  ├── CreateTokenModal        ← 创建代币弹窗
  └── Toast                  ← 部署进度通知（右下角固定）
```

---

## 3. 页面布局与模块

### 3.1 导航栏

**布局：** `position: sticky; top: 0; z-index: 200`，高度 64px，三列（Logo / 导航链接 / 右侧操作区）

**导航项：**

| 中文 | 英文 | 激活状态 |
|------|------|---------|
| 技能市场 | Skill Market | 非当前页 |
| 发射台 | Launchpad | **默认激活**（index=1） |
| 文档 | Docs | 非当前页 |
| 开发者 | Developer | 非当前页 |

激活样式：`color: #d4a017; background: rgba(212,160,23,.12); fontWeight: 600`

**右侧操作区（从左到右）：**

| 元素 | 交互 | 正式版需求 |
|------|------|-----------|
| 语言切换按钮 | 点击切换 `lang` 状态 `zh ↔ en`，全页实时同步 | 接入 i18n 库（next-intl / react-i18next） |
| 通知铃 🔔 | 无交互（占位） | 接入链上事件 WebSocket 通知 |
| 钱包地址徽章 | 显示已连接地址（当前硬编码 `0x168a...c6e6`） | 接入 wagmi `useAccount()` |

---

### 3.2 发射代币表单

**容器：** `maxWidth: 760px; margin: 0 auto; padding: 48px 24px 80px`

**卡片（Card）：** `background: #1a1a1a; borderRadius: 16px; border: 1px solid #2a2a2a; padding: 32px`

#### 图片上传 + 代币名称/代码（两列布局）

```
┌──────────────────┬──────────────────────────────────┐
│   图片上传区      │  代币名称（Token Name）*必填       │
│   200×200px      │                                  │
│   solid border   ├──────────────────────────────────┤
│                  │  股票代码（Ticker）*必填            │
└──────────────────┴──────────────────────────────────┘
```

**图片上传区行为：**

- 默认状态：图片占位图 SVG + 格式提示文字（PNG · JPEG · WEBP · GIF / Max Size: 5MB）
- Hover 状态：`border-color: #d4a017`
- 上传后：`<img>` 全覆盖，`objectFit: cover`
- 支持格式：`accept="image/png,image/jpeg,image/webp,image/gif"`
- 大小限制：**5MB**（校验需在 `onChange` 中实现，当前 Mock 未校验）

**股票代码（Ticker）特殊说明：**

- 值绑定至状态 `tickerVal`
- 全局 `effectiveTicker = tickerVal.trim() || "JIOJIO"`
- `effectiveTicker` 用于 CreateTokenModal 标题、描述、Toast 文案的动态插值
- 留空时系统以 `JIOJIO` 作为占位展示

#### 描述（Description）

- 多行文本框，`minHeight: 120px`，可拖拽纵向调整
- 选填，建议 ≤500 字符（校验待实现）

#### 网站 / 推特

| 字段 | 占位符 | 类型 |
|------|--------|------|
| 网站 | `https://yourproject.com` | URL 文本输入 |
| 推特 | `https://x.com/yourhandle` | URL 文本输入 |

校验规则（待实现）：非空时须以 `http://` 或 `https://` 开头

---

### 3.3 选择技能

**必填项**，每枚代币必须关联一个已审核通过的 AI 技能。

#### 状态机

```
未选择 + 无输入
  └─ 显示：搜索框（占位符"搜索技能..."）+ 底部文字链接"没有合适的技能？上传新技能 →"

未选择 + 有输入（触发 API 搜索）
  └─ 显示：搜索框 + 下拉列表
        ├─ 有结果：技能列表（每项：🤖图标 / 名称 / 描述 / Ticker徽章）
        ├─ 无结果：提示"未找到'{关键词}'相关技能"
        └─ 底部固定项：上传绑定技能（点击打开 UploadSkillModal）

已选择
  └─ 显示：Chip（🤖图标 / 技能名 / 描述 / Ticker徽章 / "更换"按钮）
        └─ 点击"更换"：清空 selectedSkill + skillSearch，回到未选择+无输入态
```

#### 下拉列表交互细节

- 触发：输入框 `onFocus` 或 `onChange` 时 `dropdownOpen = true`
- 关闭：输入框 `onBlur` 时延迟 160ms 关闭（防止 `onMouseDown` 选中被 blur 打断）
- 选中技能：`onMouseDown`（非 onClick）触发 → 设置 `selectedSkill`，清空搜索，关闭下拉
- 上传入口：`onMouseDown` 触发 → 关闭下拉，打开 UploadSkillModal

#### 当前 Mock 数据（正式版替换为 API）

```js
const MOCK_SKILLS = [
  { id:1, name:"Code Review Agent",      ticker:"CRVW", desc:"自动代码审查与优化建议" },
  { id:2, name:"Data Analysis Agent",    ticker:"DATA", desc:"数据清洗与可视化报告生成" },
  { id:3, name:"Translation Agent",      ticker:"TRAN", desc:"多语言实时翻译 Agent" },
  { id:4, name:"Image Generation Agent", ticker:"IMGN", desc:"基于提示词生成高质量图片" },
  { id:5, name:"Writing Assistant",      ticker:"WRIT", desc:"文章撰写与润色 Agent" },
];
```

---

### 3.4 交易费率面板

位于"推特"字段下方，"创建代币"按钮上方。

**结构：**

```
┌─────────────────────────────────────────────────────────┐
│ 💡 交易费率说明              [查看分配详情 ▼ / 收起 ▲]  │
│    1% 协议手续费将自动分配至...                          │
│    ┌──────────────── 可展开面板 ──────────────────────┐  │
│    │ 费率分配                          总计：100%      │  │
│    │ 平台          30%  ████████░░░░░░░░░░░░░░░░░    │  │
│    │ 开发者奖励    40%  ████████████░░░░░░░░░░░░░    │  │
│    │ Skill 奖励   30%  ████████░░░░░░░░░░░░░░░░░    │  │
│    │ 🔒 此比例由智能合约锁定，不可修改                 │  │
│    └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**展开动画实现：**

```css
.fee-panel {
  overflow: hidden;
  max-height: 0;
  transition: max-height .38s cubic-bezier(.4,0,.2,1), opacity .3s ease;
  opacity: 0;
}
.fee-panel.open { max-height: 300px; opacity: 1; }
```

**进度条动画：** `width` 从 `0%` 过渡到 `{pct}%`，由 React 状态 `feeOpen` 控制，CSS transition `.5s cubic-bezier(.4,0,.2,1)`

**分配比例：**

| 接收方 | 比例 |
|--------|------|
| 平台（SafuSkill） | 30% |
| 开发者奖励 | 40% |
| Skill 奖励池 | 30% |

---

### 3.5 上传技能 Modal

触发入口：
- 选择技能下拉列表底部"上传绑定技能"
- 选择技能区域底部文字链接"没有合适的技能？上传新技能 →"

**Modal 规格：** `maxWidth: 600px; maxHeight: 90vh; overflowY: auto`，点击遮罩层关闭

**Tab 1：上传文件**

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| 技能名称 | 是 | 文本输入 | 将显示于技能市场 |
| 描述 | 否 | 多行文本 | 技能功能详情 |
| 技能文件 | 是 | 文件上传 | `.zip` 格式，最大 50MB |

文件上传区：`border: 2px solid #2e2e2e`（实线），Hover 变为 `#d4a017`，支持点击或拖放

按钮：「上传 & 扫描」→ 调用安全扫描接口（见 6.2）

**Tab 2：从 GitHub 导入**

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| GitHub 仓库链接 | 是 | URL 输入（带链接图标前缀） | 需为公开仓库 |
| 自定义技能名称 | 否 | 文本输入 | 留空则从仓库或 SKILL.md 提取 |
| 自定义描述 | 否 | 多行文本 | 留空则从 SKILL.md frontmatter 或 README 提取 |

字段提示（hint）：灰色小字，说明自动提取优先级

> **自动提取优先级：** `SKILL.md` frontmatter → `README` 首段 → 仓库 About 描述

按钮：「导入 & 扫描」→ 调用 GitHub 克隆 + 安全扫描接口（见 6.3）

---

### 3.6 创建代币 Modal

点击主页面"创建代币"按钮触发。

**Modal 规格：** `maxWidth: 480px`，`z-index: 600`（高于上传 Modal 的 500）

**内容区域（从上到下）：**

1. **标题**：`选择购买多少 {TICKER} 币`（动态插值）
2. **描述**：说明防狙击保护逻辑，标注最大供应 10 亿 / 最大购买 8 亿枚
3. **钱包余额展示**

   ```
   ● 钱包余额                          0.8432  BNB
   ```

   - 绿色在线圆点 + 标签 + 右侧数值（正式版接入 `useBalance()`）
   - 当前硬编码：`0.8432 BNB`

4. **BNB 输入框**：`type="number"`，右侧后缀固定显示 `BNB`
5. **预估代币数**：`≈ 将获得约 {N} 枚 {TICKER} 代币`
   - 计算公式（当前 Mock）：`Math.floor(amount / 0.0000003)`
   - 正式版从合约 bondingCurve 实时读取
6. **创建按钮**：「立马创建！」
7. **底部信息栏**：左侧显示"您将支付大约 X BNB"，右侧显示"部署成本：约 0.001 BNB"

**按钮状态机：**

| 阶段 | 样式 | 文案 | 可交互 |
|------|------|------|--------|
| idle | 金色渐变 | 立马创建！ | 是 |
| waiting | 金色渐变 + 转圈 Spinner | 等待钱包授权中... | 否 |
| success | 绿色渐变 | ✅ 授权成功！ | 否 |

**阶段流转（当前 Mock 时序）：**

```
idle → 点击 → waiting（2500ms）→ success（1000ms）→ 关闭 Modal + 触发 Toast
```

正式版：`waiting` 阶段等待钱包签名回调，`success` 阶段等待链上确认事件。

---

### 3.7 链上部署 Toast 通知

**位置：** `position: fixed; bottom: 24px; right: 24px; width: 320px; z-index: 900`

**三阶段时序：**

| 阶段 | 起始时刻 | 图标 | 标题 | 描述 |
|------|---------|------|------|------|
| Step 1 | 0ms | 金色 Spinner | 正在启动 {TICKER} ... | 正在将元数据上传至 IPFS... |
| Step 2 | 2500ms | 金色 Spinner | 合约部署中... | 正在 BNB Chain 上部署 {TICKER} 代币合约... |
| Step 3 | 5500ms | 🎉 | {TICKER} 代币已成功发射！ | 您的代币已部署至链上... |

Step 3 额外展示「查看代币详情 →」按钮（当前无跳转，正式版跳转至代币详情页）

**10500ms 后：** Toast 执行 `fadeOut` 动画（400ms）后从 DOM 移除

**入场 / 退场动画：**

```css
@keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeOut  { from { opacity:1; transform:translateY(0); }  to { opacity:0; transform:translateY(10px); } }
```

---

## 4. 状态管理

所有状态集中在 `LaunchToken` 组件，通过 props 向下传递：

| 状态变量 | 类型 | 初始值 | 作用 |
|---------|------|--------|------|
| `lang` | `"zh" \| "en"` | `"zh"` | 当前语言，切换后 `t = T[lang]` 全页同步 |
| `activeNavIdx` | number | `1` | 当前激活导航项下标 |
| `logoPreview` | string \| null | `null` | 代币图片 DataURL 预览 |
| `focused` | string \| null | `null` | 当前聚焦的输入框 key，用于高亮 border |
| `tickerVal` | string | `""` | 股票代码输入值 |
| `skillSearch` | string | `""` | 技能搜索关键词 |
| `selectedSkill` | object \| null | `null` | 已选技能 `{ id, name, ticker, desc }` |
| `dropdownOpen` | boolean | `false` | 技能搜索下拉是否展开 |
| `showUploadModal` | boolean | `false` | 上传技能 Modal 可见性 |
| `showCreateModal` | boolean | `false` | 创建代币 Modal 可见性 |
| `showToast` | boolean | `false` | Toast 可见性 |
| `feeOpen` | boolean | `false` | 费率详情面板展开状态 |

---

## 5. 国际化（i18n）

**实现方式：** 静态翻译对象 `T = { zh: {...}, en: {...} }`，组件内通过 `const t = T[lang]` 获取当前语言包，以 prop 形式传入子组件。

**值类型规则：**

| 值类型 | 场景 | 示例 |
|--------|------|------|
| `string` | 静态文本 | `t.back = "返回"` |
| `(arg) => string` | 含变量的纯文本 | `t.cmTitle = (ticker) => \`选择购买多少 ${ticker} 币\`` |
| `() => JSX` | 含样式标签的富文本 | `t.feeDesc = () => <><span style={...}>1%</span> 协议手续费...</>` |
| `(arg) => JSX` | 含变量 + 样式的富文本 | `t.cmDesc = (ticker) => <>...{ticker}...</>` |
| `array` | 列表数据（如费率项） | `t.feeItems = [{ label, pct }, ...]` |

**当前支持语言：**

| 语言 | key |
|------|-----|
| 中文（简体） | `zh` |
| English | `en` |

切换范围：导航栏、表单所有字段标签与占位符、两个 Modal 全部文案、Toast 全部文案。

---

## 6. API 接口预期

以下为正式版需要实现的接口规范，当前原型均使用 Mock 数据。

### 6.1 技能搜索接口

```
GET /api/skills/search?q={keyword}&limit=10

Response 200:
{
  "skills": [
    {
      "id": "skill_abc123",
      "name": "Code Review Agent",
      "ticker": "CRVW",
      "desc": "自动代码审查与优化建议",
      "status": "approved",        // approved | pending | rejected
      "coverUrl": "https://..."    // 技能封面图（可选）
    }
  ]
}
```

调用时机：技能搜索框 `onChange`，建议加 300ms debounce。

---

### 6.2 技能上传接口

```
POST /api/skills/upload
Content-Type: multipart/form-data

Fields:
  name        string   required   技能名称
  desc        string   optional   描述
  file        File     required   .zip 文件，≤ 50MB

Response 200:
{
  "skillId": "skill_xyz789",
  "scanStatus": "scanning",       // scanning | passed | failed
  "scanMessage": "扫描中，预计 10 秒内完成"
}

Response 400:
{
  "error": "FILE_TOO_LARGE" | "INVALID_FORMAT" | "SCAN_FAILED",
  "message": "..."
}
```

扫描结果可通过轮询或 WebSocket 获取：
```
GET /api/skills/{skillId}/scan-status

Response: { "status": "passed" | "failed", "report": {...} }
```

---

### 6.3 GitHub 导入接口

```
POST /api/skills/import-github

Body (JSON):
{
  "repoUrl": "https://github.com/username/repository",
  "customName": "",        // 留空则自动提取
  "customDesc": ""         // 留空则自动提取
}

Response 200:
{
  "skillId": "skill_gh456",
  "resolvedName": "My Agent",          // 实际使用的技能名称
  "resolvedDesc": "从 SKILL.md 提取...",
  "scanStatus": "scanning"
}
```

**元信息提取优先级（后端实现）：**
1. `SKILL.md` frontmatter `name` / `description` 字段
2. `README.md` 第一段
3. GitHub 仓库 About（via GitHub API）

---

### 6.4 代币创建接口

代币创建为纯链上操作，后端仅负责辅助流程：

**Step 1 — 上传元数据至 IPFS**

```
POST /api/tokens/upload-metadata

Body (JSON):
{
  "name": "Code Review Agent Token",
  "ticker": "CRVW",
  "desc": "...",
  "imageFile": "<base64 或 multipart>",
  "skillId": "skill_abc123"
}

Response 200:
{
  "metadataUri": "ipfs://Qm...",   // 不可变 CID
  "cid": "Qm..."
}
```

**Step 2 — 调用 Flap Protocol 合约**（前端直接调用，无后端）

```js
// 使用 ethers.js / viem
const tx = await flapFactory.createToken(
  name,
  ticker,
  metadataUri,
  skillId,
  initialBuyAmountBNB,   // wei 单位
  { value: initialBuyAmountBNB + GAS_DEPOSIT }
);
const receipt = await tx.wait();
const tokenAddress = receipt.events.find(e => e.event === 'TokenCreated').args.token;
```

---

## 7. 链上交互流程

```
用户点击「立马创建！」
│
├─ [前端] 校验表单必填项（代币名称 / 股票代码 / 已选技能）
│
├─ [前端] POST /api/tokens/upload-metadata
│         → 获取 metadataUri（IPFS CID）
│         → Toast Step 1 显示
│
├─ [前端] 调用 wagmi sendTransaction / writeContract
│         → 用户在 MetaMask 确认签名
│         → CreateTokenModal 进入 waiting 态
│
├─ [链上] Flap Protocol 部署 BEP-20 合约
│         → 合约地址写入链上事件
│         → Toast Step 2 显示
│
├─ [前端] 监听 TokenCreated 事件（或 tx.wait()）
│         → 获取 tokenAddress
│         → Toast Step 3 显示（🎉 成功）
│
└─ [前端] 「查看代币详情 →」跳转至 /token/{tokenAddress}
```

**Gas 费参考：** 合约部署约 0.001 BNB（不含初始购买金额），须在 UI 中明确展示。

---

## 8. 字段规范与校验

| 字段 | 必填 | 前端校验规则 | 链上约束 |
|------|------|------------|---------|
| 代币图片 | 否 | 格式：PNG/JPEG/WEBP/GIF；大小 ≤ 5MB | 存于 IPFS，不上链 |
| 代币名称 | 是 | 非空，建议 ≤ 50 字符 | 合约 `name` 字段 |
| 股票代码 | 是 | 非空，2–6 位，建议全大写字母 | 合约 `symbol` 字段，**部署后不可更改** |
| 描述 | 否 | 建议 ≤ 500 字符 | 存于 IPFS 元数据 |
| 选择技能 | 是 | 必须从列表选中或上传后关联 | 合约元数据中的 skillId 绑定 |
| 网站 | 否 | 非空时须以 `http://` 或 `https://` 开头 | 存于 IPFS 元数据 |
| 推特 | 否 | 建议格式 `https://x.com/handle` | 存于 IPFS 元数据 |
| 初始购买（BNB）| 否 | ≥ 0；最大对应 8 亿枚代币的 BNB 数量 | 合约校验上限，超额自动退款 |

**当前原型缺失的校验（正式版需补全）：**

- [ ] 图片大小 / 格式校验
- [ ] Ticker 格式校验（2–6 位字母）
- [ ] 网站 / 推特 URL 格式校验
- [ ] 提交前必填项整体校验 + 错误提示
- [ ] Ticker 唯一性校验（需查链上）
- [ ] 初始购买金额超过钱包余额时的阻断提示

---

## 9. 费率机制（合约层）

每笔 `{TICKER}` 链上交易收取 **1%** 协议手续费，由合约自动分配：

| 接收方 | 比例 | 合约变量 |
|--------|------|---------|
| 平台（SafuSkill） | 30% | `PLATFORM_FEE_BPS = 3000` |
| 代币创建者 / 技能开发者 | 40% | `CREATOR_FEE_BPS = 4000` |
| Skill 奖励池 | 30% | `POOL_FEE_BPS = 3000` |

**约束：**
- 总费率 1% 和三方比例均在部署时写入合约字节码
- 合约部署后任何地址（含 SafuSkill 团队）均无法修改
- 持币者可通过 BscScan 验证合约源码

---

## 10. 安全机制

### GoPlus AgentGuard 集成

所有技能文件（上传 ZIP / GitHub 导入）在入库前须经 GoPlus AgentGuard 自动扫描：

```
检测项目：
- 恶意代码注入
- 权限越界调用
- 已知漏洞模式匹配
- 数据泄露风险
- 供应链攻击特征
```

扫描未通过 → 拒绝入库，不可与代币关联，UI 需展示扫描失败原因。

### 防狙击保护

创建代币时的初始购买由合约保证：
- 初始购买在合约部署交易中原子执行（一笔 tx）
- 无法被夹断（sandwich）或抢跑（frontrun）

### 钱包安全原则

- 平台不托管任何私钥
- 所有链上操作须用户在本地钱包手动确认签名
- 超额 BNB 退款逻辑写入合约，平台无法截留

---

## 11. 待开发 / Mock 替换清单

以下为原型中使用硬编码或 Mock 的部分，正式开发时需逐项替换：

| # | 模块 | 当前状态 | 正式版需求 |
|---|------|---------|-----------|
| 1 | 钱包地址 | 硬编码 `0x168a...c6e6` | 接入 `wagmi useAccount()` |
| 2 | BNB 余额 | 硬编码 `0.8432 BNB` | 接入 `wagmi useBalance()` |
| 3 | 代币数量估算 | `amount / 0.0000003` | 从 Flap Protocol 合约 bondingCurve 读取 |
| 4 | 技能搜索 | 本地 MOCK_SKILLS 数组（5条） | GET /api/skills/search（含 debounce） |
| 5 | 钱包授权流程 | `setTimeout(2500ms)` | wagmi `writeContract` + MetaMask 签名回调 |
| 6 | IPFS 上传 | 无（Toast 直接进入） | POST /api/tokens/upload-metadata |
| 7 | 合约部署 | `setTimeout(3000ms)` | 监听 `TokenCreated` 链上事件 |
| 8 | 安全扫描 | GoPlus 标注展示，无实际调用 | 接入 GoPlus AgentGuard API |
| 9 | 「查看代币详情」按钮 | 无跳转 | 跳转至 `/token/{tokenAddress}` |
| 10 | 图片上传校验 | 无格式 / 大小校验 | `onChange` 中校验格式与大小 |
| 11 | 表单提交校验 | 无整体校验 | 点击「创建代币」前校验所有必填项 |
| 12 | Ticker 唯一性 | 无校验 | 调用合约 `symbolExists(ticker)` |

---

*SafuSkill · Powered by Flap Protocol · BNB Chain*  
*研发规格文档 v1.0 · 2026-04-13*
