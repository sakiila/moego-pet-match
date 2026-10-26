# 游戏页完整链路验收 · 2026-10-25

final result: passed

## 环境与范围

- 使用实际 Vite 前端5180与本地Node服务8787，390×844、DPR2、Chrome Agent Window。
- lsof核验8787进程的DB连接均指向127.0.0.1:54329；只读pg_stat_activity确认数据库为pet_match_dev。未读取.env或连接生产数据库。
- 为稳定覆盖状态，使用现有开发参数t0、speed、preset；实际点击页面、真实引擎运行、经过收工页和实际报告提交接口，并只读核对本地结果表。
- 本轮完成三组结果保存，另做准备页转场（登记但未开始）。这些均为本地开发数据，不代表生产成绩。

## 三组端到端用例

| 用例 | 操作与观察 | 本地持久化 |
| --- | --- | --- |
| 加单成功 | 30秒窗口内交换相邻梳子与剪刀；进度达标，原位成功反馈；后续连消继续计分 | 840分、validMoves=1、clearedCells=52、rushSucceeded=true、counted=true |
| 加单过期 / 零服务 | 不操作，50秒任务截止显示未赶上；到时只挂牌，无服务头像 | 0分、validMoves=0、rushSucceeded=false、counted=false，仍已保存 |
| 到时仍在连消 | 第89秒提交固定连消；时钟到00:00时仍busy且无收工覆盖；三批全部结算后才挂牌 | 210分、validMoves=1、rushSucceeded=false、counted=true，三批结果完整保存 |

成功局清除分按[33,16,3,0,0]计算：10×(33 + 16×2 + 3×3)=740，再加固定100，合计840；任务奖励未重复计算。

每组报告显示「本局结果已保存」，对应POST result均返回200，并在本地game_results查询到唯一结果行。开发StrictMode导致相同payload出现两次请求，后端幂等返回，未重复生成结果记录。

## 到时边界时间线

以下为真实浏览器观察到的游戏时钟与DOM：

| 游戏时钟 | 读数 | 过程分数 | busy | 收工牌 |
| --- | --- | --- | --- | --- |
| 89,302ms | 00:01 | 0 | true | 无 |
| 89,600ms | 00:01 | 30 | true | 无 |
| 89,924ms | 00:01 | 90 | true | 无 |
| 90,008ms | 00:00 | 90 | true | 无 |
| 90,241ms | 00:00 | 210 | true | 无 |
| 90,383ms | 00:00 | 210 | false | 出现 |

挂牌出现后约1335ms进入报告（1200ms收工 + 120ms页面退出及渲染帧），此时尚无已保存声明；约79ms后实际保存回执返回，报告才显示已保存。游戏时钟保持冻结。

完整DOM时间线：`/tmp/moego-last-chain-timeline.json`。

截图：
- `/tmp/moego-live-rush-success.png`
- `/tmp/moego-live-rush-expired.png`
- `/tmp/moego-live-report-success.png`
- `/tmp/moego-live-report-zero.png`
- `/tmp/moego-last-chain-finish.png`
- `/tmp/moego-last-chain-report.png`

## 发现并修复的转场问题

正式App通过ScreenTransition进行横向入场；此前Gallery外层自带裁剪掩盖了这个问题。

- 修前：390px手机视口进入页面时innerWidth和scrollWidth峰值均为418px；峰值对应约27px的translateX，动画结束才恢复390。
- 根因：移动的整页没有未移动的横向裁剪边界；body的overflow-x:clip不能约束该移动边界参与根滚动范围。
- 修复：ScreenTransition新增宽度100%、overflow-x:clip的静止外层。不设置高度、纵向裁剪、定位、transform或contain；图案、子页面尺寸和纵向阅读不变。Gallery去掉原先额外的overflow:hidden，让陈列也使用组件自身的裁剪。
- 复测：主页→排行榜、主页→实际准备页，各109帧采样中innerWidth和scrollWidth最大值均为390；准备页390×844、开始按钮正常可用，无横向/纵向溢出。
- 独立只读审查通过；外层不会引入纵向滚动容器或改变fixed包含块。

复测数据与截图：
- `/tmp/moego-transition-viewport-after.json`
- `/tmp/moego-prep-transition-viewport-after.json`
- `/tmp/moego-prep-transition-fixed.png`

## 验证与限制

- 最新npm test：15文件、179项通过。
- npm run build（含TypeScript检查）通过；保留现有主包大小提示。
- 本轮ScreenTransition相关文件git diff --check通过。
- 游戏UI、图案、计分与保存规则未更改；本轮代码修复仅为转场裁剪。
- Chrome手机模拟验收；未使用真实iOS设备。减少动态效果路径此前已做代码检查，本轮未切换系统设置。
- 未执行提交、推送或部署。

