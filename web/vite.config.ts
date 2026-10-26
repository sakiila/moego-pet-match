import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readGameVersion } from './scripts/game-version.mjs';

export default defineConfig({
  plugins: [react()],
  define: { __GAME_VERSION__: JSON.stringify(readGameVersion()) },
  server: {
    port: 5180,
    strictPort: true,
    // 开发时接口与图片走本地 Node 服务（server/，默认端口 8787；并行联调可用 API_ORIGIN 指向另一实例）
    proxy: { '/api': process.env.API_ORIGIN ?? 'http://127.0.0.1:8787', '/img': process.env.API_ORIGIN ?? 'http://127.0.0.1:8787' },
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
