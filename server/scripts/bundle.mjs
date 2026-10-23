// 生产：把服务端打成一个 ESM 文件（含 web/src/engine 等源码引用），npm 依赖保持外部，由镜像里的 npm ci 安装。
import { build } from 'esbuild';

await build({
  entryPoints: ['src/main.ts'],
  outfile: 'dist/server.mjs',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  // 部分依赖在 ESM 下仍用 require
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'info',
});
