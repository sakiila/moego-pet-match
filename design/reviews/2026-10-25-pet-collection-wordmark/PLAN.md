# 图鉴标题字标接入

视觉来源：已确认的 `feature-wordmarks-collection-pets-v1.png`，复用独立透明母版 `assets/illustrations/feature-wordmarks-original-v1/transparent/pet-collection.png`。

- [x] 按现有 build_web.py 规则等比导出 WebP，保留字形、字距与黑橙配色。
- [x] 在 BrandHeader 增加 collection 标题外观，图鉴页通过 props 使用；添加按钮保持完整文案，窄屏允许分行，字标不拉伸。
- [x] 登记标题陈列状态；检查图鉴列表／贴纸册、添加入口、中英文、320px 窄屏和宽屏，运行类型检查与构建。

只推进图鉴标题模块；My Pets 字标留作下一项。当前工作区其他未提交改动均保留，不提交或部署。

## 验收

- 浏览器：bsk，站点 localhost:5180；390 × 844 中英文、320 × 740 中英文、1024 × 768 宽屏均检查，无横向溢出。正常、零收集、读取失败及有／无添加按钮的标题陈列状态均有实际 DOM 证据。
- 主路径：首页进入真实本地图鉴，搜索 Maodu 返回对应宠物，清空后切换贴纸册仍显示新标题，点击 Add My Pet 进入上传表单；未提交照片或申请。
- 字标复用已确认原稿，等比导出 1080 × 208 WebP。390px 中文下显示 152 × 29.27，与添加按钮同排；320px 中文下显示 288 × 55.46，按钮另起一行，完整可读。颜色、字形、字距与装饰短线均来自原素材；读屏标题保留当前语言。布局尺寸在 tokens 定义。
- 同框对照：`/tmp/moego-pet-collection-comparison.png`，三栏均为 390 × 844、DPR 1：原页面、中文新页面、英文新页面。局部直接查看页头，确认黑橙字标、按钮位置、图片比例、文字和正文间距，无标题遮挡或内容裁切。参考稿是独立字标，未要求重绘整个图鉴页。
- 截图：`/tmp/moego-pet-collection-after-zh.png`、`after-en.png`（同前缀）、`/tmp/moego-pet-collection-320-zh.png`、`320-en.png`（同前缀）、`/tmp/moego-pet-collection-desktop-zh.png`、`/tmp/moego-pet-collection-header-gallery.png`。
- typecheck、build、git diff --check 通过；build 保留已有大 chunk 提示。纯外观接入未新增规则单元测试。控制台出现一次扩展异步消息通道报错及陈列用 U_TEST_ALICE 头像 404；字标资源正常加载，未发现此次接入的 React／资源异常。
- 未做 Safari 或真机测试；未提交、推送、部署。

final result: passed
