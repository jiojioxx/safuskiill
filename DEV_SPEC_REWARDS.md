# SafuSkill · 领取收益 & 作者验证状态卡片 研发规格文档

**版本：** v1.1  
**页面：** 我的代币（MyTokens）— 领取收益模块 / 作者验证状态卡片  
**协议：** Flap Protocol · BNB Chain  
**更新日期：** 2026-04-16  
**文档性质：** 面向前端 / 后端研发，描述当前 UI 原型的完整交互逻辑、状态机与接口预期

---

## 目录

1. [模块概览](#1-模块概览)
2. [领取收益 Modal — 组件框架](#2-领取收益-modal--组件框架)
3. [Tab A：领取收益](#3-tab-a领取收益)
   - 3.1 [技能收益列表](#31-技能收益列表)
   - 3.2 [claimStatus 状态机](#32-claimstatus-状态机)
   - 3.3 [领取按钮状态机](#33-领取按钮状态机)
4. [Tab B：发现认领](#4-tab-b发现认领)
   - 4.1 [流程总览](#41-流程总览)
   - 4.2 [第一步：GitHub 账号绑定](#42-第一步github-账号绑定)
   - 4.3 [第二步：收益到账钱包](#43-第二步收益到账钱包)
   - 4.4 [第三步：ZIP 文件认领](#44-第三步zip-文件认领)
   - 4.5 [争议申请状态机](#45-争议申请状态机)
5. [作者验证状态卡片（VerifiedAuthorCard）](#5-作者验证状态卡片verifiedauthorcard)
   - 5.1 [三种状态定义](#51-三种状态定义)
   - 5.2 [状态展示规则](#52-状态展示规则)
   - 5.3 [受益人钱包交互](#53-受益人钱包交互)
6. [状态变量总览](#6-状态变量总览)
7. [API 接口预期](#7-api-接口预期)
8. [业务规则 & 约束](#8-业务规则--约束)
9. [待开发 / Mock 替换清单](#9-待开发--mock-替换清单)

---

## 1. 模块概览

```
MyTokens.html
  └── ClaimModal                    ← 领取收益弹窗（也可 pageMode 内嵌）
        ├── Tab A：领取收益          ← 展示已关联技能的待领取收益，执行链上结算
        └── Tab B：发现认领          ← GitHub 身份绑定 → 钱包绑定 → ZIP 认领

  └── VerifiedAuthorCard            ← 代币详情页右侧作者验证状态卡片（独立组件）
```

**入口触发：**

| 入口位置 | 触发方式 | 打开参数 |
|---------|---------|---------|
| 侧边栏「领取收益」导航项 | 点击 → `pageMode=true` 内嵌渲染 | `initialTab="mine"` |
| 技能列表「前往认领 →」按钮（ZIP 技能未认领） | 点击 → `setMainTab("discover")` | 直接切换到发现认领 tab |
| 技能列表「重新申请 →」按钮（ZIP 技能被拒） | 同上，并预填上次申请字段 | — |

---

## 2. 领取收益 Modal — 组件框架

**组件签名：**

```jsx
function ClaimModal({
  onClose        = ()=>{},
  pageMode       = false,       // true = 内嵌页面，false = 弹窗覆盖层
  initialTab     = "mine",      // "mine" | "discover"
  beneficiaryWallet = ""        // 预填收益钱包（来自用户账号绑定的钱包地址）
})
```

**容器规格：**

- 弹窗模式：`maxWidth: 480px`，遮罩层 `background: rgba(0,0,0,.8); z-index: 800`，入场动画 `fade-up`
- pageMode：`padding: 28px 36px`，无遮罩，内嵌在主内容区

**Tab 切换栏：**

```
┌──────────────────┬──────────────────┐
│    领取收益       │    发现认领       │
└──────────────────┴──────────────────┘
```

- 激活样式：`background: #1e1e1e; color: #d4a017; fontWeight: 700`
- 非激活：`background: transparent; color: #555`
- 切换时不重置各 tab 内部状态（状态持久化于整个 Modal 生命周期）

---

## 3. Tab A：领取收益

### 3.1 技能收益列表

数据来源：`skills` 状态数组，初始值为 `MOCK_REWARDS_INIT`。

**每行结构：**

```
┌──────────────────────────────────────────────────┐
│ [图标]  技能名称                     +0.1240 BNB  │
│         GitHub 来源 · 累计 0.0234 BNB  [领取按钮] │
└──────────────────────────────────────────────────┘
```

**来源标注规则：**

| `source` 字段 | 显示文案 |
|--------------|---------|
| `"github"` | GitHub 来源 |
| `"zip"` | 社区上传 |

**列表为空时：** 当前无空态处理，正式版需展示"暂无可领取收益"占位图。

---

### 3.2 claimStatus 状态机

每条技能有独立的 `claimStatus`，决定行右侧显示哪种控件：

```
unclaimed（未认领，来源为 zip）
  └─ 触发条件：ZIP 技能尚未通过「发现认领」审核
  └─ 显示：「前往认领 →」金色按钮
  └─ 点击 → setMainTab("discover")，切换到 Tab B

review（审核中）
  └─ 触发条件：ZIP 技能已提交争议申请，等待人工审核
  └─ 显示：转圈 Spinner + "审核中" 灰色徽章，不可操作

rejected（已拒绝）
  └─ 触发条件：平台审核驳回争议申请
  └─ 显示：「重新申请 →」红色按钮 + 行下方显示拒绝原因
  └─ 点击 → 切换到 Tab B，预填上次申请字段

approved（已通过）
  └─ 触发条件：GitHub 来源自动通过，或 ZIP 争议审核通过
  └─ 显示：待领取金额 + 领取按钮（见 3.3）
```

---

### 3.3 领取按钮状态机

仅 `claimStatus === "approved"` 的技能行显示领取按钮：

```
idle（可领取）
  └─ 触发条件：approved + 余额 ≥ 0.1 BNB + 今日未领 + 无其他领取中
  └─ 样式：绿色背景「领取」
  └─ 点击 → 进入 claiming 态

claiming（结算中）
  └─ 触发条件：点击「领取」后
  └─ 样式：转圈 Spinner + "结算中" + 按钮禁用
  └─ 模拟延迟：1800ms
  └─ 结算后 → 根据金额跳转 claimed 或 failed

claimed（已领取）
  └─ 触发条件：结算成功（pendingAmt ≥ 0.1 BNB）
  └─ 样式：绿色"✓ 已领取" + "预计 24h 内到账"小字
  └─ 当日锁定：同一技能今日不可再领（claimedToday Set）

failed（领取失败）
  └─ 触发条件：pendingAmt < 0.1 BNB（低于最低门槛）
  └─ 样式：红色"领取失败" + "余额不足 0.1 BNB，无法到账"
  └─ 按钮置灰禁用，不可重试

todayDone（今日已领）
  └─ 触发条件：同一技能当日已成功领取
  └─ 样式：灰色"今日已领"，按钮禁用
```

**互斥锁：** 任一技能处于 `claiming` 状态时（`claimingId !== null`），所有其他技能的领取按钮均禁用（`btnDisabled = !!claimingId || ...`）。

**规则提示栏（常驻）：**

```
GitHub 来源自动入账  |  每代币每日限领 1 次  |  最低 0.1 BNB 方可领取  |  ZIP 技能须先通过发现认领 →
```

---

## 4. Tab B：发现认领

### 4.1 流程总览

```
进入「发现认领」Tab
       │
       ▼
┌─────────────────────────────┐
│  第一步：绑定 GitHub 账号    │  ← ghAuthStatus: idle / connecting / done
└─────────────────────────────┘
       │ GitHub 绑定成功后解锁
       ▼
┌─────────────────────────────┐
│  第二步：收益到账钱包        │  ← 根据 GitHub 账号是否关联钱包，分两种场景
└─────────────────────────────┘
       │ 钱包已绑定后可继续
       ▼
┌─────────────────────────────┐
│  第三步：ZIP 文件认领        │  ← 提交争议申请，等待人工审核后解锁收益
└─────────────────────────────┘
```

---

### 4.2 第一步：GitHub 账号绑定

**状态机：**

```
idle
  └─ 触发条件：初始进入、或解除绑定后
  └─ 显示：说明文字 + 白色「绑定 GitHub 账号」按钮 + 免责小字
  └─ 点击 → ghAuthStatus = "connecting"

connecting
  └─ 触发条件：点击绑定按钮后
  └─ 显示：GitHub 图标 + 旋转 Spinner + "正在连接 GitHub..."
  └─ 模拟延迟：1200ms → ghAuthStatus = "done"
  └─ 同时：从后端获取该 GitHub 账号关联的钱包地址，写入 discoverWallet

done
  └─ 触发条件：OAuth 授权完成
  └─ 显示：绿色「@用户名 已绑定」徽章 + 「解除绑定」文字按钮
  └─ 解除绑定 → 重置所有钱包状态，回到 idle
```

**解除绑定重置范围：**

```js
setGhAuthStatus("idle")
setGhUser(null)
setDiscoverWallet("")
setDiscoverWalletInput("")
setDiscoverWalletModified(false)
setDiscoverWalletEditing(false)
```

---

### 4.3 第二步：收益到账钱包

**仅在 `ghAuthStatus === "done"` 后显示。**

根据 GitHub 账号是否有关联钱包，分两种场景：

#### 场景 A：账号已关联收益钱包

```
触发条件：doGithubLogin 时后端返回非空 wallet 地址
          → discoverWallet 被预填为关联地址

显示：
  ┌─────────────────────────────────────────────┐
  │ 🔶 0x168af1...bbc6e6              ✓（绿勾）│
  └─────────────────────────────────────────────┘
  右上角：[修改] 金色文字按钮（首次可见）

交互规则：
  - 首次：显示「修改」→ 点击进入编辑态 → 确认后 discoverWalletModified = true
  - 修改后：「修改」消失，右上角改为「🔒 已绑定，不可修改」
  - 之后：永久只读，walletCanEdit = false
```

#### 场景 B：账号无关联钱包

```
触发条件：doGithubLogin 时后端返回空字符串 wallet
          → discoverWallet = "" → walletBound = false

显示：
  ┌─────────────────────────────────────────────────────┐
  │  0x... 认领收益将发送至此地址      [确认绑定]         │
  └─────────────────────────────────────────────────────┘
  下方：「绑定后仅可修改一次，请确认地址无误」提示

交互规则：
  - 输入地址 → 点击「确认绑定」→ discoverWallet = 输入值
  - 绑定后进入「已绑定」只读态，行为同场景 A 修改后状态
```

**关键派生变量：**

```js
walletBound   = !!discoverWallet.trim()               // 是否已绑定
walletCanEdit = walletBound                            // 可修改
              && !discoverWalletModified               // 未用过修改机会
              && !discoverWalletEditing                // 非编辑中
```

---

### 4.4 第三步：ZIP 文件认领

**仅在 GitHub 已绑定（`ghAuthStatus === "done"`）后显示，不强制要求钱包已绑定才展示表单，但提交需要钱包已填写（按钮 `disabled` 判断）。**

**场景说明：** 当有第三方使用了开发者的 ZIP 文件发行代币，开发者通过此入口提交争议申请，平台审核通过后解锁收益。

**表单字段：**

| 字段 | 必填 | 校验规则 |
|------|------|---------|
| 您的技能名称 | 是 | 非空 |
| 代币合约地址 | 是 | 非空，建议格式校验 `0x...` |
| 补充说明 | 是 | 非空，建议描述开发历史、原始仓库等证明信息 |
| 截图附件 | 否 | 仅支持图片格式，最多 4 张，FileReader 转 DataURL 预览 |

**提交按钮 disabled 条件（全部需满足才可点击）：**

```js
disabled = disputeSubmitting
        || !discoverWallet.trim()    // 收益钱包未填
        || !skillName.trim()
        || !tokenAddr.trim()
        || !note.trim()
```

**提交流程（当前 Mock）：**

```
点击「提交争议申请」
  → disputeSubmitting = true
  → 写入 disputes 数组（status: "reviewing"）
  → 清空表单 + 截图
  → disputeSubmitting = false（模拟同步完成）
  → 3000ms 后：该条 dispute.status = "approved"（模拟审核通过）
```

---

### 4.5 争议申请状态机

```
reviewing（审核中）
  └─ 触发条件：提交申请后
  └─ 显示：转圈 Spinner + "审核中" 黄色徽章

approved（已通过）
  └─ 触发条件：平台审核通过
  └─ 显示：绿色"已通过"徽章 + 「前往领取收益 →」按钮
  └─ 点击「前往领取收益」：
       setSkills(prev => [...prev, { source:"zip", claimStatus:"approved", ... }])
       setMainTab("mine")

rejected（未通过）
  └─ 触发条件：平台审核驳回
  └─ 显示：红色"未通过"徽章 + 拒绝原因文字 + 「重新申请」按钮
  └─ 点击「重新申请」：
       预填上次申请的 skillName + tokenAddr 到表单
       从 disputes 列表移除该条（允许重新提交）
```

**争议记录展示逻辑：** 提交新申请前，上方展示历史争议记录（按提交时间倒序，Mock 为静态数组）。已通过/已拒绝记录保留展示，仅驳回记录提供「重新申请」操作入口。

---

## 5. 作者验证状态卡片（VerifiedAuthorCard）

**位置：** 「我的代币」页面 → 选中代币后 → 详情区域右侧固定卡片（`width: 300px; flexShrink: 0`）

**组件签名：**

```jsx
function VerifiedAuthorCard({
  verifyStatus = "unverified",   // "verified" | "pending" | "unverified"
  earlyApplied = false,          // 是否为提前认证申请用户
  walletAddress = "",            // 初始受益人钱包地址
  taxRate       = "1%",          // 协议税率（展示用）
  devFundShare  = "70%",         // 开发者基金份额（未验证时置灰）
  onVerify      = ()=>{}         // 点击「认证 →」的回调（跳转到发现认领）
})
```

---

### 5.1 三种状态定义

**状态判定逻辑（关键）：**

```js
const verified = verifyStatus === "verified"

// 审核中状态只对提前认证申请用户显示
// earlyApplied = false 时，pending 数据被视同 unverified
const pending  = verifyStatus === "pending" && earlyApplied
```

| 状态 | 触发条件 | 面向人群 |
|------|---------|---------|
| `verified`（已验证作者） | `verifyStatus === "verified"` | 完成身份验证的技能开发者 |
| `pending`（验证审核中） | `verifyStatus === "pending"` **且** `earlyApplied === true` | 提交了提前认证申请、等待审核的用户 |
| `unverified`（未验证作者） | `verifyStatus === "unverified"`，或 `verifyStatus === "pending"` 但 `earlyApplied === false` | 所有普通用户（含后台处于 pending 但未申请提前认证的用户） |

> **设计意图：** 普通用户无论后台状态如何，始终只看到「已验证」或「未验证」两种状态，避免暴露内部审核流程状态造成困扰。`pending` 进度展示是提前认证申请者的专属反馈。

---

### 5.2 状态展示规则

#### 已验证作者

```
视觉：
  盾牌图标（绿色）+ "已验证作者" 白色标题
  右侧：绿色实心圆点（发光效果）
  头像区：绿色渐变圆形 + 白色"+"图标
  边框：#242424（默认暗色）

数据展示：
  税率：1%（白色）
  开发者基金份额：70%（白色，正常显示）

受益人钱包：
  已绑定 → 显示地址（可外链）+ hover 展示外链图标
  未绑定 → 虚线框"点击绑定收益钱包"（可点击进入编辑态）
  修改权限：仅可修改一次（walletChanged 标志）
```

#### 验证审核中（仅提前认证申请用户）

```
视觉：
  盾牌+时钟图标（蓝色）+ "验证审核中" 白色标题
  右侧：蓝色旋转 Spinner（spinner-b 动画类）
  头像区：深蓝色渐变 + 蓝色时钟图标 + pendingPulse 脉冲动画
  边框：rgba(96,165,250,.18)（蓝色半透明，区别于其他状态）

信息条（蓝色背景）：
  ⓘ 验证申请审核中
    您的申请已提交，平台正在审核中，请耐心等待。
    为避免重复处理，请勿再次提交申请。

数据展示：
  税率：1%（白色）
  开发者基金份额：70%（置灰，未通过前不计入）

受益人钱包：
  虚线框"审核通过后自动绑定"（不可点击，cursor: default）
  不显示「修改」按钮（!editing && !pending 判断）
```

#### 未验证作者

```
视觉：
  盾牌+感叹号图标（黄色）+ "未验证作者" 白色标题
  右侧：黄色实心圆点（发光效果）
  头像区：深灰渐变 + 灰色"✕"图标

数据展示：
  税率：1%（白色）
  开发者基金份额：70%（置灰，muted 样式，color: #444）

受益人钱包：
  虚线框"完成认证后自动绑定"（不可点击）
  右上角显示「认证 →」黄色文字按钮，点击触发 onVerify() 回调
  （当前回调：跳转至「领取收益 → 发现认领」Tab）
```

---

### 5.3 受益人钱包交互

**完整状态机（仅 verified 状态下可操作）：**

```
未绑定（walletVal 为空）
  └─ 触发条件：verified + 未曾绑定过（walletChanged = false）
  └─ 显示：虚线框"点击绑定收益钱包"（hover 边框变金色）
  └─ 点击 → editing = true

编辑中（editing = true）
  └─ 触发条件：点击"点击绑定收益钱包"或点击"修改"按钮
  └─ 显示：输入框（autoFocus） + 「确认」/「取消」按钮
  └─ 确认 → walletVal = inputVal.trim(); walletChanged = true; editing = false
  └─ 取消 → editing = false（输入值丢弃）

已绑定（walletVal 非空，editing = false）
  └─ 触发条件：确认绑定后
  └─ 显示：钱包地址 + 外链图标（hover 变金色）
  └─ 若 walletChanged = false（首次绑定后）：右上角显示「修改」按钮
  └─ 若 walletChanged = true（已改过一次）：「修改」消失，右上角无操作

修改后永久锁定
  └─ walletChanged = true 后，不显示「修改」按钮
  └─ 钱包地址只读，无任何编辑入口
```

> **约束：** 受益人钱包修改机会仅 **1 次**，确认后不可再次更改。此规则对应链上合约的受益人地址绑定逻辑。

---

## 6. 状态变量总览

### ClaimModal 内部状态

| 状态变量 | 类型 | 初始值 | 作用 |
|---------|------|--------|------|
| `mainTab` | `"mine" \| "discover"` | `initialTab` | 当前激活 Tab |
| `skills` | `Skill[]` | `MOCK_REWARDS_INIT` | 领取收益列表数据源 |
| `claimingId` | `number \| null` | `null` | 当前正在链上结算的技能 ID，非空时全局禁用领取 |
| `claimedIds` | `Set<number>` | `new Set()` | 已领取成功的技能 ID 集合 |
| `claimedToday` | `Set<number>` | `new Set()` | 今日已领取的技能 ID（每日重置，正式版需持久化） |
| `failedClaimIds` | `Set<number>` | `new Set()` | 领取失败（余额不足）的技能 ID |
| `ghAuthStatus` | `"idle" \| "connecting" \| "done"` | `"idle"` | GitHub 绑定步骤状态 |
| `ghUser` | `{ login: string } \| null` | `null` | 已绑定的 GitHub 用户信息 |
| `discoverWallet` | `string` | `beneficiaryWallet` | 已确认绑定的收益钱包地址 |
| `discoverWalletInput` | `string` | `beneficiaryWallet` | 输入框草稿值（未确认） |
| `discoverWalletModified` | `boolean` | `false` | 是否已使用过一次修改机会 |
| `discoverWalletEditing` | `boolean` | `false` | 是否正处于钱包编辑模式 |
| `disputes` | `Dispute[]` | Mock 初始数据 | 争议申请历史记录 |
| `disputeFields` | `{ skillName, tokenAddr, note }` | 空字符串 | 新争议表单草稿 |
| `disputeImages` | `DataUrlImage[]` | `[]` | 上传截图预览，最多 4 张 |
| `disputeSubmitting` | `boolean` | `false` | 提交中锁定标志 |

**派生变量（非状态，计算属性）：**

```js
walletBound   = !!discoverWallet.trim()
walletCanEdit = walletBound && !discoverWalletModified && !discoverWalletEditing
busy          = claimingId !== null          // Modal 不可关闭
canClose      = !busy
```

### VerifiedAuthorCard 内部状态

| 状态变量 | 类型 | 初始值 | 作用 |
|---------|------|--------|------|
| `editing` | `boolean` | `false` | 受益人钱包是否处于编辑模式 |
| `walletVal` | `string` | `walletAddress prop` | 已确认的钱包地址 |
| `inputVal` | `string` | `walletAddress prop` | 编辑模式下的草稿值 |
| `walletHov` | `boolean` | `false` | 已绑定地址行的 hover 状态（显示外链图标） |
| `walletChanged` | `boolean` | `false` | 是否已使用过一次修改机会 |

---

## 7. API 接口预期

### 7.1 GitHub OAuth 绑定

```
POST /api/auth/github/bind
Authorization: Bearer <user_session_token>

Body (JSON):
{
  "code": "<GitHub OAuth code>"     // 前端从 OAuth 回调中获取
}

Response 200:
{
  "githubLogin": "username",
  "linkedWallet": "0x..."           // 该 GitHub 账号已关联的收益钱包，无则 ""
}
```

**触发时机：** `doGithubLogin()` 发起 OAuth 弹窗，回调后携带 `code` 调用此接口。

---

### 7.2 收益钱包绑定 / 修改

```
POST /api/user/wallet/bind
Authorization: Bearer <user_session_token>

Body (JSON):
{
  "walletAddress": "0x...",
  "githubLogin":   "username"       // 关联到哪个 GitHub 账号
}

Response 200:
{
  "success": true,
  "locked": false        // 首次绑定：false；已使用修改机会后：true
}

Response 409:
{
  "error": "WALLET_LOCKED",
  "message": "该账号已使用过一次修改机会，钱包地址已永久锁定"
}
```

**触发时机：**
- 场景 A（已有关联钱包）：点击「确认修改」时调用，成功后 `discoverWalletModified = true`
- 场景 B（无关联钱包）：点击「确认绑定」时调用

---

### 7.3 技能收益查询

```
GET /api/rewards?githubLogin={login}
Authorization: Bearer <user_session_token>

Response 200:
{
  "skills": [
    {
      "id": "skill_abc123",
      "name": "Code Review Agent",
      "icon": "🤖",
      "source": "github",            // "github" | "zip"
      "claimStatus": "approved",     // "unclaimed" | "review" | "approved" | "rejected"
      "pending": "0.1240 BNB",
      "earned":  "0.0234 BNB",
      "rejectReason": ""             // 仅 rejected 时有值
    }
  ]
}
```

---

### 7.4 领取收益（链上结算）

```
POST /api/rewards/claim
Authorization: Bearer <user_session_token>

Body (JSON):
{
  "skillId":       "skill_abc123",
  "walletAddress": "0x..."           // 受益人钱包
}

Response 200:
{
  "txHash":     "0x...",
  "estimatedArrival": "24h"
}

Response 400:
{
  "error": "BELOW_MINIMUM",          // 余额 < 0.1 BNB
  "error": "ALREADY_CLAIMED_TODAY",  // 今日已领
  "message": "..."
}
```

---

### 7.5 ZIP 争议申请提交

```
POST /api/disputes/submit
Content-Type: multipart/form-data
Authorization: Bearer <user_session_token>

Fields:
  skillName     string    required
  tokenAddr     string    required
  note          string    required
  images        File[]    optional    最多 4 张图片

Response 200:
{
  "disputeId": "dsp_xyz",
  "status":    "reviewing",
  "estimatedReview": "1-3 个工作日"
}
```

---

### 7.6 作者验证状态查询

```
GET /api/tokens/{tokenId}/verify-status
Authorization: Bearer <user_session_token>

Response 200:
{
  "verifyStatus": "verified" | "pending" | "unverified",
  "earlyApplied": true | false,      // 是否为提前认证申请用户
  "wallet":       "0x...",           // 受益人钱包，未绑定为 ""
  "taxRate":      "1%",
  "devFundShare": "70%"
}
```

---

## 8. 业务规则 & 约束

### 收益领取规则

| 规则 | 说明 |
|------|------|
| 最低门槛 | 单次领取 ≥ **0.1 BNB**，低于此值交易失败 |
| 每日限领 | 同一技能每自然日限领 **1 次**（正式版需后端校验） |
| 并发控制 | 同一 Modal 内，同时只允许 **1 笔** 领取请求在途 |
| 来源规则 | GitHub 来源技能自动获得 `approved` 状态；ZIP 来源技能须经「发现认领」审核通过后才出现在领取列表 |

### 收益钱包修改规则

| 规则 | 适用范围 | 说明 |
|------|---------|------|
| 仅可修改一次 | 发现认领 Tab + 已验证作者卡片 | 无论是账号关联的钱包还是手动输入的钱包，修改机会均只有 1 次 |
| 永久锁定 | 修改后 | `walletChanged / discoverWalletModified = true` 后，所有编辑入口消失 |
| 解绑重置 | 发现认领 Tab | 解除 GitHub 绑定会重置所有钱包状态，用户再次绑定 GitHub 时重走完整流程 |

### 提前认证状态显示规则

| 条件 | 用户看到的状态 |
|------|-------------|
| `verifyStatus = "verified"` | 已验证作者 |
| `verifyStatus = "pending"` 且 `earlyApplied = true` | 验证审核中 |
| `verifyStatus = "pending"` 且 `earlyApplied = false` | 未验证作者（后台状态不暴露给普通用户） |
| `verifyStatus = "unverified"` | 未验证作者 |

---

## 9. 待开发 / Mock 替换清单

| # | 模块 | 当前状态 | 正式版需求 |
|---|------|---------|-----------|
| 1 | GitHub OAuth | `setTimeout(1200ms)` 模拟 | 真实 GitHub OAuth 2.0 授权流程，回调携带 code 换 token |
| 2 | GitHub 关联钱包 | 硬编码 `"0x168af1..."` | GET /api/auth/github/bind 返回真实关联地址 |
| 3 | 技能收益列表 | `MOCK_REWARDS_INIT`（2 条） | GET /api/rewards?githubLogin=... |
| 4 | 领取结算 | `setTimeout(1800ms)` 模拟成功/失败 | POST /api/rewards/claim → 监听链上 tx 确认 |
| 5 | 每日限领重置 | `claimedToday` Set 不持久化，刷新即清零 | 后端记录每日领取状态，前端查询 API 初始化 |
| 6 | 争议提交 | 同步写 disputes 数组，3s 后自动 approved | POST /api/disputes/submit + Webhook 推送审核结果 |
| 7 | 验证状态 | `MOCK_TOKENS` 中硬编码 `verifyStatus` 和 `earlyApplied` | GET /api/tokens/{tokenId}/verify-status |
| 8 | 受益人钱包写入 | `walletVal` 仅存于组件内存 | POST /api/user/wallet/bind（含锁定状态校验） |
| 9 | 钱包地址外链 | `IconExternalLink` 无实际跳转 | 跳转至 `https://bscscan.com/address/{wallet}` |
| 10 | 截图上传 | FileReader DataURL 仅本地预览 | 随争议表单一同上传至 S3 / IPFS，后端返回 URL |
| 11 | 今日已领取状态初始化 | 每次打开 Modal 均为空 Set | 前端初始化时调用 /api/rewards 获取当日已领状态 |

---

*SafuSkill · Powered by Flap Protocol · BNB Chain*  
*研发规格文档 v1.1 · 2026-04-16*
