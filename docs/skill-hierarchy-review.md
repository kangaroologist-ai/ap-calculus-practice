# Derivative Studio skill hierarchy review

本文件是对当前 `ap-calculus-practice` 的只读目录审查。它记录当前代码实际提供的 26 个 skill、每个 skill 的两个题目模板、声明的 `supportingSkills`，以及与拟议教学顺序的差异。这里的“模板混合”只指表达式结构同时出现了多个求导操作；它不判断题库答案或数学题目本身是否正确。

## 证据边界

- `src/catalog.ts:10-141` 定义 `SKILLS` 的数组顺序、label、level、rule 和 `prerequisites`。
- `src/questions.ts:36-62` 定义模板选择（`v=0/1`）、随机参数 `a,b,n`、线性内层 `lin`、`smooth()` 和 `innerPower()`；`src/questions.ts:63-267` 定义 26 个 skill 的两种表达式结构；`src/questions.ts:286-307` 将 `v` 写入 `template`，并把 `skill.prerequisites` 原样写入 `supportingSkills`。
- `docs/skill-examples.md:1-12` 说明该文档是 26 个 skill × 两个显式模板的固定 seed 样例。下文引用其中的公式，只为使结构可读；不把文档的 `verified` 文字当作本次数学正确性结论。
- `src/progress.ts:123-143`、`src/progress.ts:152-220`、`src/progress.ts:237-337` 是完成、解锁、诊断和选题逻辑的依据。

## 当前实际顺序（现状，不是建议）

数组顺序如下；同一 level 内的数组先后目前不会形成逐个解锁顺序，因为 `unlock` 按 level 检查该 level 的所有启用 skill 是否 ready（`src/progress.ts:135-143`）。

| # | id | label | level | catalog 中声明的 `supportingSkills` | 证据 |
|---:|---|---|---:|---|---|
| 1 | `constant` | Constants | 1 | — | `src/catalog.ts:11` |
| 2 | `power` | Power rule | 1 | — | `src/catalog.ts:12-17` |
| 3 | `sum` | Sums & constant multiples | 1 | `power`, `constant` | `src/catalog.ts:18-24` |
| 4 | `root` | Roots & fractional powers | 1 | `power` | `src/catalog.ts:25-30` |
| 5 | `exp` | Exponential functions | 2 | `power` | `src/catalog.ts:32-38` |
| 6 | `log` | Logarithmic functions | 2 | `power` | `src/catalog.ts:39-44` |
| 7 | `sin` | sin derivatives | 2 | `power` | `src/catalog.ts:46-53` |
| 8 | `cos` | cos derivatives | 2 | `power` | `src/catalog.ts:46-53` |
| 9 | `tan` | tan derivatives | 2 | `power` | `src/catalog.ts:46-53` |
| 10 | `cot` | cot derivatives | 2 | `power` | `src/catalog.ts:46-53` |
| 11 | `sec` | sec derivatives | 2 | `power` | `src/catalog.ts:46-53` |
| 12 | `csc` | csc derivatives | 2 | `power` | `src/catalog.ts:46-53` |
| 13 | `asin` | arcsin derivatives | 2 | `root` | `src/catalog.ts:55-62` |
| 14 | `acos` | arccos derivatives | 2 | `root` | `src/catalog.ts:55-62` |
| 15 | `atan` | arctan derivatives | 2 | `root` | `src/catalog.ts:55-62` |
| 16 | `product` | Product rule | 3 | `sum`, `sin`, `exp` | `src/catalog.ts:64-70` |
| 17 | `quotient` | Quotient rule | 3 | `sum`, `cos` | `src/catalog.ts:71-77` |
| 18 | `chain` | Chain rule | 3 | `power`, `sin` | `src/catalog.ts:78-84` |
| 19 | `nested` | Nested chain rule | 4 | `chain`, `exp`, `sin` | `src/catalog.ts:85-91` |
| 20 | `mixed` | Mixed differentiation | 4 | `product`, `quotient`, `chain` | `src/catalog.ts:92-98` |
| 21 | `implicit` | Implicit differentiation | 5 | `chain`, `quotient` | `src/catalog.ts:99-105` |
| 22 | `inverse` | Inverse-function derivatives | 5 | `power` | `src/catalog.ts:106-112` |
| 23 | `higher` | Higher derivatives | 5 | `product`, `chain` | `src/catalog.ts:113-119` |
| 24 | `parametric` | Parametric derivatives | 6 | `quotient`, `higher` | `src/catalog.ts:120-126` |
| 25 | `vector` | Vector derivatives | 6 | `exp`, `sin`, `power` | `src/catalog.ts:127-133` |
| 26 | `polar` | Polar slopes | 6 | `product`, `parametric` | `src/catalog.ts:134-140` |

## 当前两个模板（现状）

`v=0` 是 template 0，`v=1` 是 template 1；生成器默认从随机数得到 0 或 1（`src/questions.ts:36-42`），显式 override 后会把该值写入题目（`src/questions.ts:286-293`）。下面的“结构”用 `a,b,n` 表示生成器的随机参数，其中 `a=2..9`、`b=1..9`、`n=2..5`；`lin=ax+b`，`smooth(x)` 从 `sin(x)`、`cos(x)`、`exp(x)` 中随机选择，`innerPower=x^k+b` 且 `k=2..4`（`src/questions.ts:37-42`, `src/questions.ts:59-62`）。

| skill | Template 0 | Template 1 | 结构证据 |
|---|---|---|---|
| `constant` | `a` | `a+b/n` | `src/questions.ts:64-66`；固定样例 `docs/skill-examples.md:45-117` |
| `power` | `x^n` | `a x^{-n}` | `src/questions.ts:67-69`；固定样例 `docs/skill-examples.md:121-195` |
| `sum` | `x^n+b x^2+a` | `a x^n-bx+n` | `src/questions.ts:70-72`；固定样例 `docs/skill-examples.md:197-271` |
| `root` | `a x^{1/2}` | `a x^{1/3}` | `src/questions.ts:73-83`；固定样例 `docs/skill-examples.md:273-347` |
| `exp` | `e^{lin}` | `a^x` | `src/questions.ts:85-87`；固定样例 `docs/skill-examples.md:349-423` |
| `log` | `ln(lin)` | `ln(x)/ln(a)` | `src/questions.ts:88-94`；固定样例 `docs/skill-examples.md:425-499` |
| `sin` | `a sin(x)` | `sin(lin)` | `src/questions.ts:95-104`；固定样例 `docs/skill-examples.md:501-575` |
| `cos` | `a cos(x)` | `cos(lin)` | `src/questions.ts:95-104`；固定样例 `docs/skill-examples.md:577-651` |
| `tan` | `a tan(x)` | `tan(lin)` | `src/questions.ts:95-104`；固定样例 `docs/skill-examples.md:653-727` |
| `cot` | `a cot(x)` | `cot(lin)` | `src/questions.ts:95-104`；固定样例 `docs/skill-examples.md:729-803` |
| `sec` | `a sec(x)` | `sec(lin)` | `src/questions.ts:95-104`；固定样例 `docs/skill-examples.md:805-879` |
| `csc` | `a csc(x)` | `csc(lin)` | `src/questions.ts:95-104`；固定样例 `docs/skill-examples.md:881-955` |
| `asin` | `a\,\arcsin(x)` | `\arcsin(x/a)` | `src/questions.ts:105-114`；固定样例 `docs/skill-examples.md:957-1031` |
| `acos` | `a\,\arccos(x)` | `\arccos(x/a)` | `src/questions.ts:105-114`；固定样例 `docs/skill-examples.md:1033-1107` |
| `atan` | `a\,\arctan(x)` | `\arctan(x/a)` | `src/questions.ts:105-114`；固定样例 `docs/skill-examples.md:1109-1183` |
| `product` | `x^n\,smooth(x)` | `(x^2+a)\,smooth(x)` | `src/questions.ts:116-118`；固定样例 `docs/skill-examples.md:1185-1259` |
| `quotient` | `(x^2+b)/(lin)` | `smooth(x)/(x^2+a)` | `src/questions.ts:119-121`；固定样例 `docs/skill-examples.md:1261-1335` |
| `chain` | `lin^n` | `smooth(innerPower)` | `src/questions.ts:122-124`；固定样例 `docs/skill-examples.md:1337-1411` |
| `nested` | `smooth(sin(lin))` | `smooth(lin^2)` | `src/questions.ts:125-127`；固定样例 `docs/skill-examples.md:1413-1487` |
| `mixed` | `(x^2+b)\,smooth(lin)` | `smooth(lin)/(x^2+b)` | `src/questions.ts:128-132`；固定样例 `docs/skill-examples.md:1489-1563` |
| `implicit` | `x^2+y^2-a^2=0`（circle） | `y^2-x^2-a=0`（hyperbola） | `src/questions.ts:133-163`；固定样例 `docs/skill-examples.md:1565-1639` |
| `inverse` | `f(x)=ax+b`，求对应 inverse slope | `f(x)=x^3+ax`，求对应 inverse slope | `src/questions.ts:164-181`；固定样例 `docs/skill-examples.md:1641-1715` |
| `higher` | `x^{n+1}+b x^2`，求二阶导 | `a\sin(x)`，求三阶导 | `src/questions.ts:183-198`；固定样例 `docs/skill-examples.md:1717-1791` |
| `parametric` | `x(t)=at+b, y(t)=sin(t)`，求 `dy/dx` | `x(t)=t^2, y(t)=t^3`，求 `d^2y/dx^2` | `src/questions.ts:200-227`；固定样例 `docs/skill-examples.md:1793-1867` |
| `vector` | `⟨t^n,sin(at)⟩` | `⟨e^{at},cos(t)⟩` | `src/questions.ts:229-242`；固定样例 `docs/skill-examples.md:1869-1943` |
| `polar` | `r(θ)=a\sin(θ)` | `r(θ)=a+\cos(θ)` | `src/questions.ts:244-266`；固定样例 `docs/skill-examples.md:1945-2019` |

### 哪些模板已经混合

这是表达式结构的审计，不是正确性结论。

- `exp` template 0、`log` template 0，以及六个普通三角 skill 的 template 1 都已带 affine inner function；代码把它们作为该 skill 的基本模板，却已经出现 chain-like 的内层结构（`src/questions.ts:85-104`）。
- `product` 两个模板都同时含乘积和另一个结构：template 0 是 power × `smooth`，template 1 是 polynomial sum × `smooth`（`src/questions.ts:116-118`）。
- `quotient` 两个模板都同时含商和 numerator/denominator 的其他结构；template 1 的 `smooth` 还可能是 `sin`、`cos` 或 `exp`（`src/questions.ts:59-62`, `119-121`）。
- `chain` 两个模板都是复合结构；template 1 同时包含 `smooth` 和 `innerPower`，因此实际还会带上随机选中的 trig/exp 及 power-like inner（`src/questions.ts:59-62`, `122-124`）。
- `nested` 两个模板已经是多层复合；`mixed` 的两个模板分别是 product-with-inner-function 与 quotient-with-inner-function（`src/questions.ts:125-132`）。
- `implicit`、`inverse`、`higher`、`parametric`、`vector`、`polar` 也各自含有多个操作或表示转换；例如 parametric 明确计算 `dy/dt ÷ dx/dt`，polar 明确先构造 Cartesian `x,y` 再相除（`src/questions.ts:200-227`, `244-266`）。

因此，当前目录已经存在“技能标题之外的混合结构”，但没有“基础题 / 与先前 skill 混合题”的机器可识别标签。表达式里出现了多个操作，不等于 progress 已经把它识别为一次累计混合通过。

## `supportingSkills` 是否真实（现状审计）

这里将“真实”限定为：声明的先修是否覆盖两个模板可能调用的操作结构。因为 `smooth()` 是随机三选一，若只声明其中一个可能值，便不能代表该 skill 的全部生成分支（`src/questions.ts:59-62`）。以下只比较结构和元数据，不判断公式答案。

| skill | 当前声明 | 与两个模板结构的关系 | 结论 |
|---|---|---|---|
| `constant`, `power` | 空 | 两个模板分别只使用常数或幂结构（`src/questions.ts:64-69`） | 基础结构上相符 |
| `sum` | `power`, `constant` | 两个模板含幂项、常数倍/常数项（`src/questions.ts:70-72`） | 基本相符 |
| `root` | `power` | 两模板都是 fractional-power 形式（`src/questions.ts:73-83`） | 基本相符 |
| `exp` | `power` | template 0 是 `e^{lin}`，template 1 是 `a^x`；声明的 `power` 并非两个模板都显式调用的操作，template 0 还带 affine inner（`src/catalog.ts:32-38`, `src/questions.ts:85-87`） | 不完全相符；未声明 chain-like inner |
| `log` | `power` | template 0 是 `ln(lin)`，template 1 是 `ln(x)/ln(a)`；声明 `power` 不覆盖 affine inner 或 constant-denominator representation（`src/catalog.ts:39-44`, `src/questions.ts:88-94`） | 不完全相符 |
| `sin`, `cos`, `tan`, `cot`, `sec`, `csc` | 各自仅 `power` | template 0 是 constant multiple，template 1 是 `g(lin)`；template 1 已带 inner function，且 `power` 不是其直接模板结构（`src/catalog.ts:46-53`, `src/questions.ts:95-104`） | 不完全相符；尤其与 chain 的边界未分开 |
| `asin`, `acos`, `atan` | `root` | template 0 是 constant multiple，template 1 是 inverse trig of `x/a`；root 出现在相应导数公式的概念背景，而不是 source expression 的 root 节点（`src/catalog.ts:55-62`, `src/questions.ts:105-114`） | 概念上可解释，但不是模板结构的一一对应 |
| `product` | `sum`, `sin`, `exp` | 两模板还含 `power`；`smooth` 可能为 `sin`、`cos` 或 `exp`，所以当前声明漏掉 `power` 与 `cos`，并且 `sin` 并非每次都会出现（`src/catalog.ts:64-70`, `src/questions.ts:59-62`, `116-118`） | 不完整；随机分支的 union 未覆盖 |
| `quotient` | `sum`, `cos` | template 0 含 polynomial/linear quotient，template 1 的 numerator 是随机 `smooth`，可能是 `sin`、`cos`、`exp`；当前声明漏掉可能的 `sin`、`exp`，也没有把 power-like denominator 明确列出（`src/catalog.ts:71-77`, `src/questions.ts:59-62`, `119-121`） | 不完整 |
| `chain` | `power`, `sin` | template 0 是 power of affine；template 1 的 outer `smooth` 可能是 `sin`、`cos`、`exp`，且 inner 是 power-like；当前声明漏掉 `cos`、`exp` 可能分支（`src/catalog.ts:78-84`, `src/questions.ts:59-62`, `122-124`） | 不完整 |
| `nested` | `chain`, `exp`, `sin` | 两模板确实需要多层 chain；但 outer `smooth` 也可能是 `cos`，template 1 还含 power/affine inner（`src/catalog.ts:85-91`, `src/questions.ts:59-62`, `125-127`） | 不完整 |
| `mixed` | `product`, `quotient`, `chain` | template 0 是 product + inner function，template 1 是 quotient + inner function；顶层三类法则声明与结构相符，但底层 `smooth` 的 trig/exp 分支未列出（`src/catalog.ts:92-98`, `src/questions.ts:59-62`, `128-132`） | 顶层相符，底层不完整 |
| `implicit` | `chain`, `quotient` | `y^2` 使 y 作为 x 的函数时出现 chain-like 依赖，隔离 `dy/dx` 需要除法；但这不是对 quotient expression 求导（`src/catalog.ts:99-105`, `src/questions.ts:133-163`） | 概念依赖可解释，语义需明确 |
| `inverse` | `power` | template 0 是 linear，template 1 才是 cubic + linear；`power` 只覆盖其中一个模板的 source shape（`src/catalog.ts:106-112`, `src/questions.ts:164-181`） | 部分相符；inverse theorem 本身未作为 supporting skill 表达 |
| `higher` | `product`, `chain` | 两模板实际是 polynomial repeated derivative 与 constant multiple of sine；source 没有 product 或 nested chain（`src/catalog.ts:113-119`, `src/questions.ts:183-198`） | 不相符；更像需要 power/trig 基础与“重复求导”本身 |
| `parametric` | `quotient`, `higher` | 两模板分别使用 derivative quotient；template 1 还要求 second derivative；template 0 仍含 sine，template 1 含 powers（`src/catalog.ts:120-126`, `src/questions.ts:200-227`） | 主过程相符，底层覆盖不完整 |
| `vector` | `exp`, `sin`, `power` | template 0 含 power + sine，template 1 含 exponential + cosine；当前声明漏掉 `cos`（`src/catalog.ts:127-133`, `src/questions.ts:229-242`） | 不完整 |
| `polar` | `product`, `parametric` | `x=r cosθ`、`y=r sinθ` 需要 product/trig，斜率计算还需要 quotient-like division；它使用 parameter θ，但不是当前 `parametric` generator 的题形（`src/catalog.ts:134-140`, `src/questions.ts:244-266`） | 不完整；`parametric` 是表示类比而非完整结构覆盖 |

### 生成器与 progress 对 `supportingSkills` 的实际用法

`Question.supportingSkills` 不是题目级自动推断结果：生成题时直接取 `skill.prerequisites`（`src/questions.ts:286-293`；字段类型见 `src/types.ts:22-41`）。失败时，progress 只把这些 id 加入 `pendingDiagnostics`（`src/progress.ts:203-215`）。选题时，skill 是否 eligible 也只检查 catalog 中的 `prerequisites` 是否 ready（`src/progress.ts:290-314`）。因此当前声明同时承担“解锁门槛”和“失败诊断提示”两种用途；它没有表达“template 0 需要哪些先修、template 1 需要哪些先修”的粒度。

## 当前完成条件与用户所说的“基础 + 之前 skill 混合”

### 现状

当前 readiness 的实际条件是：

1. 最近两条 `recent` 证据都 `correct`；
2. 两条题目的 q fingerprint 不同；
3. 两条题目的 `template` 值不同；
4. skill 没有 `needsRemediation`。

这些条件分别由 `src/progress.ts:123-133` 实现；每次记录只存 `q`、`template`、`correct` 三类 evidence 字段（`src/progress.ts:26-30`, `188-197`）。`good` 还要求答对且没有使用 hint（`src/progress.ts:159-164`）。

所以当前系统确实要求每个 skill 最近通过两个不同模板，但没有证据字段表示“基础”或“与之前 skill 混合”，也没有检查模板是否调用了已完成的先前 skill。`finishQuestion` 只更新其他 remediation skill 的 `otherSinceFailure`，不会补做混合证据检查（`src/progress.ts:339-358`）。

### 待批准改变：基础线、混合线与完成契约

用户已经确认每个 skill 需要两条独立的连续证据：基础题连续答对 2 题，混合题连续答对 2 题。下面是将这项要求落实为产品状态的方案；它只是待批准设计，当前代码没有实施。

- `basic`：目标 skill 的直接结构。基础模板可以使用当前 skill 自己正在教的规则和已经开放的基础规则，但不得偷偷引入尚未开放的后继规则；特别是未学 chain 时，基础模板不能使用 `f(g(x))`、`g(ax+b)` 这类需要 chain 的内层结构。
- `mix`：目标 skill 与已经学到的先前 skill 的可见组合。混合题的 `requiredSkills` 必须列出实际使用的规则；只有这些 skill 的 `baseReady` 都成立，并且目标 skill 自己的 `baseReady` 已成立，才开放该混合线。
- 每条线都需要 2 道不同 fingerprint 的题连续无 hint 答对。`basicReady` 与 `mixReady` 分开保存；`Ready = basicReady && mixReady`。
- 基础线负责开放后继基础线。后继基础 skill 只等待它的 `B-open` 先修的 `baseReady`，不等待前一个 skill 的 `mixReady`；这样混合应用不会阻塞基础课程向前推进。
- 混合线只等待 `M-open` 中所需规则的 `baseReady`，不等待这些先修的最终 `Ready`。例如早期 skill 的混合题如果需要 `sum`、`product` 或 `chain`，就留在队列中，直到这些规则的基础线开放并完成；它们不能在规则尚未教到时提前生成。
- `baseUnlocked`、`mixUnlocked` 和已经获得的基础通过应保持，不因一次混合错误而回锁或要求重刷基础。混合错误只重置 `mix` 连对计数并可标记混合 remediation；`basicReady` 和基础证据保留。若已达 `mixReady` 后再次混合错误，建议保留访问权并进入混合 remediation，是否撤销历史 `mixReady` 仍需单独批准。

这种拆分是必要的：如果沿用当前按 level 要求“该 level 所有 skill 都 ready”再整体推进的逻辑（`src/progress.ts:135-143`），而又把 `Ready` 定义为基础加混合，就可能出现循环：早期 skill 的混合题需要 `sum`、`product` 或 `chain`，但整级混合完成又被用来开放这些后继规则。基础线和混合线必须是两个门槛；不能用整级 `mixReady` 作为后继基础题的唯一解锁条件。

若继续保留两个模板，模板角色必须是显式 metadata（例如 `role: "basic" | "mix"`），而不能只依赖当前的数字 `template=0/1`。现有 `Evidence` 只有 q、template、correct（`src/progress.ts:26-30`），现有 readiness 只检查最近两条不同模板记录（`src/progress.ts:123-133`），因此不足以验证这两个角色。这个 schema 与状态迁移仍待批准。

## 待批准的 hierarchy 建议

以下是一个直接对应用户给定顺序的候选数组；它是建议，不是当前代码状态，也没有修改 `src/catalog.ts`：

| 阶段 | 建议顺序 | 目的与边界 |
|---|---|---|
| A 基础规则 | `power → root → sin → cos → exp → log` | 先建立用户指定的六类基础规则。若保留当前 `exp/log` 的 affine inner 模板，应把它标为预览式 cumulative，或另做真正基本模板；否则 chain 会提前出现。 |
| B 线性性质 | `constant → sum` | `sum` 当前声明依赖 `power`、`constant`，所以把 constant 放在 sum 前可保留其现有依赖含义（`src/catalog.ts:18-24`）。 |
| C 乘积 | `product` | 先单独区分 product rule；其 cumulative 模板可混入已完成的 power、sum 与基础函数。当前两个 product 模板已经混入这些结构（`src/questions.ts:116-118`）。 |
| D 商与四个后置三角 | `quotient → tan → cot → sec → csc` | 明确满足“tan/cot/sec/csc 在 quotient 之后”。四者可作为 quotient 之后的一组，先不要让它们依赖 chain；若模板保留 `g(lin)`，需把 affine inner 作为预览标记或改成 basic/cumulative 两角色。 |
| E 单层复合 | `chain` | 这里应与 product 分开：basic 只测单层 outer/inner，cumulative 才与已完成的 power、exp、sin/cos 等混合；当前 `chain` 的两个模板已经有 power/smooth 混合（`src/questions.ts:122-124`）。 |
| F 多层与综合 | `nested → mixed` | `nested` 先固定多层 chain；`mixed` 再组合 product、quotient、chain。当前 catalog 已把二者放 level 4，但数组和先修语义仍需按新契约明确（`src/catalog.ts:85-98`）。 |
| G 反三角 | `asin → acos → atan` | 放在综合之后，避免 current level-2 把 inverse trig 提前到 chain/product 前；其 real-domain/root 条件可作为该阶段自己的基础与 cumulative 结构。当前三者在 level 2、声明 root（`src/catalog.ts:55-62`）。 |
| H 高阶与特殊表示 | `higher → implicit → inverse → parametric → vector → polar` | 这是一个可审议的 advanced 内部顺序：先重复求导，再隐式/反函数，再参数、向量、极坐标表示。用户只指定“再 advanced”，因此这一组的内部先后仍需批准；当前 level 5/6 划分见 `src/catalog.ts:99-140`。 |

### 26 个 skill 的完整候选顺序、先修与示例

下表是一个可直接供用户审核的候选 hierarchy。`B-open` 是**教学顺序门**：它表达用户希望的授课先后，不是题目的数学先修。例如 `sin` 的 `B-open=root` 只是让 sin 排在 root 后面；sin 的基础题本身不需要 root。`Base requiredSkills` 才是该基础示例实际使用的结构先修（不含目标 skill 自身）。`M-open` 是开放该 skill 混合线所需的 `baseReady` 集合，按示例列出实际组合规则。两类开放门都只依赖基础通过，不依赖先修 skill 的 `mixReady`，这是避免循环的关键。表中示例是拟议题型，不是当前 generator 的承诺；它们刻意把基础题中的未学 chain 排除在外。反三角题应保留其真实定义域限制，表中为结构示例而非完整题面。

| # | 阶段 / skill | `B-open`（教学顺序） | Base requiredSkills（数学结构） | 基础示例（1） | `M-open`（需 baseReady） | 混合示例（1） |
|---:|---|---|---|---|---|---|
| 1 | A / `power` | — | — | `f(x)=x^4` | `power`, `sum` | `f(x)=x^4+3x^2` |
| 2 | A / `root` | `power` | `power` | `f(x)=\sqrt{x}` | `root`, `power`, `sum` | `f(x)=\sqrt{x}+x^2` |
| 3 | A / `sin` | `root`（教学顺序） | — | `f(x)=\sin x` | `sin`, `sum`, `power` | `f(x)=\sin x+x^2` |
| 4 | A / `cos` | `sin`（教学顺序） | — | `f(x)=\cos x` | `cos`, `sin`, `sum`, `power` | `f(x)=\cos x+x^2` |
| 5 | A / `exp` | `cos`（教学顺序） | — | `f(x)=e^x` | `exp`, `sum`, `power` | `f(x)=e^x+x^2` |
| 6 | A / `log` | `exp`（教学顺序） | — | `f(x)=\ln x` | `log`, `sum`, `power` | `f(x)=\ln x+x^2` |
| 7 | B / `constant` | `log`（教学顺序） | — | `f(x)=c` | `constant`, `sum`, `power` | `f(x)=3+x^2` |
| 8 | B / `sum` | `constant`, `power` | `power`, `constant` | `f(x)=x^2+3` | `sum`, `sin`, `power` | `f(x)=x^2+\sin x+3` |
| 9 | C / `product` | `sum`, `sin` | `power`, `sin` | `f(x)=x^2\sin x` | `product`, `sum`, `sin` | `f(x)=(x^2+1)\sin x` |
| 10 | D / `quotient` | `product` | `power`, `sum`, `constant` | `f(x)=\dfrac{x^2+1}{x+2}` | `quotient`, `product`, `sum`, `sin` | `f(x)=\dfrac{(x^2+1)\sin x}{x+2}` |
| 11 | D / `tan` | `quotient` | — | `f(x)=\tan x` | `tan`, `quotient`, `sum`, `power` | `f(x)=\dfrac{\tan x}{x^2+1}` |
| 12 | D / `cot` | `tan`（教学顺序） | — | `f(x)=\cot x` | `cot`, `quotient`, `sum`, `power` | `f(x)=\dfrac{\cot x}{x^2+1}` |
| 13 | D / `sec` | `cot`（教学顺序） | — | `f(x)=\sec x` | `sec`, `quotient`, `sum`, `power` | `f(x)=\dfrac{\sec x}{x^2+1}` |
| 14 | D / `csc` | `sec`（教学顺序） | — | `f(x)=\csc x` | `csc`, `quotient`, `sum`, `power` | `f(x)=\dfrac{\csc x}{x^2+1}` |
| 15 | E / `chain` | `csc` | `power`, `sum`, `constant` | `f(x)=(x+1)^3` | `chain`, `sin`, `sum`, `power` | `f(x)=\sin(x^2+1)` |
| 16 | F / `nested` | `chain` | `chain`, `sin`, `power`, `sum`, `constant` | `f(x)=\sin((x+1)^2)` | `nested`, `chain`, `exp`, `sin`, `sum`, `power` | `f(x)=e^{\sin(x^2+1)}` |
| 17 | F / `mixed` | `nested` | `product`, `quotient`, `sum`, `power`, `constant`, `exp` | `f(x)=\dfrac{(x^2+1)e^x}{x+2}` | `mixed`, `product`, `quotient`, `chain`, `exp`, `sum`, `power` | `f(x)=\dfrac{(x^2+1)e^{x^2+1}}{x+2}` |
| 18 | G / `asin` | `mixed` | — | `f(x)=\arcsin x` | `asin`, `chain`, `sum`, `power` | `f(x)=\arcsin(x/2)+x^2` |
| 19 | G / `acos` | `asin`（教学顺序） | — | `f(x)=\arccos x` | `acos`, `chain`, `sum`, `power` | `f(x)=\arccos(x/2)+x^2` |
| 20 | G / `atan` | `acos`（教学顺序） | — | `f(x)=\arctan x` | `atan`, `chain`, `sum`, `power` | `f(x)=\arctan(x^2+1)` |
| 21 | H / `higher` | `atan` | `power` | 求 `f(x)=x^5` 的 `f''(x)` | `higher`, `product`, `sum`, `power`, `sin` | 求 `f(x)=(x^2+1)\sin x` 的 `f''(x)` |
| 22 | H / `implicit` | `higher` | `power`, `chain`, `sum`, `constant` | `x^2+y^2=25`，求 `dy/dx` | `implicit`, `chain`, `sum`, `power`, `sin` | `x^2+\sin y=4`，求 `dy/dx` |
| 23 | H / `inverse` | `implicit` | `power`, `sum`, `constant` | `f(x)=3x+1`，求 `(f^{-1})'(4)` | `inverse`, `power`, `sin`, `sum` | `f(x)=x^3+\sin x`，`f(0)=0` 且限制 f 在 `x=0` 附近可逆，求 `(f^{-1})'(0)` |
| 24 | H / `parametric` | `inverse` | `quotient`, `power` | `x=t^2,y=t^3`，求 `dy/dx` | `parametric`, `quotient`, `product`, `exp`, `sin` | `x=e^t,y=t\sin t`，求 `dy/dx` |
| 25 | H / `vector` | `parametric` | `power`, `sin` | `\mathbf r(t)=\langle t^2,\sin t\rangle`，求 `\mathbf r'(t)` | `vector`, `product`, `chain`, `sum`, `power`, `exp`, `sin` | `\mathbf r(t)=\langle (t^2+1)e^t,\sin(t^2)\rangle`，求 `\mathbf r'(t)` |
| 26 | H / `polar` | `vector` | `quotient`, `sin`, `cos` | `r(\theta)=2`，求 `dy/dx` | `polar`, `parametric`, `quotient`, `product`, `sin`, `cos` | `r(\theta)=1+\cos\theta`，求 `dy/dx` |

这张表的 `B-open` 先后是教学候选，不是对数学依赖的唯一断言。例如 `sin` 本身不需要 `root`，`exp` 的 `e^x` 不需要 `cos`，`tan` 的 `tan x` 不需要 `quotient`；这些门只是遵守用户指定的课程顺序。真正实现时应同时保存教学顺序门与结构 `requiredSkills`，不能把展示顺序误当成表达式自动推断结果。

### 基础模板禁止提前引入 chain

当前代码的 `lin=ax+b` 被 exp、log 和普通三角模板直接使用（`src/questions.ts:59-62`, `85-104`）；这使 `e^{ax+b}`、`ln(ax+b)`、`g(ax+b)` 在 chain skill 之前就出现了 chain-like 内层。候选方案应把基础模板改为 `e^x`、`\ln x`、`g(x)`，把 affine inner 留给 chain 或相应的 mix 题。`product`、`quotient` 的基础题也应使用 `sin x`、`e^x` 等已开放的直接函数，不能使用 `e^{x^2+1}` 或 `\sin(x^2+1)` 这类未开放的 chain；现有 product、quotient、chain 模板的组合边界见 `src/questions.ts:116-124`。

早期 skill 的混合题可以使用后续规则，但必须延期到这些规则的基础线完成。例如 `power` 的候选混合题 `x^4+3x^2` 需要 `sum` 的基础通过；`sin` 的 `sin x+x^2` 需要 `sum` 的基础通过；`exp` 的 `e^x+x^2` 也需要 `sum` 的基础通过。它们不能因为属于早期 skill 就在第一阶段直接生成。`M-open` 这一列把这条规则显式化，并且只看先修的 `baseReady`，所以不会反过来要求先修的混合通过。

### 建议的先修语义（待批准草案）

如果继续使用 skill 级 `supportingSkills`，应把它定义为“两个模板所有可能结构的保守 union”，而不是当前某一个随机样例的近似。按当前生成器结构，至少需要在后续设计中处理这些明确问题：

- `product` 需要考虑 `power`、`sum`、`sin`、`cos`、`exp` 的所有可能分支；当前 `smooth` 的三选一使 `sin` 单独声明不够（`src/questions.ts:59-62`, `116-118`）。
- `quotient` 需要覆盖 polynomial/power 分支和 `smooth` 的 `sin/cos/exp` 分支；当前只列 `sum`,`cos`（`src/catalog.ts:71-77`, `src/questions.ts:119-121`）。
- `chain`/`nested` 需要明确 affine/power inner 与 `smooth` 可能的 `sin/cos/exp`；当前声明漏掉至少一个可能 outer（`src/questions.ts:59-62`, `122-127`）。
- `vector` 至少同时覆盖 template 0 的 power/sin 与 template 1 的 exp/cos；当前 catalog 没有 `cos`（`src/catalog.ts:127-133`, `src/questions.ts:229-242`）。
- `polar` 若要把 `parametric` 当作先修，应说明它是“使用参数 θ 的表示迁移”还是“必须先通过 parametric skill”；表达式本身还含 trig 与 slope quotient（`src/questions.ts:244-266`）。

更精确的替代方案是改成题目级 `requiredSkills`：每个模板明确列出它实际混入的已完成 skill，而 `supportingSkills` 只保留解锁层级所需的稳定先修。这个 schema 选择属于待批准的架构决定。

## 旧进度迁移与固定 compact codec 风险

这次 hierarchy 和完成契约一旦批准，旧用户进度不能直接按新字段猜测。当前 progress 只有一条 `recent` 证据流，每条证据只有 q fingerprint、template、correct（`src/progress.ts:26-30`, `188-197`）；没有 `basic`/`mix` role，也没有两条独立的连对计数。因此旧数据中“最近两个 template 通过”不能可靠地判定为“基础连对 2 题”和“混合连对 2 题”。当前题目还由 `generatorVersion`、template 和 expression signature 组成（`src/questions.ts:286-307`），如果同时重写模板，旧题证据也不能自动等价于新题型。

迁移策略必须在产品改动前单独批准。保守候选是：保留旧 skill 的历史访问和原有已解锁状态，给旧证据标成 `legacy`，不把它伪装成新契约的 basic/mix 证据；对仍需新契约证明的 skill，只补做缺失的 basic 或 mix 连对 2 题。若选择严格重置，必须明确告诉用户会丢失哪些 mastery 证据。无论采用哪一种，混合失败都不能抹掉已经保存的基础通过；迁移也不能因为无法识别 role 就强迫所有用户从零重刷基础。这个文件只记录风险，没有执行迁移。

compact progress 还有一个独立的顺序兼容风险。`src/compact-progress.ts:33-60` 固定了 `PROFILE_SKILLS` 的 26 个 ID 顺序；`src/compact-progress.ts:63-71` 又把 `SKILLS.map(s => s.id)` 与该固定数组做 exact comparison。打包时 skill 被写成该数组中的数字 index（`src/compact-progress.ts:84-105`），解包时再按 index 映射回 `PROFILE_SKILLS`（`src/compact-progress.ts:140-188`）。因此直接重排 `src/catalog.ts` 会带来两种风险：旧 compact payload 可能被拒绝；若绕过版本检查而按新顺序解释旧 index，则可能把一个 skill 的进度静默解释成另一个 skill。

如果批准新顺序，安全的设计方向是保留旧 profile 的 codec 顺序用于读取旧 payload，另建带新 `CURRICULUM_VERSION`/profile version 的新序列化 profile，并按稳定 ID 做显式迁移；不能复用旧数字 index，也不能只改 `PROFILE_SKILLS` 的排列。迁移需要独立的 round-trip、旧 payload、未知 skill 和重复 index 测试；这些都属于后续产品实现与用户审核范围。

## 结论（仅现状与建议）

当前系统有 26 个 skill、每个 2 个模板，并且 product/quotient/chain/nested/mixed 等模板已经包含明显的组合结构；但完成判定只区分两个 template 数字，不区分 basic 与 mix，也不验证“之前 skill 混合通过”。`supportingSkills` 是静态 catalog 数组，且若遇到随机 `smooth`，多个 skill 的声明不能覆盖全部可能模板分支。

建议先批准上面的 26 skill hierarchy、B-open/M-open 两条解锁线和“basic 连对 2 题 + mix 连对 2 题”的完成契约，再决定是采用保守 union 还是题目级 `requiredSkills`，以及旧进度如何迁移。尤其需要先确认基础题是否必须清除当前 affine-inner chain 预览，再开始模板和 schema 迁移；在批准前不应把这份建议当作已实施的 curriculum 改动。

## 验证记录

- 只读静态核对：`src/catalog.ts`、`src/questions.ts`、`src/progress.ts`、`src/types.ts`、`docs/skill-examples.md`。
- `npm run build` 通过：TypeScript no-emit 检查与 Vite production build 均完成；构建输出还有现有的 chunk-size warning。该验证只说明当前代码可构建，不说明题库数学正确性。
- 本次补充只修改本独立审查文档；没有修改 `src/catalog.ts`、`src/questions.ts`、`src/progress.ts`、compact codec、progress 数据或生产模板。
