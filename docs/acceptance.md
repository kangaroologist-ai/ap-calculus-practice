# 实现与验收记录

本文件对应用户接受的十步计划。`通过`指已执行的本地证据；浏览器模拟不代表真机验收。未验证项不能视为完成。

| 步骤 | 实现位置 | 验收证据 | 状态 |
|---|---|---|---|
| 1 项目、配置、接口 | `src/types.ts`、`catalog.ts`、`public/practice-config.json`、锁文件 | 配置边界单测；TypeScript 与 Vite 构建；本地字体和 Worker | 已实现，本地通过 |
| 2 规则生成、答案、解析 | `questions.ts`、`math.ts` | 26 技能 × 2 结构 × 100 种子，5,200 题独立 SymPy 检查；函数组合多样性测试 | 通过；127 个表达式身份使用独立多点数值检查，非符号证明 |
| 3 输入、提示、手机布局 | `main.ts`、`style.css` | MathLive 失焦不提交、Enter 不重复、草稿刷新；六级代表题实际浏览器渲染 | 浏览器验证；真机待验 |
| 4 判分、定义域、计算隔离 | `grading.ts`、`domains.ts`、`grading.worker.ts`、`grader-client.ts` | 数学回归含等价变形、奇次根负数、额外定义域缺口、奇点、无效输入；1,040 次生成题标准答案判分；Worker 3 秒终止重建 | 本地验证，范围见测试 |
| 5 FSRS 与补弱 | `progress.ts` | 固定参数、Good/Again、重试幂等、提前练习不改到期日、虚拟时钟 | 本地通过 |
| 6 Ready 与解锁 | `progress.ts` | 最近两题独立正确／双结构，新错误补弱，不倒退等级，禁用级跳过 | 本地通过 |
| 7 本机与便携快照 | `storage.ts`、`transfer.ts` | FSRS 全状态精度往返、UTC 日期、当前题草稿保留、跨设备不带当前题 | 本地通过，专项复核通过 |
| 8 代码与二维码 | `transfer.ts`、`main.ts` | 压缩代码、分片乱序/重复/混用/缺失；qrcode→图像→jsQR 实际往返 | 本地通过；真实摄像头待验 |
| 9 导入、备份、兼容 | `storage.ts`、`transfer.ts`、`main.ts` | 非法版本/日期/数值/长度拒绝，确认替换、取消不变，事务备份与恢复 | 本地通过，专项复核通过 |
| 10 构建、完整流程、部署 | `README.md`、CI、`wrangler.toml` | 本地生产构建成功；三引擎共 81 项：69 通过、12 项按设计仅在 Chromium 执行而跳过、0 失败 | 本地生产页面通过；GitHub/线上状态见下方 |

## Phase 1 SPEC 验收映射

| SPEC | 验证测试 |
|---|---|
| G1 题量与答案随参数变化 | `tests/generator-variety.test.ts` |
| G2 声明式模板注册表与稳定 key | `tests/templates.test.ts`；`tests/generator-golden.test.ts` |
| G3 按题推断 `requiredSkills` | `tests/skill-inference.test.ts` |
| G4 模板与隐函数曲线修复 | `tests/generator-variety.test.ts`；`tests/grading-regression.test.ts` |
| S1 首次连续失败诊断与 Ready 先修过滤 | `tests/progress.test.ts` |
| M1 入口统一迁移、未知身份／新版本处理 | `tests/migrate.test.ts`；`tests/storage.test.ts`；`tests/transfer.test.ts`；`tests/legacy-fixtures.test.ts` |
| M2 本机迁移留底，不占用 `backup` | `tests/storage.test.ts` |
| M3 冻结 profile 注册表与 profile 2 导出 | `tests/compact-progress.test.ts`；`tests/legacy-fixtures.test.ts` |
| M4 q2 短指纹与旧指纹归一化 | `tests/migrate.test.ts`；`tests/compact-progress.test.ts`；`tests/legacy-fixtures.test.ts` |
| M5 导出尺寸、二维码纠错与图像往返 | `tests/compact-progress.test.ts`；`tests/transfer.test.ts`；`tests/qr-image.test.ts` |
| U1 正体微分 d | `tests/notation.test.ts`；`tests/app.spec.ts` |
| U3 最小字号（12px） | `tests/visual-tokens.spec.ts` |
| U4 浅／深主题 token 对比度 | `tests/contrast.test.ts`；`tests/visual-tokens.spec.ts` |

Phase 1 的测试映射不替代真机验收；U3/U4 的浏览器截图与真机安全区边界仍按本文件下方记录区分。

## 生成而非固定题库

部署的应用包含受限表达式树、求导规则与带稳定 key 的模板注册表，不包含测试 corpus。每次选择技能后，根据随机种子实时生成题干、答案与解析。生成版本为 `1.2.0`；每道题按实际表达式记录 `requiredSkills`，隐函数以通用 graph curve 供判分采样。生成器有复杂度限制和有限重试。固定随机种子用于可重复测试，不是学生题库。

## 可复现命令

```sh
npm ci
npm test
npm run test:progress
python3 -m venv .venv
.venv/bin/pip install -r requirements-test.txt
npm run test:math
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

测试日志、截图及数学 corpus 位于 `artifacts/`，不提交进源码仓库；测试脚本保留在仓库，能够重新生成证据。

## 证据边界与待验

- iPhone Safari 与 Android Chrome 真机输入、系统键盘切换和物理摄像头扫码：未验证。
- 线上 HTTPS、Cloudflare 缓存与真实设备网络：尚未部署。当前 Cloudflare 登录已过期，需要账号持有者重新完成 OAuth 登录；发布授权已经具备。
- FSRS 用于数学技能的效果尚无本项目课堂实证；0.9 是调度参数，不是学生掌握概率。
- 数学等价判断先保存原始定义条件、使用受限解析和高精度数值比较。有限采样不构成任意函数的形式证明。
- 初次加载需下载本地托管的数学组件；不依赖外部 CDN，但未实现离线 Service Worker。

## 已执行的补充回归

- 自动保存、替换、恢复按顺序写入；替换前先保存最新草稿，避免防抖窗口内的数据丢失。
- 更改导入代码会使旧预览失效；坏代码不能继续提交旧快照。带首尾空白的同一代码不会重复覆盖备份。
- 标准答案会经过真实输入解析及判分，除独立求导检查外，另覆盖 26 × 2 × 20 = 1,040 个生成实例。
- 嵌套指数、负分数幂的不同写法、三角恒等式及极坐标输入形式均有回归案例。
- 多余定义域限制不会仅因采样点避开零点就被直接接受。无法证明的更强限制返回 inconclusive，不改变 FSRS。
- 公式溢出时提供水平滚动提示；手机函数键用短标签，实际插入完整公式。
- 定义域边界的微小舍入误差、复合分母相消及极小分母返回无法判定；不会把数值精度不足当作学生错误。明确的 `sqrt(-1)`、`ln(-1)`、`0/0` 仍被拒绝。
- 手机数学键盘展开时，判分操作区保持在键盘上方；主键盘和函数键盘均提供收起按钮。

## 发布前剩余 TODO

- [x] 跨设备重学顺序流程、过期预览／异步扫码回归通过；手机键盘操作区与输入框可见性分别验证。
- [x] GitHub 推送完成；最新 main 提交已同步到远端。
- [x] Cloudflare Pages 部署完成并通过线上 smoke test。
- [ ] iPhone Safari 与 Android Chrome 真机输入、物理摄像头扫码。

## 当前测试结果

- 单元与回归：9 个文件，98 个测试通过（包含 1,040 次 canonical 判分矩阵）。
- 独立数学检查：5,200/5,200，通过；127 个表达式身份使用独立数值 fallback，不冒充符号证明。
- Playwright：Chromium 27/27；Firefox 21 通过、6 跳过；WebKit 21 通过、6 跳过。合计 69 通过、12 跳过、0 失败。跳过的是仅在 Chromium 执行的竞态、完整重学往返和额外视觉状态，不能把跳过记为另两个浏览器的通过。
- 跨设备顺序场景使用受控测试夹具预置接近 Ready 的证据与 Review 卡，以缩短准备阶段；真实页面完成最后一题解锁、错误→Relearning、代码导出、独立手机浏览器 context 导入、虚拟时钟推进、同技能新题正确、再次迁回桌面。FSRS 卡、到期时间与技能证据逐字段比较。它不代表从零人工完成整套课程。
- 二维码：多帧往返由本地图像→jsQR 集成测试验证；浏览器文件选择验证单帧图片导入。未验证物理摄像头多帧采集。
- 生产构建页面：真实 Chromium 输入和判分成功；Worker、字体均来自本地站点，检查没有外部请求。
- Cloudflare Pages：<https://ap-calculus-practice.pages.dev/>；旧站继续保留进度迁移入口。首页、配置、Worker、MathLive 字体和常数题判分均返回成功。

## 2026-09-19 更新验收

- 项目改名为 `ap-calculus-practice`；新地址 <https://ap-calculus-practice.pages.dev/>。旧地址保留用于导出原有本地进度，不做会绕过导出入口的强制跳转。
- Ready 表示可以推进到下一技能：最近两道不同题首次无提示答对，覆盖两个结构。未到期 Ready 技能不再兜底重复。
- FSRS 参数、到期时间、数据格式与课程技能ID不变；旧快照继续兼容，旧已解锁等级不回退。
- 正确后 Next 获得焦点，Enter 立即继续，3秒进度条自动继续；错误回输入；手机下一题保持数学键盘。打开模态窗口或切后台取消当前倒计时。
- 复习答错后，两道新变式独立正确恢复推进状态；未到期的第二题不会提前改写 FSRS 时间线。

- 题头改为连对与今日已练；取消12题上限。首次有效判分/帮助计一题，重试不重复，跳过不计题但中断连对；本地日历日切换、31天有界计数及便携往返有独立单测。
- 答案标签使用放大数学排版；隐藏题型名称和通用radians提示，保留隐函数/参数/极坐标题必需定义条件。

- 本次本地浏览器证据为原流程全量 + 新流程三引擎24项 + Firefox定向重跑；曾有一次并行测试清理trace目录引起的 teardown ENOENT，隔离重跑通过，不是产品断言失败。最终远端CI再执行完整81项。
- 连对/每日计数、旧快照兼容和自动跳题竞态由独立Luna Max定向复核；发现的定义日裁剪和倒计时取消问题修复后复核通过。
- 26技能×2题对照表由生产生成器生成，52题/52答案核对，SSR数学排版；桌面与390px网页实际渲染通过。

- 线上真实键入后立即Enter暴露MathLive输入通知滞后：提交现在同步读取可见Mathfield值。三引擎专门回归均通过，不依赖手工触发input事件。

## 2026-09-25 U3/U4 样式与安全区

- 浅色与深色主题使用同一组 CSS tokens；`tests/contrast.test.ts` 计算指定文字/背景组合的 WCAG 对比度。字号使用 rem tokens，Caption 不低于 12px。
- 页头、页脚和手机键盘展开时的固定操作栏加入安全区内边距。iPhone Safari 横屏刘海区域及 Android Chrome 的真机布局仍需实机验证。
- 当前沙箱禁止监听 `127.0.0.1:5174`（Vite 返回 `listen EPERM`），本轮无法采集 Playwright 截图或运行浏览器检查；由 reviewer 在可启动本地服务器的环境用独立临时配置运行 `tests/visual-tokens.spec.ts`，并检查 `artifacts/ux-refresh/` 中的明暗主题截图。基线可从本分支 U3/U4 修改前的 `8a76f18` 采集。

## Compact progress and scan-to-resume — 2026-09-19

- DSP2 uses a frozen field-order/profile, signature dictionary and zlib level 9. FSRS numbers and timestamps remain exact; DSP1 import remains supported.
- Exports retain only two recent evidence entries per skill, matching the two-correct advancement rule. Question expressions are replaced by a 128-bit SHA-256 fingerprint. Old expression signatures and new fingerprints compare consistently. No full question or answer history is exported.
- QR links contain data only in the URL fragment, cleared before config fetch. Fresh devices import and start practice; existing local state requires confirmation and gets a backup. Damaged links do not replace state. Same-page hash navigation is supported.
- Full-curriculum stress fixture: 26 skill cards, two evidence entries per skill, 31 daily counts. Copyable DSP2 approximately 2700 characters; one URL QR approximately 3600 characters, version 37-L. Representative ten-question export approximately 544 characters. Exact lengths vary with timestamps.
- Raster QR → jsQR → decoded portable snapshot compares equal, including FSRS precision. Node crypto independently checks fingerprint known vectors. Fresh-device/existing-device/damaged-link/full-curriculum URL flows pass Chromium, Firefox and WebKit (12 cases). Unit suite: 105 tests passed.
- Mobile 390×844 and desktop 1280×800 export dialogs rendered and inspected. Dense canvas remains square, fits available width, and saved full-resolution PNG imports through the actual UI.
- Physical phone-camera scanning is not independently verified. Unusually large imported snapshots can still require numbered QR frames in the in-app scanner; normal/full-curriculum fixtures use one link QR.
- Reproduction: `npx tsx scripts/qr-size-audit.ts`, `npm test`, `npx playwright test tests/progress-link.spec.ts`, `npx playwright test --grep 'cross-context transfer'`.
