# SafuSkill · 领取收益界面 产品文档

**版本：** v2.3  
**所属页面：** 我的代币（MyTokens）→ 领取收益  
**更新日期：** 2026-04-22  
**适用对象：** 研发 / AI 开发  
**文档性质：** 专注于领取收益界面的交互逻辑与后端费用计算公式

---

## 目录

1. [开放状态控制](#1-开放状态控制)
2. [内盘与外盘说明](#2-内盘与外盘说明)
3. [税费分配机制](#3-税费分配机制)
4. [后端计算逻辑](#4-后端计算逻辑)
   - 4.1 [数据来源](#41-数据来源)
   - 4.2 [计算公式](#42-计算公式)
   - 4.3 [应计收益与可提现余额的差异](#43-应计收益与可提现余额的差异)
   - 4.4 [台账同步机制](#44-台账同步机制)
5. [Loading 状态与提示文案](#5-loading-状态与提示文案)
   - 5.1 [领取操作 Loading 链路](#51-领取操作-loading-链路)
   - 5.2 [税费到账等待提示](#52-税费到账等待提示)
   - 5.3 [页面初始化 Loading](#53-页面初始化-loading)
6. [领取收益 Tab 界面](#6-领取收益-tab-界面)
   - 6.0 [收益概览区](#60-收益概览区)
   - 6.1 [全局提示区](#61-全局提示区)
   - 6.2 [技能行状态机](#62-技能行状态机)
   - 6.3 [领取操作流程](#63-领取操作流程)
   - 6.4 [领取约束条件](#64-领取约束条件)

---

## 1. 开放状态控制

**上线时间：** 2026-04-25 00:00（北京时间）

| 阶段 | 标题显示 | 按钮状态 |
|------|---------|---------|
| 上线前（< 4月25日） | 「领取收益（预计在 2026 年 4 月 25 日开放）」 | 全部禁用，不可点击 |
| 上线后（≥ 4月25日） | 「领取收益」 | 正常可操作 |

- 无倒计时显示，仅做静态开关控制
- 上线后移除标题附加文字，同时解除按钮禁用状态
- 判断逻辑：`new Date() >= new Date("2026-04-25T00:00:00+08:00")`

---

## 2. 内盘与外盘说明

| 概念 | 含义 | 阶段 |
|------|------|------|
| **内盘**（Bonding Curve） | 代币发行初期，在 Flap 协议联合曲线合约上买卖，价格由 `(x+h)(y+r)=K` 自动定价 | 流通量达到总量 80% 前 |
| **外盘**（DEX） | 流通量达到 80% 后自动迁移至 PancakeSwap 等去中心化交易所，进入公开市场 | 迁移后 |

内盘和外盘的买卖交易均写入 `gh_token_trades`，税费计算机制不变，开发者可领取收益在两个阶段持续累计。

---

## 3. 税费分配机制

每笔买卖交易产生 **1% 协议税费**，按以下比例分配：

```
交易金额（BNB）× 1% = 本笔总税费
                │
                ├── 70% → Skill 开发者可领取收益
                ├── 15% → Skill 激励层（下载用户激励，市值达标后触发空投）
                └── 15% → 平台收益
```

### 各层计算公式

**Skill 开发者（70%）**
```
单笔开发者收益 = (bnb_amount ÷ 10^18) × 0.007
```

**Skill 激励层（15%）**
```
单笔激励层累计 = (bnb_amount ÷ 10^18) × 0.0015
触发条件：该代币激励层累计达到目标市值阈值 → 自动空投至曾下载该 Skill 的用户
```

**平台收益（15%）**
```
单笔平台收益 = (bnb_amount ÷ 10^18) × 0.0015
```

> 三层合计：`0.007 + 0.0015 + 0.0015 = 0.01`，即总税率 1%，分配比例之和 100%。

---

## 4. 后端计算逻辑

### 4.1 数据来源

税费收益计算基于链上买卖交易监控表 `gh_token_trades`，平台后端实时监控链上事件并写入该表。

**完整字段说明：**

| 字段 | 类型 | 说明 | 用途 |
|------|------|------|------|
| `id` | bigint | 自增主键 | 增量同步游标，每次同步取 `id > last_sync_id` |
| `token_address` | varchar(42) | 被交易的代币合约地址（0x...） | 按代币归因，关联 `gh_on_chain_tokens` |
| `chain_id` | int | 链 ID（BNB Chain = 56） | 多链扩展预留，当前固定为 56 |
| `block_number` | bigint | 交易所在区块高度 | 链上排序参考，可用于对账 |
| `tx_hash` | varchar(66) | 链上交易哈希 | 唯一标识一笔交易，前端「领取记录」可跳转 BSCScan |
| `is_buy` | tinyint(1) | 交易方向：1 = 买入，0 = 卖出 | **买卖均产生税费，计算时不区分方向** |
| `token_amount` | varchar(78) | 本次交易的代币数量（wei 单位） | 暂不参与税费计算，供行情展示用 |
| `bnb_amount` | varchar(78) | 本次交易的 BNB 数量（wei 单位，**gross 税前**） | **税费计算核心字段**，÷ 10^18 换算为 BNB |
| `price_raw` | varchar(78) | 成交价格（raw，链上精度） | 行情/K线展示用，不参与税费计算 |
| `supply_raw` | varchar(78) | 成交时的代币流通量（raw） | 判断内盘/外盘阶段参考，不参与税费计算 |
| `block_ts` | bigint | 区块时间戳（unix 秒） | 按时间维度统计收益趋势、每日限领重置判断 |

**索引说明：**

| 索引 | 字段 | 作用 |
|------|------|------|
| `PRIMARY KEY` | `id` | 增量同步主键 |
| `uk_token_trades_tx_side` | `(tx_hash, is_buy)` | 防止同一笔交易重复写入，买卖各唯一 |
| `idx_token_trades_addr_ts` | `(token_address, block_ts DESC)` | 按代币查询近期交易，台账同步高频查询 |
| `idx_token_trades_block` | `block_number` | 按区块高度检索，对账使用 |

**外键约束：** `token_address` 关联 `gh_on_chain_tokens`，代币下架时级联删除交易记录（`ON DELETE CASCADE`）。

---

### 4.2 计算公式

**核心前提：**
- `bnb_amount` 为 gross 额（用户实际支付 / 收到的 BNB，税前）
- 买入和卖出均收税，`is_buy` 不影响计算
- 税率固定 1%，开发者分成固定 70%，代币总量固定

**增量汇总 SQL：**

```sql
SELECT
  token_address,
  SUM(CAST(bnb_amount AS DECIMAL(65,0))) / POW(10,18) * 0.007  AS developer_accrued,
  SUM(CAST(bnb_amount AS DECIMAL(65,0))) / POW(10,18) * 0.0015 AS incentive_accrued,
  SUM(CAST(bnb_amount AS DECIMAL(65,0))) / POW(10,18) * 0.0015 AS platform_accrued
FROM gh_token_trades
WHERE id > :last_sync_id
GROUP BY token_address;
```

---

### 4.3 Treasury 机制与可提现余额

**关键前提：Treasury 是全平台共用的单一收款地址。**

平台所有代币产生的税费，均由 Flap 合约批量打入同一个 Treasury 地址，链上无法区分每笔收款来自哪个代币。因此：

- 后端对每个代币的应计收益，**只能通过 `gh_token_trades` 推算**，无法从链上收款记录中直接拆分归因
- Treasury 余额是全平台税费的共同池子，服务于所有代币的开发者打款

```
Treasury 地址
  ← 代币 A 的税费（Flap 批量）
  ← 代币 B 的税费（Flap 批量）     → 混合无法区分
  ← 代币 C 的税费（Flap 批量）
```

**两个关键数字：**

| 数字 | 含义 | 来源 |
|------|------|------|
| **总应计未领取**（total_pending） | 全平台所有开发者 `pending_bnb` 之和 | `developer_reward_ledger` 汇总 |
| **Treasury 余额**（treasury_balance） | Treasury 地址实际 BNB 余额 | 链上余额查询 |

**打款前置校验（必须满足）：**

```
treasury_balance ≥ total_pending_of_current_batch（本批次待打款总额）

若不满足 → 进入队列，等待 Flap 下次批量结算补充 Treasury 后再处理
```

**并发控制：**

同一时间多个开发者发起领取时，需串行处理或原子锁，防止 Treasury 余额被多次超额扣减。每笔打款完成后实时更新可用余额再处理下一笔。

**前端展示逻辑：**

前端「可领取」始终展示应计收益（`pending_bnb`），不感知 Treasury 余额状态。若 Treasury 余额不足，用户点击领取后显示「处理中，预计 24 小时内到账」，后台队列自动处理，无需用户重试。

---

### 4.4 台账同步机制

后端维护 `developer_reward_ledger`，建议每 5 分钟增量同步：

```
1. 读各代币 last_sync_id
2. 查 gh_token_trades WHERE id > last_sync_id
3. 按 token_address 汇总：
     developer_accrued += SUM × 0.007
     incentive_accrued += SUM × 0.0015
     platform_accrued  += SUM × 0.0015
4. pending_bnb = developer_accrued - claimed_bnb
5. last_sync_id = MAX(id)
```

---

## 5. Loading 状态与提示文案

### 5.1 领取操作 Loading 链路

点击「领取」后依次经历以下阶段，每个阶段对应独立的界面文案：

| 阶段 | 状态标识 | 主文案 | 副文案 |
|------|---------|--------|--------|
| 钱包授权中 | `authorizing` | 钱包授权中... | 请在钱包弹窗中确认授权 |
| 授权成功 | `authorized` | 授权成功 ✓ | 正在提交链上请求 |
| 链上处理中 | `onchain` | 链上处理中... | 交易已提交，等待区块确认 |
| 领取成功 | `waiting` | ✔ 已领取 | 税费将在 24 小时内打入您的收益钱包，请耐心等待 |
| 领取失败（余额不足） | `failed_min` | 领取失败 | 可领取收益不足 0.1 BNB，无法发起结算 |
| 领取失败（链上错误） | `failed_chain` | 领取失败 | 链上交易异常，请稍后重试 |
| 24h 后已到账 | `arrived` | ✔ 已到账 | 税费已成功打入您的收益钱包 |
| 24h 后超时未到账 | `delayed` | ⚠ 未到账 | 到账超时，可能因链上拥堵，联系客服 → |

**Toast 通知顺序（右下角依次弹出）：**

```
① 「钱包授权中...」      → 旋转 Spinner + 黄色
② 「授权成功」           → 绿色勾 + 绿色（1.5s 后自动消失）
③ 「链上处理中...」      → 旋转 Spinner + 蓝色
④ 「领取成功！」         → 绿色勾 + 绿色 + 「预计 24h 内到账」
   或「领取失败」         → 红色叉 + 红色 + 错误原因
```

---

### 5.2 税费到账等待提示

税费由 Flap 合约批量结算后打入平台 Treasury，再由平台分发至创作者收益钱包，全链路预计 **24 小时内**完成。

**领取成功后界面提示（常驻该技能行）：**

```
✔ 已领取
⏱ 税费将在 24 小时内打入您的收益钱包，请耐心等待
```

**超时未到账——触发条件：发起认领 24h 后仍未到账**

```
⚠ 未到账
到账超时，可能因链上拥堵，联系客服 →
```

触发逻辑：
- 用户成功发起认领（`arrivalStatus = "waiting"`）后，后端计时 24h
- 24h 内平台完成打款 → `arrivalStatus = "arrived"`（已到账）
- 24h 后仍未检测到打款 → `arrivalStatus = "delayed"`（超时未到账）
- 前端读取 `arrivalStatus` 字段渲染对应状态，**不由前端计时触发**

---

### 5.3 页面初始化 Loading

| 场景 | 文案 |
|------|------|
| 收益列表加载中 | 「正在加载您的收益数据...」+ 全屏 Spinner |
| 加载失败 | 「数据加载失败，请刷新重试」+ 重试按钮 |
| 暂无已认证技能 | 「您还没有已认证的技能」+ 引导文字「前往发现认领 →」 |

---

## 6. 领取收益 Tab 界面

### 6.0 收益概览区

位于「领取规则」栏上方，两栏横向布局，实时计算展示：

```
┌─────────────────────┬─────────────────────┐
│  待领取收益          │  累计已领取          │
│  +0.1690 BNB        │  0.8910 BNB         │
│  1 个技能可领取      │  历史累计到账        │
└─────────────────────┴─────────────────────┘
```

> 示例数据（对应4个技能）：  
> 待领取 = skill1(0.1240) + skill2(0.0450) + skill3(0) + skill4(0) = **0.1690 BNB**，其中仅 skill1 ≥ 0.1 可领取  
> 累计已领取 = 0.3820 + 0.1170 + 0.2340 + 0.1580 = **0.8910 BNB**

**字段计算逻辑（前端实时计算，不依赖后端额外接口）：**

**待领取收益**
```
totalPending = SUM(skill.pending_bnb)
               对所有 claimStatus === "approved" 的技能求和
               领取成功后该技能 pending 立即清零，totalPending 同步减少
```

**累计已领取收益**
```
totalEarned = SUM(skill.earned_bnb)
              对所有技能求和（包含历史已领取 + 本次会话刚领取的）
              领取成功后该技能 earned += pendingAmt，totalEarned 同步增加
```

| 字段 | 初始值来源 | 变化时机 |
|------|-----------|---------|
| `pending_bnb` | 后端 `developer_reward_ledger.pending_bnb` | 领取成功后前端立即清零 |
| `earned_bnb` | 后端 `developer_reward_ledger.claimed_bnb` | 领取成功后前端立即 += pendingAmt |

**领取成功后数据变化（前端立即更新，不等接口）：**

```
领取前：
  技能 A  pending = 0.1240 BNB，earned = 0.3820 BNB
  概览：  待领取 +0.1240 BNB，累计已领取 0.3820 BNB

点击领取 → Toast 流程走完 → 成功

领取后（skill 对象实时更新）：
  技能 A  pending = 0.0000 BNB，earned = 0.5060 BNB  ← pending 归并入 earned
  概览：  待领取 0.0000 BNB，累计已领取 0.5060 BNB   ← 实时体现
```

> **约束：** `earned_bnb` 的每一次增量必然 ≥ 0.1 BNB（因最低领取门槛为 0.1 BNB）。初始化时若 `earned > 0`，说明该技能历史至少发起过一次成功领取。

**待领取收益数额颜色：**

| 条件 | 颜色 |
|------|------|
| `totalPending ≥ 0.1 BNB` 且已开放 | 绿色 `#22c55e` |
| `totalPending < 0.1 BNB` 或未开放 | 暗灰 `#3a3a3a` |

**待领取副文案状态：**

| 状态 | 副文案 |
|------|-------|
| 未开放（< 4月25日） | 「功能尚未开放」|
| 有可领取技能（pending ≥ 0.1） | 「N 个技能可领取」|
| 有余额但不足 0.1 | 「余额不足 0.1 BNB」|
| 无待领取余额 | 「暂无可领取收益」|

**累计已领取数额颜色：**

| 条件 | 颜色 |
|------|------|
| `totalEarned > 0` | 金色 `#d4a017` |
| `totalEarned === 0` | 暗灰 `#3a3a3a` |

**实时更新时机：** 领取成功（Toast 第④阶段完成）后立即更新——`pending` 清零并归入 `earned`，概览区待领取减少、累计已领取增加，技能行副文案同步显示新 `earned` 值，无需页面刷新。

---

### 6.1 全局提示区

**钱包未绑定警告条**（`beneficiaryWallet === ""`）

黄色横幅：「收益钱包未绑定，税费收益将无法到账，请先前往「我的代币」绑定受益人钱包地址。」

**常驻规则提示栏：**

```
GitHub 来源自动入账  ·  每代币每日限领 1 次  ·  可领取收益超过 0.1 BNB 方可领取  ·  ZIP 技能须先通过「发现认领 →」
```

---

### 6.2 技能行状态机

每行按以下优先级判断，命中第一个渲染：

**① `claimStatus === "unclaimed"` 且 `source === "zip"`**
- 右侧：金色「前往认领 →」按钮，点击跳转「发现认领 → ZIP 文件」

**② `claimStatus === "review"`**
- 右侧：金色「审核中」标签 + 小 Spinner，无操作

**③ `claimStatus === "rejected"`**
- 行背景轻红色；右侧红色「重新申请 →」；行下方 `⚠ {rejectReason}`

**④ `claimStatus === "approved"`**

```js
pendingAmt  = parseFloat(r.pending)           // 来自 pending_bnb
arrival     = arrivalStatuses[r.id]           // "waiting"|"arrived"|"delayed"|undefined
isClaiming  = claimingId === r.id
isClaimed   = claimedIds.has(r.id)
todayDone   = claimedToday.has(r.id)
isFailed    = failedClaimIds.has(r.id)
btnDisabled = !isLaunched || !!claimingId || todayDone || isFailed
```

| 优先级 | 条件 | 右侧展示 | 颜色 |
|--------|------|---------|------|
| 1 | `arrival === "arrived"` | ✔ 已到账 + 「税费已成功打入您的收益钱包」 | 绿色，终态 |
| 2 | `arrival === "delayed"` | ⚠ 未到账 + 「到账超时，可能因链上拥堵，联系客服 →」 | 橙色，终态 |
| 3 | `arrival === "waiting"` 或 `isClaimed` | ✔ 已领取 + 「税费将在 24 小时内打入您的收益钱包，请耐心等待」 | 绿色 |
| 4 | `isClaiming` | 绿色 Spinner +「结算中」，全局禁用 | - |
| 5 | `isFailed` | 红色「领取失败」（禁用）+「✕ 余额不足 0.1 BNB，无法到账」 | 红色，终态 |
| 6 | `todayDone` | 灰色「今日已领」（禁用） | - |
| 7 | 其余 | 绿色「领取」（可点击）；`pending < 0.1` 时金额显示灰色 | - |

**`arrival` 字段说明：**

| 值 | 含义 | 来源 |
|----|------|------|
| `null` | 从未发起领取，或本次会话未领取 | 初始状态 |
| `"waiting"` | 已领取，24h 内等待到账 | 本次会话领取成功后前端写入 |
| `"arrived"` | 24h 后平台确认已打款 | 后端轮询结果写入，前端展示 |
| `"delayed"` | 24h 后仍未到账，超时 | 后端超时检测写入，前端展示 |

> **后端职责：** 24h 后由平台查询实际打款状态，更新 `arrivalStatus` 字段；前端读取该字段渲染对应状态，无需前端主动计时。

金额颜色：`pendingAmt < 0.1 || isFailed` → `#555`，否则 `#22c55e`

**每行展示结构：**
```
[图标]  技能名称                         +{pending_bnb} BNB  [操作按钮/状态]
        {来源标注} · 累计 {earned_bnb}
```
来源标注：`"github"` → 「GitHub 来源」；`"zip"` → 「社区上传」  
`earned_bnb` 领取成功后实时更新，无需刷新页面。

---

### 6.3 领取操作流程

```
点击「领取」
  ├─ claimingId = r.id（锁定全局所有领取按钮）
  ├─ Toast ①钱包授权中... → ②授权成功 → ③链上处理中...
  ↓ 等待链上确认
  ├─ pendingAmt >= 0.1
  │    → claimedIds + claimedToday 写入
  │    → arrivalStatuses[id] = "waiting"
  │    → skills[id].earned += pendingAmt，skills[id].pending = 0
  │    → Toast ④「领取成功！税费将在 24h 内到账」
  │    → 行右侧：「✔ 已领取 · 税费将在 24 小时内打入您的收益钱包，请耐心等待」
  └─ pendingAmt < 0.1
       → failedClaimIds 写入
       → Toast ④「领取失败：可领取余额不足 0.1 BNB」
       → 行右侧：「领取失败」（永久禁用）
  claimingId = null（解锁）

后续（由后端触发）：
  24h 后确认打款 → arrivalStatus = "arrived" → 行显示「✔ 已到账」
  24h 后超时     → arrivalStatus = "delayed" → 行显示「⚠ 未到账 · 联系客服 →」
```

---

### 6.4 领取约束条件

| 约束 | 规则 |
|------|------|
| 最低门槛 | 单个代币 `pending_bnb ≥ 0.1 BNB` 方可发起领取（`pendingAmt < 0.1` 则禁用） |
| 每日限领 | 同一代币每自然日仅可领取 1 次 |
| 并发控制 | `claimingId` 互斥锁，同一时刻只允许 1 笔进行中 |
| 到账时间 | 领取成功后预计 **24 小时**内到账 |
| 钱包前置 | 受益人钱包未绑定时领取入口不可用 |

---

*SafuSkill · Powered by Flap Protocol v5 · BNB Chain*  
*产品文档 v2.3 · 2026-04-22*
