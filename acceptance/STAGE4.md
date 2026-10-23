# 阶段 4 验收记录：上传与删除

## 存储位置说明修正（2026-10-23）

- 核验到 R2 `star` 桶位置为 APAC、默认 jurisdiction，与原「图片存在美国」说明不符；已确认保留该桶并改说明：`info.full.storage` 改为「数据库和游戏服务器在美国（Supabase 美西、洛杉矶），图片存储在 Cloudflare R2 的亚太区域」，`upload.use_body` 第 2 条改为「Cloudflare R2（亚太）」，英文同步。V1_RULES、GAME_FLOW、UI_COPY 2.3 与待核对清单、TECH_PLAN 已同步，原「桶须使用 `us` jurisdiction」要求改为说明现状与日后改回的做法。

## 4A 上传（2026-10-23）

- **接口**：`POST /api/submissions`（multipart：`playerId`、`petName`、`photo`），替换原测试上传入口。按文件头判断 JPEG / PNG / WebP / HEIC，原样保存到 `submissions/<player>/<uuid>.<ext>`，不压缩不转码；单张 20 MB；名字去空白后 1–40 字；主人固定为请求里的当前身份。
- **每日上限**：每个身份每个北京自然日最多 10 次，只计保存成功的提交；先写对象，再在同一身份的咨询锁内复核次数并写库，超限或写库失败时删掉已写对象。测试 8 个（`server/__tests__/submissions.test.ts`）：伪造扩展名、超限、缺名字 / 过长、名单外身份、第 11 次被拒且北京 0 点重置、写库失败回滚对象、并发三个请求只成功一个（去掉咨询锁时该测试失败）。迁移 007 加 `pulled_at` 与按身份、时间的索引。
- **命令行**：`server/scripts/submissions.ts list | pull --yes | done <id> --yes`（`--prod` 用 Supabase，`OBJECT_STORE=r2` 用 R2）。实测 `pull` 把 4 份提交下载到 `data/submissions/2026-10-23/<id>/original.png` 与 `info.json`（名字、主人、时间），与上传原文件逐字节相同；`data/submissions/` 已加入 `.gitignore`。脚本共用的连接与存储抽到 `scripts/cli.ts`。
- **上传页**（对照 mobile-upload-v1）：选择照片 → 原图预览（可换一张）→ 宠物名字 → 只读主人与「将以当前游戏身份提交」→ 展示摘要与「查看照片展示与处理说明」→ 底部固定「提交」。入口在图鉴页「添加我家毛孩子」（「我的宠物」入口在 4B）。
- **浏览器走查**（390 × 844，中英文）：空表单提交提示先选照片、请填名字（[02](stage4/4a-zh-02-required.jpg)）；Chrome 选 HEIC 显示文件名占位、可提交（[03](stage4/4a-zh-03-heic-placeholder.jpg)）；正常预览与填写（[04](stage4/4a-zh-04-filled.jpg)）；说明弹层打开关闭后内容保留（[05](stage4/4a-zh-05-use-info.jpg)）；回门店出现离开确认，「继续填写」保留照片与名字（[06](stage4/4a-en-06-leave-confirm.jpg)）；提交成功（[07](stage4/4a-en-07-received.jpg)），「继续游玩」进入准备页、未开始计时；21 MB 文件在浏览器端被拦下、不发请求、名字保留（[08](stage4/4a-zh-08-too-large.jpg)）；伪造成 .jpg 的 GIF 被服务端拒绝并提示「这张图片暂时无法使用」，名字保留。陈列页新增 TextField、RichText、PhotoPicker、OwnerRow、UseInfoSheet、LeaveDialog、UploadReceived、UploadScreen 各状态，无报错。

### 4A 与图稿的差异

- 图稿的「请确认主人信息是否正确」按已确认文案改为「将以当前游戏身份提交」。
- 未选照片时显示虚线选择区（图稿只画了已选状态）。

### 4A 未验证

- Safari 里 HEIC 能否直接预览（只在 Chrome 验证了占位）。
- 真机系统相册选择、键盘弹出时的布局。
- 正式库迁移 007 未执行；R2 上的上传链路未实测（本地目录存储）。

## 4B 我的宠物、删除申请、信息说明与页尾（2026-10-23）

- **接口**（迁移 008 `deletion_requests`，Supabase 授权脚本加入该表读写；7 个测试 `server/__tests__/deletions.test.ts`）：`GET /api/my-pets` 只列本人已上架宠物、本人收集状态与该宠物最近一条申请状态；`POST /api/deletion-requests` 宠物申请只接受本人已上架的宠物（别人的 403，未上架或不存在 404），一般申请不需要宠物，补充说明选填、1000 字以内；同一只宠物已有待处理申请时返回原申请；提交后宠物照常上架。`GET /api/deletion-requests` 本人申请与状态，宠物下架后不再返回宠物名。
- **命令行** `server/scripts/deletions.ts list [--all] | resolve <id> --note "…" [--keep-pet] --yes`：只改状态与处理说明，不删除任何东西；关联宠物仍上架时拒绝（先 `catalog unpublish`，确认无需下架时加 `--keep-pet`）；必须写处理说明。实测拒绝与通过两条路径。
- **前端**：
  - 门店补「我的宠物」入口与页尾「信息使用说明 / 资料删除申请 / 设置」（设置复用现有弹层）（[门店](stage4/4b-zh-01-home.jpg)）。
  - 我的宠物（对照 mobile-my-pets-v1）：完整头像、已收集 / 未收集、查看资料、低强调删除申请，未收集显示收集说明；有申请后显示「资料删除申请 · 待处理」（[列表](stage4/4b-zh-02-my-pets.jpg)、[待处理](stage4/4b-zh-06-my-pets-pending.jpg)）。
  - 宠物详情：自家宠物即使未收集也显示完整资料与翻面，不放「开始营业」，底部低强调「资料删除申请」（[详情](stage4/4b-zh-03-detail-own.jpg)）。
  - 删除申请弹层（对照 mobile-delete-request-v1）：关联宠物头像、名字、只读主人，说明、补充说明、提交申请；成功显示「申请已收到，等待人工处理。」，失败保留补充说明可重试；一般申请标题为「资料删除申请」（[申请](stage4/4b-zh-04-delete-sheet.jpg)、[收到](stage4/4b-zh-05-delete-received.jpg)、[一般申请](stage4/4b-zh-09-general-removal.jpg)）。
  - 信息使用说明页：UI_COPY 2.3 全文（含已改的存储句），本人申请的简单状态，一般申请入口（[说明](stage4/4b-zh-07-info.jpg)）。
  - 身份页底部「信息使用说明 | 资料删除申请」：未选同事时删除申请置灰，选中后以该身份提交；未选时说明页不显示同意方式一句；从说明页返回保留搜索词（2026-10-23 确认）（[身份页](stage4/4b-en-10-identity-links.jpg)）。
- **走查**（390 × 844，中英文）：以上流程各走一遍；中文提交后英文再次提交同一只宠物，数据库只有一条待处理申请。陈列页新增 TextArea、DeletionStatus、MyPetCard、DeletionRequestSheet、InfoSections、PageLinks、MyPetsScreen、InfoScreen，PetDetailSheet 增加自家宠物两种状态，无报错。
- 走查中修正：自家未收集宠物详情多出「开始营业」；英文页尾换行后留下孤立分隔线（改为无分隔符的下划线链接）；状态标签在窄卡片里断在词中间。

### 4B 与图稿的差异

- 门店「我的宠物」图标用 🐶 占位（图稿是线描小狗；另一个任务在做 home-entry-icons 图稿，确认后再换）。
- 我的宠物的「添加我家毛孩子」按钮无「＋」号；状态标签在窄卡片里分两行。

### 4B 未验证

- 正式库迁移 008 与授权未执行。
- 真机键盘弹出时删除申请弹层的布局。
