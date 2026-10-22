import { defineConfig } from 'vitest/config';

// 测试共用一个本地数据库，按文件串行执行
export default defineConfig({
  test: { include: ['__tests__/**/*.test.ts'], fileParallelism: false, testTimeout: 20_000, hookTimeout: 30_000 },
});
