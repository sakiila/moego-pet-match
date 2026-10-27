import { createServer, type Server, type Socket } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { r2Store } from '../src/storage/objectStore.ts';
import { R2_TIMEOUTS, r2Client } from '../src/storage/r2.ts';

// 只接受连接、从不回应：模拟 R2 连接卡住
let server: Server | null = null;
const sockets: Socket[] = [];
afterEach(async () => {
  sockets.splice(0).forEach(s => s.destroy());
  await new Promise<void>(resolve => (server ? server.close(() => resolve()) : resolve()));
  server = null;
});

async function silentEndpoint() {
  let connections = 0;
  server = createServer(socket => { connections++; sockets.push(socket); });
  await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  return { endpoint: `http://127.0.0.1:${port}`, connections: () => connections };
}

describe('R2 读写超时', () => {
  it('响应卡住时按请求超时放弃并重试一次，不会一直挂着', async () => {
    const { endpoint, connections } = await silentEndpoint();
    const client = r2Client({ endpoint, accessKeyId: 'test', secretAccessKey: 'test' }, { ...R2_TIMEOUTS, requestTimeout: 200 });
    const store = r2Store({ client, bucket: 'pets' });
    const started = Date.now();
    await expect(store.get('k/mochi/128.png')).rejects.toThrow();
    expect(Date.now() - started).toBeLessThan(3_000);
    expect(connections()).toBe(R2_TIMEOUTS.maxAttempts);
  });

  it('默认超时远小于前端 10 秒的图片超时', () => {
    const worst = R2_TIMEOUTS.maxAttempts * (R2_TIMEOUTS.connectionTimeout + R2_TIMEOUTS.requestTimeout);
    expect(worst).toBeLessThan(15_000);
    expect(R2_TIMEOUTS.requestTimeout).toBeLessThan(10_000);
  });
});
