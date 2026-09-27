# AP Calculus Practice

无账号的 AP 求导自适应练习网页。电脑与手机均可使用，学习状态只存在浏览器本机，支持进度代码／二维码迁移。

## 本地启动

需要 Node.js 24（构建工具）与 npm。

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:5173/ 。生产构建：

```sh
npm run build
npm run preview
```

字体、公式组件、判分 Worker 都随站点部署。无需任何付费 API 或学生数据库。手机访问本机开发服务时可用 `npm run dev -- --host 0.0.0.0` 并打开电脑的局域网地址；普通局域网 HTTP 不提供摄像头权限，请使用代码／二维码图片导入。正式站点使用 HTTPS。

## 教师设置

编辑 `public/practice-config.json`：

- `initialUnlockedLevel`：新用户初始开放到哪一级，1–6；不是学习上限。默认 1。
- `disabledFamilies`：禁用技能 ID 列表，ID 见 `src/catalog.ts`。
- `sessionLength`：旧配置兼容字段，当前连续练习不再使用它限制题数。
- `revision`：修改配置后更新此标签。

配置在新练习开始时重新获取。当前练习使用开始时的快照。静态站点更改配置后重新构建部署。

## 学生操作

按 Start practicing 开始，焦点进入答题框；已有进度时按钮显示 Continue practicing，下方提示接下来的技能。输入公式后点击 Check answer 或按 Enter，失焦不会判分。答对后 Check answer 与 Need a hint? 隐藏，Next question 成为唯一的主按钮并获得焦点，再按 Enter 立即继续；不操作则倒计时 1.5 秒自动继续。答错或输入无效时焦点回到答题框。判分结果在所有设备上都直接显示在答题框里：答对时边框变绿，右侧显示 ✓ Correct，框底是倒计时线；答错时边框变琥珀色，显示 ! Not quite（答错的说明句只给读屏软件）；输入无效或无法判定时显示 Check your input，并在答题框下方用一行琥珀色小字说明原因（如括号不配对、用了本题以外的变量）；长答案的末尾会在提示文字下淡出，改答案后提示和小字消失。页面下方不再显示反馈框和 Next in 3s 进度条。手机上数学键盘打开时，页面下方的按钮栏也隐藏：Check / Next、Hint?、Skip 都在键盘上（见下一段）。点提示后，新提示会滚进视野。下一题自动聚焦，手机数学键盘保持展开。打开帮助、迁移或 What’s new 窗口，或切到后台，都会取消当前倒计时。接受合理的未化简等价答案。Need a hint? 依次显示规则、结构、完整解析。查看教学帮助会作为一次非独立完成记录；输入指南不影响学习记录。

电脑和手机都可点 Math keyboard 打开数学键盘。键盘只有一页，4 行 9 列，左右基本占满屏幕，所有数学键都用与题目相同的数学字体。左侧三列是 sin/cos/tan、sec/csc/cot，第 3 行是括号 ( )、e^▫，底行是 ←、→、ln；中间是 7-8-9 / 4-5-6 / 1-2-3 / 0 . 的数字块；第 7 列是运算列：分式（上下两个空框）、乘号 ·、−、+；右上是本题变量（x、t 或 θ，隐函数题为 x）和 ⇧，第 2 行右侧是幂 ▫^▫ 和根号 √▫，第 3 行右侧是删除，右下角是蓝色的确认键：判分前显示 Check，答对后显示 Next，与按 Enter 相同。等待输入的位置都画成空框。**每个键最多有一个第二功能（alt）**：sin/cos/tan → arcsin/arccos/arctan（键帽显示 sin⁻¹ 等），sec/csc/cot → 平方，分式 → ÷，幂 → 本题变量的幂，√ → 本题变量的平方根，( → 绝对值，e^▫ → 常数 e，ln → 带底数的 log，7 8 9 → x y z，4 5 6 → u v w，1 2 3 → r s t，0 → θ，小数点 → π。取得 alt 有两种方式：按住键约半秒，键上方的气泡显示将输入的内容，松手输入（手指移开则取消）；或点 ⇧，下一个键输入 alt，连点两次 ⇧ 锁定、再点解除；⇧ 打开时有 alt 的键会换成 alt 并变蓝。键上不印 alt；键盘第一次打开时顶栏中间有一行提示 Hold a key or tap ⇧ for more，用过一次长按或 ⇧ 后不再显示。立方根键已去掉，可输入 ^(1/3)。键盘顶栏左侧是 Hint?、Skip，右侧是收起键盘按钮；提示用完时 Hint? 隐藏，答对后只剩收起按钮。收起后可以用题目下方的 Math keyboard 重新打开。按键没有悬停提示，读屏软件会读出按键名称（如 fraction、square root、sine；⇧ 打开时读 alt 的名称）。键盘上方不再有撤销／重做／剪贴板工具栏。所有角度均为弧度；`ln` 是自然对数，`log` 为常用对数（ln 的 alt 是一个可填底数的 log）。答案只输入表达式，不写 `y=`。

网站更新后，本机已有进度的学生下次打开页面时会看到 What’s new 窗口，列出自上次看过以来的所有更新，看过一次后不再自动弹出；第一次使用的新设备（包括用二维码链接首次恢复进度）不弹。页脚的 What’s new 按钮显示当前版本号（如 v1.1.1），可随时重新打开全部更新记录。浏览器禁用站点存储时不自动弹出。“已读”标记只存在本机浏览器，不进入进度、导出代码或备份。

页面跟随系统的浅色／深色设置；公式以可朗读文本提供给读屏软件。完整的英文学生说明在 [How to use](help.html)。Progress 内直接展开各等级查看技能与复习日期。独立连对从第 5 题起每次播放局部庆祝，从第 10 题起每次增加全屏彩纸；开启“减少动态效果”时停用动画。

供课程审核的 [技能层级与基础／混合题对照](docs/skill-hierarchy-review.md) 与 [二维码完整字段清单](docs/progress-payload-review.md) 已单独列出。现行实现保留原有 6 级与技能顺序，并按基础线、混合线推进；v1 进度按保守规则迁移。

## 六级课程

1. 常数、幂、和差与根式。
2. 指数、对数、六三角函数及 arcsin/arccos/arctan。
3. 乘积、商与链式法则。
4. 深层复合与混合求导。
5. 隐函数、反函数点值与高阶导数。
6. 参数、向量与极坐标导数。

每个技能都有 Basic 和 Mixed 两条学习线。Basic 线先建立该技能规则，Mixed 线再练习它与已通过基础线的规则组合；两条线都通过后，该技能显示为 Ready。等级在本级所有启用技能的 Basic 线通过后开放，Mixed 线不会阻住后续基础课程。

### 题目生成

题目在浏览器中按规则即时生成，不存储整套固定题库。`GENERATOR_VERSION` 为 `2.0.0`；`src/templates.ts` 用声明式注册表定义模板，每个模板有稳定的字符串 `key`，并以元数据标明导数阶数、奇次根等属性，不再依赖模板数字的隐含含义。模板变体按技能难度选择基本函数、系数、幂次和组合；求导器从同一棵表达式树计算答案和中间步骤。

每道题的 `requiredSkills` 根据实际表达式推断，并包含题型本身所需的技能；`supportingSkills` 保留为兼容字段。隐函数使用通用 graph curve 描述曲线，判分器沿生成的曲线采样。随机种子用于复现；本机学习记录仅保存 q2 短指纹以减少近期重复。测试生成的 10,100 题 corpus 只保存在忽略的测试产物目录，不会进入学生站点。

覆盖求导计算；没有证明、图表分析、文字应用或积分题。

## FSRS 与升级

使用精确锁定的 `ts-fsrs 5.4.2`（FSRS-6.0），目标保持率 0.9，最大间隔 180 天，关闭间隔随机扰动，启用短期复习。默认学习步 1m/10m、重学步 10m。参数完整保存且不在本机训练。每个技能 ID 在固定课程版本中对应一个固定难度组；例如单层 `chain` 与多层 `nested` 使用不同卡片。随机换系数不会改变所属难度组。

- 首次独立正确：Good；明确错误或首次查看教学帮助：Again。
- 每道题最多更新一次；原题重试不重复更新。
- 未到期的额外练习只更新对应学习线，不提前推进 FSRS。Ready 且未到期的技能不作为兜底练习；新技能按课程顺序安排。到期复习仍按 FSRS 保留，推进不等于永久掌握。
- 语法无效、无法判断与跳过不会作为错误记分。
- 同一条线上，两道不同题首次无提示答对即可通过该线。Basic 线与 Mixed 线分别记录；只有两线都 Ready 时技能才显示 Ready。
- 本级所有启用技能的 Basic 线通过后，自动解锁下一级。通过记录与已解锁等级都是粘性的，不会因后续错误回锁。
- 答错或查看教学提示会修复出错的那条线；随后需两道新的、不同题目的首次无提示正确答案来清除该线的补弱状态。Mixed 线错误不会撤销 Basic 通过。
- 诊断只在一个技能连续失败的第 1 次触发；候选先修技能必须出现在本题的 `requiredSkills` 中，且已启用、已解锁并处于 Ready。
- 尽量隔两道其他技能题再补弱。若所有可练技能都在等待，结束这次练习，等 FSRS 到期再继续，不强迫无限刷题。

FSRS 目标保持率不是经过校准的数学掌握概率。随机变式的学习效果仍需真实课堂观察。

## 在设备之间迁移

1. 原设备点击 Move progress（窗口标题为 Move your progress）→ Export progress。
2. 复制完整代码，或展示二维码；可点 Save QR image 保存原尺寸图片。
3. 手机相机扫新版二维码会直接打开网站：新设备恢复并开始练习，已有本机进度则确认替换；链接数据位于 URL fragment，不发送给服务器，读取后从地址栏清除。也可手动打开同一版站点 → Move progress → Import progress。
4. 粘贴代码、扫描二维码或选择二维码图片。
5. 检查摘要后点击 Replace with this progress。

所有进度入口统一经过 `migrateProgress`：本机启动、备份恢复以及 DSP1／DSP2 导入都会先核对课程、调度器、算法和参数身份，再按已登记路径迁移。未知身份会拒绝且不改动数据；遇到更新版本的存档或 compact profile 会提示 `Reload the page to update`，请先刷新页面加载新版再重试。代码不完整或损坏时提示 `This progress code can’t be read`，请重新复制完整代码，或在原设备重新导出。

v1 Ready 技能迁移为 Basic 已通过（标记为 legacy），Mixed 从 0/2 开始。v1 技能若在最近证据窗口中曾 Ready，或其等级低于原先解锁等级，也保留 Basic 通过；当前是否处于补弱、最后一条证据、FSRS 卡、连对数、练习日计数、序号、诊断队列和解锁等级均沿用。v1 本机数据中进行中的 session 会丢弃，下次从新题开始。教师把 `initialUnlockedLevel` 调高时，低等级里练过但从未 Ready 的技能也可能获得 Basic 通过；这项略宽松迁移只影响开放门槛，不代表该技能已经 Ready，因为 Mixed 线仍需从零完成。格式升级会把升级前数据原样放入独立的 `pre-migration` 键，不占用手动 `backup`；若已有较早的归一化留底，格式升级会用本次 v1 原件替换它。

快照含完整 FSRS 状态／参数／版本、每个技能的 Basic/Mixed 连对数、粘性通过／补弱／legacy 标记、最近题目的 `q2:` 指纹（SHA-256 前 32 bit，共 8 位十六进制；不含题目公式）、已解锁等级、复习和诊断队列；不含姓名、账号、完整作答历史和当前草稿。换设备从新题开始。本地刷新则可恢复当前题。

代码是自包含数据，不需要服务端短码。profile 1 和 2 永久保留为旧码解码格式，最新的 profile 3 负责导出；旧 DSP1 也仍可导入。DSP2 使用固定字段顺序、短指纹字典与压缩，保留 FSRS 原始数值精度。二维码在 M 级纠错下不超过第 30 版时使用 M，否则使用 L；直接链接与密集编码两种形式会选版本较小者，只有超出单码容量的异常大快照才分片。全课程 v1 fixture 迁移到 v2 后导出为 1,200 字符，单张二维码链接为 1,663 字符、28-M（`node --import tsx scripts/qr-size-audit.ts` 实测）。所有分片属于同一快照且收齐后才能导入。禁止自动合并两台设备各自继续练习的历史。显式导入前自动保留本机备份，可用 Restore backup 撤回。代码并非加密，获得代码的人可读取学习状态；不要将其当作正式成绩凭证。

## 判分边界

使用原始表达式解析、有限白名单、独立的实数定义条件检查和至少 24 个高精度有效采样点。学生额外引入的分母、根式、对数限制必须被原题定义域支持；无法确认时返回无法判定。可精确定位且落在原题有效域内的额外线性分母零点会被拒绝。隐函数仅沿原曲线取点；参数／极坐标检查斜率分母。40 位以上 Decimal 数学运算用于数值核验，浮点容差接受常见等价变形。表达式太复杂或无法可靠判定时不影响学习记录。

数值一致不是任意公式的形式证明，可能有残余误判；受限生成规则与独立数学回归用于降低风险。计算在 Worker 运行，超过 3 秒返回无法判定。

## 测试

```sh
npm test
npm run test:progress
python3 -m venv .venv
.venv/bin/pip install -r requirements-test.txt
npm run test:math
npm run build
npx playwright install chromium webkit firefox
npm run test:e2e
```

`test:math` 生成固定随机种子 corpus 并使用 SymPy 独立求导核对。`node --import tsx scripts/key-usage.ts` 统计题库答案里各运算和函数出现的比例，数学键盘的布局依据它来取舍。浏览器测试使用临时测试数据；真机证据与模拟视口证据分别记录在 `docs/acceptance.md`。

`tests/fixtures/dsp1.txt`、`dsp2-profile1.txt`、`local-state-v1.json`、`generator-1.1.0.json` 是旧格式的冻结样本；`dsp2-profile2.txt` 与 `local-state-v1-q2.json` 是 Phase 2 迁移基线。所有文件一经提交都不得重新生成或手工编辑；`tests/legacy-fixtures.test.ts` 用当前代码解码／校验它们。只需生成新增的两份时，运行 `node --import tsx scripts/capture-fixtures.ts --phase2-only`；该选项只写 profile 2 与 q2 本机状态，退出前不会运行原有四份样本的捕获代码。捕获脚本不在测试或构建中运行。

## 设计规范与发布前设计审核

界面规则（令牌、组件、数学键盘、动效、无障碍、文案）写在 `docs/design/DESIGN.md`。凡是要提升版本号的改动，发布前按 `docs/design/review-workflow.md` 审核：先启动开发服务器，再运行

```sh
npm run design:capture
```

在 `artifacts/design/<版本>/` 生成 390 px（WebKit iPhone 仿真）与 1280 px（Chromium）、浅色与深色的截图矩阵和键盘几何数据，然后按改动范围比对受影响的界面状态（常规审核）。新增界面或组件、修改设计原则或令牌、较大改版时，再做完整审核：派全局子代理 `design-reviewer`（Sonnet、medium，运行全局技能 `design-review`），一次完成三个评审视角，流程见 `docs/design/review-workflow.md`。P0 / P1 问题清零后才发布。

## Cloudflare Pages

**版本与更新记录：** `package.json` 的 `version` 是网站版本号，构建时注入页面。每次发布学生可见的变化，都要提升版本号，并在 `src/whats-new.ts` 顶部新增同版本条目（英文，2–6 条要点）；单元测试要求两者一致。纯重构、测试或内部文档不改版本、不加条目。

纯静态部署，无 Workers Functions 和数据库需求。使用现有账号免费计划即可；不在仓库保存 token。

```sh
npm run build
npx wrangler login
npx wrangler pages project create ap-calculus-practice --production-branch main --force
npx wrangler pages deploy dist --project-name ap-calculus-practice --branch main
```

若 Pages 项目已存在，跳过 create。GitHub 私有仓库用于源码和 CI；当前使用 CLI 直接上传，提交代码不会自动触发生产部署。后续需要自动部署可在 Cloudflare 连接该 GitHub 仓库。

## 项目改名与旧进度

项目名为 `ap-calculus-practice`，线上地址 <https://ap-calculus-practice.pages.dev/>；当前课程为求导，后续可扩展积分。

旧站 <https://ap-derivative-practice.pages.dev/> 保留进度导出入口。不同域名的 IndexedDB 相互隔离，请在旧站用 Move progress 导出，再到新站导入。旧便携快照及完整 FSRS 状态仍兼容；不重置学习记录。内部数据库名保留 `derivative-studio`，避免同域升级造成记录丢失。

题型对照表：<https://ap-calculus-practice.pages.dev/skill-examples.html>，每技能两道真实生成示例与答案。

## 连对与今日题数

题头显示 `in a row` 与 `practiced today`，不再显示 Level / 第几题或固定题数进度条。练习连续进行，直到当前没有可学新技能或到期复习；此时显示 All caught up，避免重复刷已经通过且尚未到期的题。

- 连对：每题首次无提示正确加一；首次错误、教学提示或未作答跳过会中断。重试正确不补回连对，语法无效／无法判定不改变。
- 今日题数：按设备本地日历日期，每题首次有效判分或教学提示计一次；重试与跳过不重复加数。保存最近 31 个日历日期的计数，换时区后按新设备当前日期显示。
- 两项计数均随进度快照导出；旧快照没有这些字段时按零处理。
- 连对达到 5 起，每次独立正确都播放轻量动画；达到 10 起，每次再加全屏彩纸。开启“减少动态效果”时停用动画。
