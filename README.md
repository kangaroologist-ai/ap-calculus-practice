# Derivative Studio

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
- `sessionLength`：每次练习题数，默认 12。
- `revision`：修改配置后更新此标签。

配置在新练习开始时重新获取。当前练习使用开始时的快照。静态站点更改配置后重新构建部署。

## 学生操作

按 Start practicing 开始。输入公式后点击 Check answer 或按 Enter，失焦不会判分。接受合理的未化简等价答案。Need a hint? 依次显示规则、结构、完整解析。查看教学帮助会作为一次非独立完成记录；输入指南不影响学习记录。

手机可打开 Math keyboard 输入分式、根式、指数和函数。所有角度均为弧度；`ln` 是自然对数，`log` 为常用对数。答案只输入表达式，不写 `y=`。

## 六级课程

1. 常数、幂、和差与根式。
2. 指数、对数、六三角函数及 arcsin/arccos/arctan。
3. 乘积、商与链式法则。
4. 深层复合与混合求导。
5. 隐函数、反函数点值与高阶导数。
6. 参数、向量与极坐标导数。

题目在浏览器中按规则即时生成，不存储整套固定题库。每技能至少两种结构模板，并按技能难度选择基本函数、系数、幂次和组合；乘积、商、链式及混合规则会改变函数组合。求导器从同一棵表达式树计算答案和中间步骤。随机种子用于复现，最近题目签名用于减少重复。测试生成的 5,200 题 corpus 只保存在忽略的测试产物目录，不会进入学生站点。

覆盖求导计算；没有证明、图表分析、文字应用或积分题。

## FSRS 与升级

使用精确锁定的 `ts-fsrs 5.4.2`（FSRS-6.0），目标保持率 0.9，最大间隔 180 天，关闭间隔随机扰动，启用短期复习。默认学习步 1m/10m、重学步 10m。参数完整保存且不在本机训练。每个技能 ID 在固定课程版本中对应一个固定难度组；例如单层 `chain` 与多层 `nested` 使用不同卡片。随机换系数不会改变所属难度组。

- 首次独立正确：Good；明确错误或首次查看教学帮助：Again。
- 每道题最多更新一次；原题重试不重复更新。
- 未到期的额外练习只更新学习证据，不提前推进 FSRS。
- 语法无效、无法判断与跳过不会作为错误记分。
- 最近五道不同题中至少四道首次独立答对，且覆盖两模板，才可 Ready。
- 本级所有启用技能 Ready 且没有未解决补弱项，自动解锁下一级。解锁不会因遗忘倒退。
- 发生新错误立即补弱；至少一道新的同技能独立成功，且仍满足 Ready 条件，才解除补弱。
- 尽量隔两道其他技能题再补弱。若所有可练技能都在等待，结束这次练习，等 FSRS 到期再继续，不强迫无限刷题。

FSRS 目标保持率不是经过校准的数学掌握概率。随机变式的学习效果仍需真实课堂观察。

## 在设备之间迁移

1. 原设备点击 Move progress → Export progress。
2. 复制完整代码，或逐张展示编号二维码。
3. 新设备打开同一版站点 → Move progress → Import progress。
4. 粘贴代码、扫描二维码或选择二维码图片。
5. 检查摘要后点击 Replace with this progress。

快照含完整 FSRS 状态／参数／版本、技能证据、已解锁等级、复习和诊断队列；不含姓名、账号、完整作答历史和当前草稿。换设备从新题开始。本地刷新则可恢复当前题。

代码是自包含数据，不需要服务端短码。较大快照分多张二维码。所有分片属于同一快照且收齐后才能导入。禁止自动合并两台设备各自继续练习的历史。导入前自动保留本机备份，可用 Restore backup 撤回。代码并非加密，获得代码的人可读取学习状态；不要将其当作正式成绩凭证。

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

## Cloudflare Pages

纯静态部署，无 Workers Functions 和数据库需求。使用现有账号免费计划即可；不在仓库保存 token。

```sh
npm run build
npx wrangler login
npx wrangler pages project create ap-derivative-practice --production-branch main
npx wrangler pages deploy dist --project-name ap-derivative-practice --branch main
```

若 Pages 项目已存在，跳过 create。GitHub 私有仓库用于源码和 CI；当前使用 CLI 直接上传，提交代码不会自动触发生产部署。后续需要自动部署可在 Cloudflare 连接该 GitHub 仓库。
