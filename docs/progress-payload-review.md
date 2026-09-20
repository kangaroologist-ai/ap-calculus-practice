# DSP2 / QR 进度载荷审查

本文件是对当前 `ap-calculus-practice` 进度迁移实现的只读盘点。审查对象是实际导出路径 `makePortableProgress → encodeProgress`，并单独记录了 `encodeProgress` 直接接收旧快照时的差异。没有使用真实学生数据，也没有修改产品或 codec。

## 结论先行

当前导出的 DSP2 是一个固定 profile 的 11 元 JSON 数组，之后经过 zlib level 9、Base64URL 和 32-bit FNV-1a 校验。数组中的版本、FSRS 参数和技能目录由本地固定 profile 重建，因此它们不会重复出现在 DSP2 压缩正文中。应用导出前会复制进度、把每个技能的证据截到最近 2 条、把题目表达式签名换成 `q1:` + 128-bit SHA-256 前缀。

全课程 fixture 的实际导出形态为 26 个技能、52 条证据、31 个日计数、52 个唯一题目指纹：压缩 tuple JSON 5,193 字符，zlib 2,010 bytes，DSP2 2,694 字符，一张 URL QR 3,588 字符、版本 37-L。它已经走 DSA2 密集 QR 的单码路径。尚未逐项验证删字段后是否会降低 QR 版本；能够明显缩短载荷的字段通常同时承载可见功能或调度状态。

## 入口与编码层

| 层 | 当前内容 | 说明 |
|---|---|---|
| 应用导出 | `makePortableProgress(p)` 后调用 `encodeProgress` | `src/main.ts` 的导出入口明确经过这一步；最近证据截到 2 条，题目签名先指纹化。 |
| DSP2 | `DSP2.<8 位十六进制校验>.<Base64URL(zlib(JSON(tuple)))>` | 8 位校验是正文校验，不是认证。输入和输出分别受 131,072 字符、262,144 解压字节上限约束。 |
| DSP1 | `DSP1.<8 位十六进制校验>.<Base64URL(zlib(JSON(PortableProgress)))>` | 仅为旧快照导入保留；它会把版本字符串、FSRS 参数和对象键名直接放在 JSON 中。 |
| URL QR | `https://ap-calculus-practice.pages.dev/#progress=<payload>` | 数据在 URL fragment，不随页面请求发送；导入后地址栏清除。 |
| DSA2 | `DSA2.<大写校验>.<自定义 Base45 风格编码的压缩 bytes>` | DSP2 URL 超过 2,250 字符时优先尝试；正文恢复后重新组成 DSP2。 |
| DSQ1 | `DSQ1.<快照校验>.<1-based 序号>.<总片数>.<分片校验>.<最多 700 字符正文>` | 仅 DSA2 仍超过单码容量时分片，最多 188 片；收齐并验证整个 DSP2 后才能导入。 |

DSA2/DSQ1 只改变传输外壳，不增加学习字段。QR 校验、快照校验和题目指纹都不是加密或学生身份认证。

## DSP2 tuple 的 11 个位置

`packProgress` 返回数组，位置比对象键名更重要；profile=1 固定了以下顺序。

| 位置 | 值 | 当前实际含义 |
|---:|---|---|
| 0 | `1` | compact profile 版本；解码器只接受 1。 |
| 1 | `exportedAt` | 导出时的 epoch milliseconds；用于导入预览和时间校验，安装进本地进度后会被 `storage.replaceState` 移除。 |
| 2 | `updatedAt` | 最近一次进度更新时间的 epoch milliseconds；用于提示导入快照是否比本机旧。 |
| 3 | `unlockedLevel` | 已解锁等级，整数 1–6。 |
| 4 | `sequence` | 全局练习序号；错误诊断、`lastSeen`、`lastFailureAt` 和新题种子流程使用它。 |
| 5 | `streak` 或 `null` | 连续独立答对数；应用导出会把缺省值标准化为 0。 |
| 6 | `practiceDays` 或 `null` | 最多 31 个本地日历日 `YYYY-MM-DD → 整数计数`；当前 fixture 有 31 天。 |
| 7 | `signatures` | 去重后的题目签名字典；真实导出中是 `q1:` 指纹字符串，不是表达式。 |
| 8 | `recentQuestionSignatures` 的字典索引数组 | 最近最多 10 道已生成题的指纹，用于避免重复；当前 fixture 为空。 |
| 9 | `pendingDiagnostics` 的技能索引数组 | 错误后等待针对性检查的技能；当前 fixture 有 11 项。 |
| 10 | 技能行数组 | 每个已出现技能一行；最多 26 行。 |

profile 常量不在 DSP2 正文中，但解码后会重建并由 `assertProfile` / `validateSnapshot` 检查：课程版本 `ap-derivatives-1`；scheduler `5.4.2`；algorithm `v5.4.2 using FSRS-6.0`；技能索引顺序为

`constant, power, sum, root, exp, log, sin, cos, tan, cot, sec, csc, asin, acos, atan, product, quotient, chain, nested, mixed, implicit, inverse, higher, parametric, vector, polar`。

FSRS 参数固定为：`request_retention=0.9`、`maximum_interval=180`、`enable_fuzz=false`、`enable_short_term=true`、`learning_steps=["1m","10m"]`、`relearning_steps=["10m"]`，以及完整的 `w` 数组

`[0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542]`。

因此，DSP2 中没有物理存储 `curriculumVersion`、`schedulerPackageVersion`、`fsrsAlgorithmVersion` 或 `fsrsParameters`；它们是 profile 的隐式常量。DSP1 则会把这四个顶层字段原样存储。

## 每个技能行的 9 个位置

技能行是 `[skillIndex, card, recent, needsRemediation, failureStreak, lastFailureAt, otherSinceFailure, extraPracticeGiven, lastSeen]`。

| 行位置 | 值 | 精确语义 |
|---:|---|---|
| 0 | `skillIndex` | 上述固定 26 技能表的整数索引。 |
| 1 | `card` | 固定 10 元数组，顺序见下表。 |
| 2 | `recent` | 最多 5 条内部证据；实际应用导出为最近 2 条。每条是 `[signatureIndex, template, correctBit]`。 |
| 3 | `needsRemediation` | 0/1；是否处于补弱状态。 |
| 4 | `failureStreak` | 连续失败计数。界面在达到 3 次时显示重建提示。 |
| 5 | `lastFailureAt` | 失败时的全局 `sequence` 值；当前代码只写入它，没有读取它。 |
| 6 | `otherSinceFailure` | 该技能失败后经过的其他题数；调度补弱时使用。 |
| 7 | `extraPracticeGiven` | 0/1；防止同一补弱状态重复给额外练习，除非到期。 |
| 8 | `lastSeen` | 最近一次选中/完成该技能的全局序号；用于技能排序。 |

`card` 的 10 个位置为：

`[due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, learning_steps, state, last_review]`。

`due` 和 `last_review` 是 epoch milliseconds 的数值；没有 `last_review` 时 compact tuple 使用 `null`，解包后恢复为缺省字段。其余 FSRS 数值按原始 JS number 写入；实现没有定点化、截断或四舍五入。`validateSnapshot` 要求所有值 finite，`state` 为 0–3，`reps`/`lapses`/`learning_steps` 为整数，`difficulty≤10`、`stability≤1e6`；日期还受当前时间窗口约束。已有回归覆盖小数稳定度/难度，以及带 `.25`、`.75` 的时间戳，编码后深相等。

## 题目身份与证据

生成器的原始题目签名是 `JSON.stringify([skillId, template, sourceExpr])`。`questionFingerprint` 对该 UTF-8 字符串取 SHA-256 的前 128 bits，并输出固定 35 字符形式 `q1:` 加 32 个小写十六进制字符。它用于：

- 当前技能最近证据的去重和 Ready 判断；
- 全局最近题队列的重复规避；
- 跨旧 raw signature / 新 fingerprint 的一致比较。

因此它保留技能、模板和生成表达式的身份关系，但不包含题目公式本身、seed、prompt、answer、hint、步骤或学生输入；它是重复检测标识，不是认证。compact 字典在本 fixture 有 52 个唯一指纹，每个 35 字符。

`makePortableProgress` 的导出裁剪是当前真实功能边界：每个技能只取 `recent.slice(-2)`，并把其中的 `q` 指纹化；全局 `recentQuestionSignatures` 也指纹化但最多保留 10 条。`validateSnapshot` 和 `packProgress` 本身仍允许最多 5 条 `recent`；测试 fixture 直接传给 `encodeProgress` 时会保留 26×5=130 条，这不是应用导出路径。

## 当前 fixture 的尺寸拆分

以下是 `node_modules/.bin/tsx scripts/qr-size-audit.ts` 的当前输出。`tupleJsonChars` 是 compact 数组 JSON，`compactChars` 是 `DSP2...` 可复制代码；QR 的 `chars` 是实际 URL/DSA2/分片 frame 字符数。

| 场景 | 技能 | 证据 | 日计数 | tuple JSON | zlib bytes | DSP2 | QR chars / EC / version |
|---|---:|---:|---:|---:|---:|---:|---|
| initial | 0 | 0 | 0 | 52 | 34 | 60 | 109 / M / 7 |
| ten-real-questions | 5 | 10 | 1 | 939 | 397–399 | 544–546 | 593–595 / M / 19 |
| full26-each5-varied-FSRS-31days（应用导出后的 2 条/技能） | 26 | 52 | 31 | 5,193 | 2,018–2,020 | 2,705–2,708 | 约 3,581–3,642 / L / 37 |
| fixture-portable | 26 | 52 | 31 | 5,193 | 2,010 | 2,694 | 3,588 / L / 37 |

对 `fixture-portable` 的 5,193 个 tuple JSON 字符，顶层贡献如下；数组括号和 10 个顶层逗号共 12 字符。

审计脚本生成 full 场景时，`finishQuestion` 会写入当前墙上时钟，所以这些合成场景的时间戳、压缩字节和 URL percent-encoding 字符数会在重复执行间轻微变化；`fixture-portable` 使用 fixture 自带的固定时间戳，表中数值稳定。

作为边界对照，直接把未经过 `makePortableProgress` 的 raw fixture 传给 `encodeProgress` 会得到 26×5=130 条证据、130 个字典项、12,149 字符 tuple JSON、2,336 zlib bytes 和 3,126 字符 DSP2，并退化为 5 个 DSQ1 分片（727、727、727、727、353 字符）。这条路径只出现在测试/兼容场景，不是首页 Export progress 的调用链。

| tuple 位置 | 原始 JSON 字符 |
|---:|---:|
| 0–5 的 profile/timestamps/level/sequence/streak 标量合计 | 32 |
| 6 `practiceDays` | 467 |
| 7 `signatures`（52×35 字符指纹 + JSON 语法） | 1,977 |
| 8 全局最近题队列 `[]` | 2 |
| 9 11 项 `pendingDiagnostics` 索引 | 28 |
| 10 26 技能行 | 2,675 |
| 合计 | 5,193 |

技能行 2,675 字符由 26 行构成，行 JSON 合计 2,648 字符；其中 `card` 数组 1,629，52 条证据数组 484，技能索引及行/列语法占余量，6 个状态字段合计约 415 字符。平均每行 101.85 字符，平均每技能 2 条证据。

为避免把“删除一个数组值”的无效试验误当成可直接改动，下面仅列出按相同 JSON/zlib/base64 流程做的尺寸模拟；每项都需要新的 profile、解码器和迁移，不能读取现有 DSP2。

| 候选 | fixture tuple 变化 | zlib 变化 | DSP2 变化 | 功能代价 |
|---|---:|---:|---:|---|
| 去掉 `practiceDays` | 5,193 → 4,725（−468） | 2,010 → 1,882（−128） | 2,694 → 2,524（−170） | 失去“今日已练”和 31 天活动历史；这是当前最大、最直接的可见节省。 |
| 去掉每行 `skillIndex`，按固定目录顺序解释 | 5,193 → 5,125（−68） | 2,010 → 1,950（−60） | 2,694 → 2,614（−80） | 需要始终规范化行顺序；稀疏技能、旧 profile 和迁移更脆弱。 |
| 去掉当前未读取的 `lastFailureAt` | 5,193 → 5,105（−88） | 2,010 → 1,953（−57） | 2,694 → 2,618（−76） | 当前行为无直接变化，但丢失失败序号历史；需新 profile/迁移，未来诊断不能使用它。 |
| 去掉 `lastSeen` | 5,193 → 5,100（−93） | 2,010 → 1,957（−53） | 2,694 → 2,624（−70） | 改变技能选择的最近使用排序；会改变练习路径。 |
| 去掉 `pendingDiagnostics` | 5,193 → 5,164（−29） | 2,010 → 1,996（−14） | 2,694 → 2,676（−18） | 错误后不再优先安排 prerequisite targeted check。 |
| 题目指纹改为 16-byte Base64URL，保留 `q1:` | 5,193 → 4,673（−520） | 2,010 → 2,003（−7） | 2,694 → 2,685（−9） | 需要新指纹表示和兼容迁移；zlib 后收益很小。 |
| 证据去掉 `template` | 5,193 → 5,089（−104） | 2,010 → 2,002（−8） | 2,694 → 2,684（−10） | 无法验证最近两题覆盖两种结构，Ready/解锁规则改变。 |
| 证据去掉 `correct` | 5,193 → 5,089（−104） | 2,010 → 2,003（−7） | 2,694 → 2,685（−9） | 无法表达独立答对、补弱和 FSRS Good/Again 证据。 |

去掉 `exportedAt`、`streak` 或空的 `recentQuestionSignatures` 各只减少约 1 个 DSP2 字符；去掉 `updatedAt` 约 2 个字符，却会失去旧快照提示。去掉 `due` 或 `last_review` 的模拟可减少约 156–170 个字符，但会破坏 FSRS 的时间线，应视为不可接受的功能损失；其他 card 数值同理不应为 QR 尺寸而删除。

## 不包含的内容

实际应用导出不包含：姓名、账号、设备标识、完整当前题目、题目公式/答案、prompt、hint、推导步骤、seed、generatorVersion、domain、当前草稿、已输入答案、verdict、session/current 对象、完整尝试历史、跳过记录、课堂配置（`Config` 的 revision、disabled families、sessionLength）以及任何服务端短码。导入后从新题开始；本机当前快照会在替换前作为 backup 保留，但 backup 不在 QR 中。

需要特别区分两种“旧内容”：DSP2 应用导出是 2 条/技能的指纹证据；DSP1 兼容导入把 `PortableProgress` JSON 原样压缩，测试若直接把 raw fixture 传给 `encodeProgress` 也会保留 5 条/技能证据。因此旧路径可能含 raw expression signature、5 条/技能证据、FSRS 参数和版本字段。任何精简新 profile 都必须决定是否继续接受 DSP1，以及是否把旧 raw signature 迁移为 `q1:` 指纹后再保存。

## 审查建议

如果目标只是让正常全课程导出更短，当前实现已经用一张 37-L 密集 URL QR 完成迁移，删字段后是否能降低二维码版本，还需要实测。若必须精简且要保留教学行为，优先评估“移除当前未读取的 `lastFailureAt`”和“按固定目录规范化行、移除 `skillIndex`”；两者都要新 profile 和旧码迁移，预期只省约 76/80 个 DSP2 字符。

若愿意改变产品功能，`practiceDays` 是唯一能带来明显节省的简单开关，但代价是活动计数和“今日已练”显示消失。题目指纹缩短只在压缩前看起来节省约 520 字符，压缩后本 fixture 只省 9 个代码字符。`template`、`correct`、任何 FSRS card 数值、`otherSinceFailure`、`extraPracticeGiven`、`failureStreak` 和 `lastSeen` 都承载当前调度或推进逻辑，不应仅因载荷审查而移除。
