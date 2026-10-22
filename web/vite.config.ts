import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    // 开发时接口与图片走本地 Node 服务（server/，端口 8787）
    proxy: { '/api': 'http://127.0.0.1:8787', '/img': 'http://127.0.0.1:8787' },
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
