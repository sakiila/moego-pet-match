# 社交预览 · 虚构照片

三张照片均由 Codex 内置 ImageGen 为本机交互预览生成，不是实际同事或宠物档案，不是 Slack 导入文件。

- originals/demo-cat-v1.png：虚构狸花白猫晒太阳。
- originals/demo-paws-v1.png：同一虚构猫的爪子特写。
- originals/demo-dog-v1.png：根据用户提供的截图内容参考生成的铜色小狗推车照片。

完整请求：design/concepts/pet-social-demo-{cat,paws,dog}-v1-prompt.txt。

仅使用 sharp 等比导出 1200px 宽、quality 84 WebP 到 web/src/dev/social/assets，不修改原图内容。原始生成 PNG 保留在本目录。实际用户照片不作为演示素材提交。
