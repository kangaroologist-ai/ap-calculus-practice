# AP Calculus Practice

AP 求导自适应练习网页。电脑与手机均可使用。不登录时学习状态只存在浏览器本机，可用进度代码／二维码迁移；学生用老师发的登录码登录后，进度同时保存在线上，换任何设备都能接着练（见“学生账号与在线保存”）。

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

字体、公式组件、判分 Worker 都随站点部署。无需任何付费 API。学生账号用 Cloudflare 免费计划里的 Pages Functions 和一个 D1 数据库。`npm run dev` 不运行 Functions；要在本机试账号功能，先运行 `npm run build` 和 `npm run db:local`（建表并写入测试班级 TEST），再运行 `npx wrangler pages dev dist --ip 127.0.0.1 --port 8788`，打开 http://127.0.0.1:8788/ ；开着它时 `npm run dev` 也会把 `/api` 转发过去。手机访问本机开发服务时可用 `npm run dev -- --host 0.0.0.0` 并打开电脑的局域网地址；普通局域网 HTTP 不提供摄像头权限，请使用代码／二维码图片导入。正式站点使用 HTTPS。

## 教师设置

编辑 `public/practice-config.json`：

- `initialUnlockedLevel`：新用户初始开放到哪一级，1–6；不是学习上限。默认 1。
- `disabledFamilies`：禁用技能 ID 列表，ID 见 `src/catalog.ts`。默认关闭第 6 级：`["parametric", "vector", "polar"]`（2026-10-21 负责人决定，曲线与坐标暂不练习）；学习路径中该级显示 Not included。删去这三个 ID 即可重新开启。
- `sessionLength`：旧配置兼容字段，当前连续练习不再使用它限制题数。
- `revision`：修改配置后更新此标签。

配置在新练习开始时重新获取。当前练习使用开始时的快照。静态站点更改配置后重新构建部署。

## 学生操作

按 Start practicing 开始，焦点进入答题框；已有进度时按钮显示 Continue practicing，下方提示接下来的技能。输入公式后点击 Check answer 或按 Enter，失焦不会判分。答对后 Check answer 与 Need a hint? 隐藏，Next question 成为唯一的主按钮并获得焦点，再按 Enter 立即继续；不操作则倒计时 1.5 秒自动继续。答错或输入无效时焦点回到答题框。判分结果在所有设备上都直接显示在答题框里：答对时边框变绿，右侧显示 ✓ Correct，框底是倒计时线；答错时边框变琥珀色，显示 ! Not quite（答错的说明句只给读屏软件）；输入无效或无法判定时显示 Check your input，并在答题框下方用一行琥珀色小字说明原因（如括号不配对、用了本题以外的变量）；长答案的末尾会在提示文字下淡出，改答案后提示和小字消失。页面下方不再显示反馈框和 Next in 3s 进度条。手机上数学键盘打开时，页面下方的按钮栏也隐藏：Check / Next、Hint?、Skip 都在键盘上（见下一段）。点提示后，新提示会滚进视野。下一题自动聚焦，手机数学键盘保持展开。打开帮助、迁移或 What’s new 窗口，或切到后台，都会取消当前倒计时。接受合理的未化简等价答案。Need a hint? 依次显示规则、结构、完整解析。查看教学帮助会作为一次非独立完成记录；输入指南不影响学习记录。

电脑和手机都可点 Math keyboard 打开数学键盘。键盘只有一页，4 行 9 列，左右基本占满屏幕，所有数学键都用与题目相同的数学字体。左侧三列是 sin/cos/tan、sec/csc/cot，第 3 行是括号 ( )、e^▫，底行是 ←、→、ln；中间是 7-8-9 / 4-5-6 / 1-2-3 / 0 . 的数字块；第 7 列是运算列：分式（上下两个空框）、乘号 ·、−、+；右上是本题变量（x、t 或 θ，隐函数题为 x）和 ⇧，第 2 行右侧是幂 ▫^▫ 和根号 √▫，第 3 行右侧是删除，右下角是蓝色的确认键：判分前显示 Check，答对后显示 Next，与按 Enter 相同。等待输入的位置都画成空框。**每个键最多有一个第二功能（alt）**：sin/cos/tan → arcsin/arccos/arctan（键帽显示 sin⁻¹ 等），sec/csc/cot → 平方，分式 → ÷，幂 → 本题变量的幂，√ → 本题变量的平方根，( → 绝对值，e^▫ → 常数 e，ln → 带底数的 log，7 8 9 → x y z，4 5 6 → u v w，1 2 3 → r s t，0 → θ，小数点 → π。取得 alt 有两种方式：按住键约半秒，键上方的气泡显示将输入的内容，松手输入（手指移开则取消）；或点 ⇧，下一个键输入 alt，连点两次 ⇧ 锁定、再点解除；⇧ 打开时有 alt 的键会换成 alt 并变蓝。手机上键上不印 alt；窗口宽度 700 px 以上（电脑）时，有 alt 的键右上角印一个淡蓝小字提示。键盘第一次打开时顶栏中间有一行提示 Hold a key or tap ⇧ for more，用过一次长按或 ⇧ 后不再显示。立方根键已去掉，可输入 ^(1/3)。抽象函数题（含 f、g 的题）只换四个键：tan、sec、csc、cot 变成 f(▫)、f′(▫)、g(▫)、g′(▫)（g 在第 1 行第 3 列，f、f′、g′ 在第 2 行左侧），单按插入函数并选中括号里的空框；电脑上也可直接输入 `f'(x^3)`。键盘顶栏左侧是 Hint?、Skip，右侧是收起键盘按钮；提示用完时 Hint? 隐藏，答对后只剩收起按钮。收起后可以用题目下方的 Math keyboard 重新打开。按键没有悬停提示，读屏软件会读出按键名称（如 fraction、square root、sine；⇧ 打开时读 alt 的名称）。键盘上方不再有撤销／重做／剪贴板工具栏。所有角度均为弧度；`ln` 是自然对数，`log` 为常用对数（ln 的 alt 是一个可填底数的 log）。答案只输入表达式，不写 `y=`。

打开页面时如果 5 秒内无法打开本机保存的进度（iPhone Safari 偶尔会卡住或失败），页面会提示 “We couldn’t open your saved progress.”，主按钮 Reload 重新载入（通常即可恢复，已保存的进度不受影响），次要的 Continue without saving 进入不保存的临时模式（页面顶部提示先导出进度）。

进度成功打开后，网站请求浏览器长期保存数据（`navigator.storage.persist()`，浏览器可以拒绝）。iPhone Safari 会删除连续约 7 天使用 Safari 却没打开过的网站的本机数据（添加到主屏幕的网站不受影响），帮助页提醒 iPhone 学生添加到主屏幕，并在长假前导出进度。

网站更新后，本机已有进度的学生下次打开页面时会看到 What’s new 窗口，列出自上次看过以来的所有更新，看过一次后不再自动弹出；第一次使用的新设备（包括用二维码链接首次恢复进度）不弹。页脚的 What’s new 按钮显示当前版本号（如 v1.1.1），可随时重新打开全部更新记录。浏览器禁用站点存储时不自动弹出。“已读”标记只存在本机浏览器，不进入进度、导出代码或备份。

页面跟随系统的浅色／深色设置；公式以可朗读文本提供给读屏软件。完整的英文学生说明在 [How to use](help.html)。Progress 内直接展开各等级查看技能与复习日期。独立连对从第 5 题起每次播放局部庆祝，从第 10 题起每次增加全屏彩纸；开启“减少动态效果”时停用动画。

供课程审核的 [技能层级与基础／混合题对照](docs/skill-hierarchy-review.md) 与 [二维码完整字段清单](docs/progress-payload-review.md) 已单独列出。现行实现保留原有 6 级与技能顺序，并按基础线、混合线推进；v1 进度按保守规则迁移。

## 六级课程

1. 常数、幂、和差与根式。
2. 指数、对数、sin、cos。
3. 乘积、商，tan、cot、sec、csc（在商法则之后），组合 I（两条法则，不含链式法则）。
4. 链式法则，组合 II（链式法则加一条其他法则，内层简单）。
5. 隐函数、反函数点值，arcsin、arccos、arctan（在反函数之后），高阶导数，组合 III（商加链式、链式加链式、三条法则），抽象函数（f、g 的一层复合，只考符号求导，没有表格题）。
6. 参数、向量与极坐标导数（默认由教师设置关闭）。

顺序由负责人在 2026-10-21 定下（任务文档 `docs/reviews/2026-10-21-practice-quality/plan.md` S8）：乘积法则不再以 tan 为前置，全部答对的学生在第 12 题遇到第一道乘积题。每个技能仍有 Basic 和 Mixed 两类题：Basic 建立该技能规则，Mixed 把它和已通过的技能组合；约每三题一道 Mixed。等级在本级所有启用技能通过后开放。

### 题目生成

题目在浏览器中按规则即时生成，不存储整套固定题库。`GENERATOR_VERSION` 为 `3.0.0`；`src/templates.ts` 用声明式注册表定义模板，每个模板有稳定的字符串 `key`，并以元数据标明导数阶数、奇次根等属性，不再依赖模板数字的隐含含义。模板变体按技能难度选择基本函数、系数、幂次和组合；求导器从同一棵表达式树计算答案和中间步骤。

数字规则（S1/S2）：题目里的系数与常数 Basic 用 1–5、Mixed 用 1–9；正指数 2–6，负指数 −1 到 −4，分数指数的分母为 2 或 3；化简后答案中的整数都小于 100，三阶导数答案不超过 200；同一和式不出现同次项，不出现函数自乘，指数与对数的底只用 2、3、5、10，反函数取点只用 −1、0、1、2，隐函数常数不超过 36、极坐标常数不超过 9。`tests/number-policy.test.ts` 每个模板 200 个种子检查这些规则。显示上数字直接写在字母或函数前（`15x^8`），被减项与首项负系数不加括号。

抽象函数题用 `["Fn", name, order, arg]` 节点表示 f、g 及其导数；判分时用三组隐藏的具体函数（都恒为正）代替 f、g，三组都相等才算对；只有这类题的解析器认识 f、g。

每道题的 `requiredSkills` 根据实际表达式推断，并包含题型本身所需的技能；`supportingSkills` 保留为兼容字段。隐函数使用通用 graph curve 描述曲线，判分器沿生成的曲线采样。随机种子用于复现；本机学习记录仅保存 q2 短指纹以减少近期重复。测试生成的 11,200 题 corpus 只保存在忽略的测试产物目录，不会进入学生站点。

覆盖求导计算；没有证明、图表分析、文字应用或积分题。

## 掌握度、FSRS 与升级

每个技能有一个掌握度估计：学生正确运用这个技能的概率（`src/mastery.ts`）。思路接近 IRT／Elo：每道判分题更新它用到的每个技能。本题预测答对率是这些估计值的乘积；答对时每个技能上调，答错时每个技能下调，估计值最低的技能被下调得最多（合取模型）。参数先按等级手设，起始值 L1 0.62、L2 0.58、L3 0.45、L4 0.40、L5/L6 0.35；以后有作答数据可以再校准。

- 首次独立正确算答对；明确错误或查看教学帮助算答错。每道题最多记一次；原题重试不重复记。语法无效、无法判断与跳过不记分。
- 估计值达到 80% 即通过（粘性），开放依赖它的技能与等级。第 1、2 级技能第一次答对即可通过；第 3 级起需要两次。
- 达到 85% 为 Ready（粘性）。已通过的技能若低于 60% 进入补弱（Rebuilding）：隔两道其他题后安排它的 Basic 题，回到 80% 再解除。未通过的技能答错属于正常学习，不进入补弱。
- 约每三题一道 Mixed 题；旧的“诊断所有先修技能”和“两道新题清除补弱”规则已取消。
- 复习时间仍由精确锁定的 `ts-fsrs 5.4.2`（FSRS-6.0）决定：目标保持率 0.9，最大间隔 180 天，关闭随机扰动，学习步 1m/10m、重学步 10m。主技能按首次结果评 Good 或 Again（到期才更新）；答对的组合题也给其中到期的组件技能记一次 Good。
- 若所有可练技能都在等待，结束这次练习，等 FSRS 到期再继续。
- 模拟验收（`tests/simulation.test.ts`、`tests/learning-path.test.ts`，40 名模拟学生，各带一个隐藏薄弱技能）：第一道乘积/商/链式题中位数第 29 题，补救题 9 道，31/40 名学生的薄弱技能得到针对练习；全部答对的学生第 12 题遇到乘积法则。

掌握度估计不是经过校准的成绩，FSRS 保持率也不是；随机变式的学习效果仍需真实课堂观察。

## 在设备之间迁移

1. 原设备点击 Move progress（窗口标题为 Move your progress）→ Export progress。
2. 复制完整代码，或展示二维码；可点 Save QR image 保存原尺寸图片。
3. 手机相机扫新版二维码会直接打开网站：新设备恢复并开始练习，已有本机进度则确认替换；链接数据位于 URL fragment，不发送给服务器，读取后从地址栏清除。也可手动打开同一版站点 → Move progress → Import progress。
4. 粘贴代码、扫描二维码或选择二维码图片。
5. 检查摘要后点击 Replace with this progress。

所有进度入口统一经过 `migrateProgress`：本机启动、备份恢复以及 DSP1／DSP2 导入都会先核对课程、调度器、算法和参数身份，再按已登记路径迁移。未知身份会拒绝且不改动数据；遇到更新版本的存档或 compact profile 会提示 `Reload the page to update`，请先刷新页面加载新版再重试。代码不完整或损坏时提示 `This progress code can’t be read`，请重新复制完整代码，或在原设备重新导出。

进度格式 3（课程 `ap-derivatives-3`，2026-10-21）：v2 迁移时按原状态给出掌握度初值（Ready 0.92、Basic 已通过 0.82、补弱中 0.55、其余为等级起始值），清空诊断队列，并把已解锁等级提到每个已通过技能在新路径中的等级，保证已通过的技能继续复习；v1 先迁到 v2 再迁到 3。

v1 Ready 技能迁移为 Basic 已通过（标记为 legacy），Mixed 从 0/2 开始。v1 技能若在最近证据窗口中曾 Ready，或其等级低于原先解锁等级，也保留 Basic 通过；当前是否处于补弱、最后一条证据、FSRS 卡、连对数、练习日计数、序号、诊断队列和解锁等级均沿用。v1 本机数据中进行中的 session 会丢弃，下次从新题开始。教师把 `initialUnlockedLevel` 调高时，低等级里练过但从未 Ready 的技能也可能获得 Basic 通过；这项略宽松迁移只影响开放门槛，不代表该技能已经 Ready，因为 Mixed 线仍需从零完成。格式升级会把升级前数据原样放入独立的 `pre-migration` 键，不占用手动 `backup`；若已有较早的归一化留底，格式升级会用本次 v1 原件替换它。

快照含完整 FSRS 状态／参数／版本、每个技能的掌握度（千分位整数）与观察次数、Basic/Mixed 连对数、粘性通过／补弱／legacy 标记、最近题目的 `q2:` 指纹（SHA-256 前 32 bit，共 8 位十六进制；不含题目公式）、已解锁等级、复习和诊断队列；不含姓名、账号、完整作答历史和当前草稿。换设备从新题开始。本地刷新则可恢复当前题。

代码是自包含数据，不需要服务端短码。profile 1–3 永久保留为旧码解码格式，最新的 profile 4（28 个技能）负责导出；旧 DSP1 也仍可导入。DSP2 使用固定字段顺序、短指纹字典与压缩，保留 FSRS 原始数值精度。二维码在 M 级纠错下不超过第 30 版时使用 M，否则使用 L；直接链接与密集编码两种形式会选版本较小者，只有超出单码容量的异常大快照才分片。冻结的 26 技能 fixture 迁移后导出为 1,181 字符，单张二维码 27-M；28 个技能全部练过的完整快照为 1,862 字符，单张二维码 31-L（`node --import tsx scripts/qr-size-audit.ts` 实测）。所有分片属于同一快照且收齐后才能导入。禁止自动合并两台设备各自继续练习的历史。显式导入前自动保留本机备份，可用 Restore backup 撤回。代码并非加密，获得代码的人可读取学习状态；不要将其当作正式成绩凭证。

## 学生账号与在线保存

账号是可选的：不登录时一切照旧，进度只存在本机，Move progress 照常可用。

**登录码。** 老师用脚本（见下）给每个学生生成一个登录码，形如 `CALC-K7QM-4ZX9-B2`：前面是班级前缀（2–8 个字母），后面是 10 位随机字符（Crockford Base32，约 50 bit）。输入不分大小写，空格和连字符可有可无，随机部分里的 O 当作 0、I／L 当作 1。同一个码可以在任意多台设备上用；它是钥匙，不锁设备。服务器只保存码的 SHA-256 哈希，不保存码本身，所以码丢了只能由老师换新码（进度保留）。

**登录。** 页眉的 Sign in 打开登录窗口：输入登录码，点 Sign in。窗口里有一句隐私说明（见下）。扫纸条上的二维码会打开 `/#login=<码>`：网站把码填进登录窗口，并立即从地址栏删掉；码在 URL fragment 里，不会发给服务器。码不对时提示 “This code doesn't match a student. Check the code on your slip.”；同一网络 10 分钟内输错 60 次后提示 “Too many attempts. Wait 10 minutes, then try again.”。登录后页眉显示 “Signed in as <姓名>” 和保存状态（Saved online／Saving…／Offline: saved on this device），页脚显示 “Signed in · progress saved online”。

**同步规则。** 本机 IndexedDB 仍是主存储，在线副本是第二份。服务器给每次保存一个修订号（revision），设备记下上次同步的修订号和当时的 `updatedAt`；判断哪份更新只看修订号，不看设备时钟（设备时钟可能不准）。“本机有新作答”指 `updatedAt` 与上次同步时不同；只保存当前题目或草稿不算。

| 情况 | 结果 |
|---|---|
| 线上没变，本机没变 | 不做任何事 |
| 线上没变，本机有新作答 | 保存到线上 |
| 线上更新了，本机没变 | 直接用线上副本，不提示 |
| 线上更新了，本机也有新作答 | 弹出 “Two copies of your progress”，学生选一份；两份相同则不提示 |
| 第一次在这台设备登录，账号是空的 | 本机有进度就上传 |
| 第一次在这台设备登录，账号有进度 | 本机没进度就下载；本机也有进度就弹窗（两份相同则不提示） |
| 老师清空了账号 | 本机有进度就重新上传 |

作答后最多每 20 秒保存一次（打开页面、登录时的上传也计入），切到后台或关闭页面时立即保存（`keepalive`）。所有联网操作一个接一个进行，不会同时发出两次保存。等待保存时状态显示 Saving…；浏览器报告离线时显示 Offline: saved on this device。没网时照常练习，联网后再保存。注意：开始练习要读取 `practice-config.json`，所以要先联网打开练习，之后断网也能继续。打开页面、登录后都会先取一次线上副本。两台设备各自离线练习后才会出现弹窗；弹窗里两份各显示最后练习时间、已解锁等级和已开始的技能数，按钮 Use the online copy／Keep this device's copy。没选中的那份存为本机备份，Restore backup 可以换回。不弹窗的自动下载不改动本机备份（被替换的那份已经在线上，或者是空的）。网站从不合并两份历史。登录状态下 Reset、Import、Restore 的确认窗口会提示在线进度也会跟着变。

**退出。** 账号窗口里的 Sign out 先把最新进度保存到线上，成功后删除这台设备上的登录码和全部本机进度（含备份），以免共用电脑的下一个学生看到。没网时不退出，并说明原因。退出过程中暂停作答。老师换了码以后，旧码在这台设备上存不了新进度：退出时提示先导出，按钮变成 Remove progress and sign out，学生确认后才删除。Safari 的 7 天清理也会删掉本机保存的登录码，所以学生要保管好纸条。

**隐私（网站上的英文原文由负责人 2026-10-22 批准）。** 登录窗口：“Signing in saves your progress online so you can continue on any device. Your teacher can see your name and your progress. Keep your code private.” 帮助页 Saving online 一节说明：线上保存姓名（老师在名单里输入的文字）、班级、进度快照和保存时间，存放在 Cloudflare；老师能看到；拿到登录码的人也能打开进度；删除线上进度请找老师；不登录则线上什么都不存。服务器日志不记录姓名、登录码或 IP；IP 只以哈希形式存在于输错计数表里；每次有人输错时，服务器删除 20 分钟以前的计数。

**服务器。** `functions/api/` 下三个端点，所有回答都带 `Cache-Control: no-store`：

- `POST /api/session` `{ code }` → 姓名、班级、修订号和在线副本（DSP2 进度代码，空账号为 `null`）。
- `PUT /api/progress` `{ code, baseRevision, progress, updatedAt }` → 新修订号；`baseRevision` 不是当前修订号时返回 409 和当前在线副本。
- `POST /api/teacher` `{ code }`（教师码）→ 所有班级和学生的在线副本。

D1 表（`migrations/0001_accounts.sql`）：`classes`（前缀、班名）、`students`（编号、码哈希、班级、姓名、在线副本、修订号、`updated_at`、`saved_at`）、`teacher`（教师码哈希，只有一行）、`login_failures`（IP 哈希、10 分钟窗口、次数）。服务器只存取进度代码文本，不解码，所以将来进度格式升级不需要改服务器。同一 IP（IPv6 按 /64）10 分钟内输错 60 次后返回 429；输对不计数，所以全班在同一个校园网里登录不会被锁。请求体上限 16 KB。D1 Time Travel 可把数据库恢复到 7 天内任意时刻。

**教师页面。** `/teacher`（不被搜索引擎收录）用教师码打开；码只存在本标签页的 `sessionStorage`，Close 清除。完整网格：每行一个学生，按班级分组；每列一个技能，按学习路径顺序，`practice-config.json` 关闭的技能不显示。每格显示掌握度百分比，并用颜色分档（低于 60%、低于 80%、低于 85%、85% 及以上）；没开始的技能留空。前三列是姓名、最后练习时间、已解锁等级；左右滚动时姓名列固定。可按班级筛选，按姓名或最后练习时间排序。线上副本来自更新的网站版本时该行显示 “Reload the page to update”，读不出的副本只在该行显示 “Can't read”。页面只读。

**教师脚本**（在笔记本上运行，需要先 `npx wrangler login`）：

```sh
npm run accounts -- create-class CALC "AP Calculus AB 2026"
npm run accounts -- add-students CALC names.txt
npm run accounts -- reissue CALC "学生姓名"
npm run accounts -- delete-student CALC "学生姓名"
npm run accounts -- delete-class CALC
npm run accounts -- teacher-code
npm run accounts -- report [CALC]
npm run accounts -- list
```

`names.txt` 每行一个姓名（空行忽略，同班重名拒绝）。`add-students` 生成登录码，先写好打印用的纸条页（每人一张：姓名、班级、登录码、登录二维码和 “Keep this slip. You need the code to sign in on a new device.”）和姓名－登录码 CSV，再把姓名和码哈希写入 D1。`reissue` 换新码并保留进度（学生编号不变）。两个删除命令要输入 DELETE 确认。`teacher-code` 生成新教师码并只显示一次，旧码立即失效。`report` 生成与教师页面相同网格的独立 HTML（样式内嵌，不联网）。纸条、CSV 和报告写到 `~/Documents/20_Study/AP Calculus/accounts-private/`（可用 `--out` 改），脚本拒绝写进本仓库的任何工作区；文件只有本人可读（权限 600）。姓名只通过 SQL 文件传给 wrangler，不出现在命令行里，并关闭 wrangler 的日志文件。加 `--local` 则操作本机测试数据库。

## 判分边界

使用原始表达式解析、有限白名单、独立的实数定义条件检查和至少 24 个高精度有效采样点。学生额外引入的分母、根式、对数限制必须被原题定义域支持；无法确认时返回无法判定。可精确定位且落在原题有效域内的额外线性分母零点会被拒绝。隐函数仅沿原曲线取点；参数／极坐标检查斜率分母。40 位以上 Decimal 数学运算用于数值核验，浮点容差接受常见等价变形。表达式太复杂或无法可靠判定时不影响学习记录。

数值一致不是任意公式的形式证明，可能有残余误判；受限生成规则与独立数学回归用于降低风险。计算在 Worker 运行：题目一出现就提前加载判分程序，3 秒上限只算判分计算本身，超过返回无法判定；判分程序启动另有 20 秒上限，超过时提示 The checker is still loading（2026-10-22 起；此前首次判分会把下载和启动也算进 3 秒，手机网络慢时正确答案也会显示 Check your input）。

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
npm run test:e2e:accounts
```

`test:math` 生成固定随机种子 corpus 并使用 SymPy 独立求导核对。`node --import tsx scripts/key-usage.ts` 统计题库答案里各运算和函数出现的比例，数学键盘的布局依据它来取舍。`test:e2e:accounts` 先构建并用 `npm run db:local` 建好本机 D1（测试班级 TEST、学生 Ada Test 和 Ben Test、测试教师码，均为编造的测试值），再在 `wrangler pages dev`（端口 8788）上跑账号、同步和教师页面测试；服务器单元测试在 Node 里直接调用处理函数，D1 用 `node:sqlite` 代替。浏览器测试使用临时测试数据；真机证据与模拟视口证据分别记录在 `docs/acceptance.md`。

`tests/fixtures/dsp1.txt`、`dsp2-profile1.txt`、`dsp2-profile3.txt`、`local-state-v2.json`、`local-state-v1.json`、`generator-1.1.0.json` 是旧格式的冻结样本；`dsp2-profile2.txt` 与 `local-state-v1-q2.json` 是 Phase 2 迁移基线。所有文件一经提交都不得重新生成或手工编辑；`tests/legacy-fixtures.test.ts` 用当前代码解码／校验它们。只需生成新增的两份时，运行 `node --import tsx scripts/capture-fixtures.ts --phase2-only`；该选项只写 profile 2 与 q2 本机状态，退出前不会运行原有四份样本的捕获代码。捕获脚本不在测试或构建中运行。

## 设计规范与发布前设计审核

界面规则（令牌、组件、数学键盘、动效、无障碍、文案）写在 `docs/design/DESIGN.md`。凡是要提升版本号的改动，发布前按 `docs/design/review-workflow.md` 审核：先启动开发服务器，再运行

```sh
npm run design:capture
```

在 `artifacts/design/<版本>/` 生成 390 px（WebKit iPhone 仿真）与 1280 px（Chromium）、浅色与深色的截图矩阵和键盘几何数据，然后按改动范围比对受影响的界面状态（常规审核）。新增界面或组件、修改设计原则或令牌、较大改版时，再做完整审核：派全局子代理 `design-reviewer`（Sonnet、medium，运行全局技能 `design-review`），一次完成三个评审视角，流程见 `docs/design/review-workflow.md`。P0 / P1 问题清零后才发布。

## Cloudflare Pages

**版本与更新记录：** `package.json` 的 `version` 是网站版本号，构建时注入页面。每次发布学生可见的变化，都要提升版本号，并在 `src/whats-new.ts` 顶部新增同版本条目（英文，2–6 条要点）；单元测试要求两者一致。纯重构、测试或内部文档不改版本、不加条目。

静态页面加 `functions/api/` 下的 Pages Functions 和一个 D1 数据库（绑定名 `DB`，见 `wrangler.toml`），都在现有账号的免费计划内（每天 100,000 次 Function 请求、100,000 行 D1 写入；静态页面不计数）。不在仓库保存 token。

第一次启用账号时（只做一次）：

```sh
npx wrangler d1 create ap-calculus-practice
# 把输出的 database_id 写进 wrangler.toml
npx wrangler d1 migrations apply ap-calculus-practice --remote
npm run accounts -- teacher-code
```

再在 Cloudflare 控制台 Pages 项目的 Settings → Runtime 选择 fail open：每日额度用完时静态页面照常打开，只有在线保存暂停。

部署：

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
