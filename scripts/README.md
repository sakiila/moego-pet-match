# 飞书宠物素材采集工具

本工具仅采集素材和生成开发文档，不修改飞书记录，也不编写或启动游戏。

## 运行条件

- 本机安装 Python 3 和 bsk CLI，Chrome 中已连接 BrowserSkill 扩展并登录有权限的飞书账号。
- 账号能读取指定 MoeGo Pet 表，并有对应附件的下载权限。
- 一个采集进程独占自己的浏览器会话。运行期间不要让另一个脚本或浏览器工具操作该会话。

## 采集与生成文档

在项目目录执行：

```bash
python3 scripts/collect_pet_materials.py --out data/pet-materials
```

一条命令完成账号核验、原图下载、机器索引与主文档生成。若只需从现有 manifest 重新排版文档：

```bash
python3 scripts/render_pet_catalog.py \
  --input data/pet-materials/manifest.json \
  --output data/pet-materials/PET_CATALOG.md
```

默认新建浏览器工作窗口，读取已经核实的表格接口。使用浏览器当前登录态，不读取或导出登录 cookie、CSRF 或其他凭据。账号查询使用页面原生的认证查询，仅批量调整待查询的主人 ID 列表，不修改账号或文档权限。

所有主人先检查账号状态：明确 resigned=true 或显示 closed/停用的记录跳过；明确 resigned=false 且没有 closed 标记的记录才下载附件；缺失或未知状态留在待核对清单。多人记录中任一主人关闭或未知时，整条记录保守跳过或待核对。

采集范围固定为当前指定表。页面接口或字段变化时会报错或保留待核对项，不默默视为完整。

## 中断续跑

```bash
python3 scripts/collect_pet_materials.py --out data/pet-materials --resume
```

仅复用同一来源、表格版本、采集批次且一小时内核验的账号状态。跨批次更新请不用 --resume，以重新核验账号。附件文件名包含来源记录、序号和附件标识；本地大小及 SHA-256 必须匹配才复用，不覆盖不明文件。

可用 --session 指定当前任务已创建、且打开了记录详情的浏览器会话，供故障恢复；日常使用默认自动创建即可。--seed-status 是本轮调试捕获的账号查询结果，仅供采集恢复，不应导入其他来源或过期状态。

## 输出

- PET_CATALOG.md：主开发素材文档，包含原名、主人及状态证据、性别原文、介绍原文、全部附件预览、来源和跳过清单。
- manifest.json：与文档对应的机器可读索引，保留有效记录的原始字段、附件标识、本地路径及校验值。
- originals/：有效主人对应的原附件，每个文件附有 SHA-256 校验文件。
- owner-status.json 与 run-context.json：本地核验与续跑信息。

原始数据目录已在 Git 中忽略。资料不会自动上传、推送、风格化或发布；同一条记录里的多只宠物仍保留原始分组，待后续人工核对照片对应关系。

## 验证

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts -p 'test_*pet*.py' -v
```
