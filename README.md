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

按 Start practicing 开始，焦点进入答题框。输入公式后点击 Check answer 或按 Enter，失焦不会判分。答对后焦点移到 Next question，再按 Enter 立即继续；不操作则倒计时 3 秒自动继续。答错或输入无效时焦点回到答题框。下一题自动聚焦，手机数学键盘保持展开。打开帮助／迁移窗口或切到后台会取消当前倒计时。接受合理的未化简等价答案。Need a hint? 依次显示规则、结构、完整解析。查看教学帮助会作为一次非独立完成记录；输入指南不影响学习记录。

手机可打开 Math keyboard 输入分式、根式、指数和函数。所有角度均为弧度；`ln` 是自然对数，`log` 为常用对数。答案只输入表达式，不写 `y=`。

完整的英文学生说明在 [How to use](help.html)。Progress 内直接展开各等级查看技能与复习日期。独立连对从第 5 题起每次播放局部庆祝，从第 10 题起每次增加全屏彩纸；开启“减少动态效果”时停用动画。

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

题目在浏览器中按规则即时生成，不存储整套固定题库。`GENERATOR_VERSION` 为 `1.2.0`；`src/templates.ts` 用声明式注册表定义模板，每个模板有稳定的字符串 `key`，并以元数据标明导数阶数、奇次根等属性，不再依赖模板数字的隐含含义。模板变体按技能难度选择基本函数、系数、幂次和组合；求导器从同一棵表达式树计算答案和中间步骤。

每道题的 `requiredSkills` 根据实际表达式推断，并包含题型本身所需的技能；`supportingSkills` 保留为兼容字段。隐函数使用通用 graph curve 描述曲线，判分器沿生成的曲线采样。随机种子用于复现；本机学习记录仅保存 q2 短指纹以减少近期重复。测试生成的 5,200 题 corpus 只保存在忽略的测试产物目录，不会进入学生站点。

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

1. 原设备点击 Move progress → Export progress。
2. 复制完整代码，或展示二维码；可点 Save QR image 保存原尺寸图片。
3. 手机相机扫新版二维码会直接打开网站：新设备恢复并开始练习，已有本机进度则确认替换；链接数据位于 URL fragment，不发送给服务器，读取后从地址栏清除。也可手动打开同一版站点 → Move progress → Import progress。
4. 粘贴代码、扫描二维码或选择二维码图片。
5. 检查摘要后点击 Replace with this progress。

所有进度入口统一经过 `migrateProgress`：本机启动、备份恢复以及 DSP1／DSP2 导入都会先核对课程、调度器、算法和参数身份，再按已登记路径迁移。未知身份会拒绝且不改动数据；遇到更新版本的存档或 compact profile 会提示 `Reload the page to update`，请先刷新页面加载新版再重试。

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

`test:math` 生成固定随机种子 corpus 并使用 SymPy 独立求导核对。浏览器测试使用临时测试数据；真机证据与模拟视口证据分别记录在 `docs/acceptance.md`。

`tests/fixtures/dsp1.txt`、`dsp2-profile1.txt`、`local-state-v1.json`、`generator-1.1.0.json` 是旧格式的冻结样本；`dsp2-profile2.txt` 与 `local-state-v1-q2.json` 是 Phase 2 迁移基线。所有文件一经提交都不得重新生成或手工编辑；`tests/legacy-fixtures.test.ts` 用当前代码解码／校验它们。只需生成新增的两份时，运行 `node --import tsx scripts/capture-fixtures.ts --phase2-only`；该选项只写 profile 2 与 q2 本机状态，退出前不会运行原有四份样本的捕获代码。捕获脚本不在测试或构建中运行。

## Cloudflare Pages

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
- 5 连对播放一次轻量动画，10 连对及之后每次独立正确播放庆祝动画；遵循系统减少动态效果设置。
