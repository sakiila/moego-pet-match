import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * 图片本地磁盘缓存：可随时整体删除，下次请求从源站（R2 / Slack）重建。
 * 超过容量上限时按最近使用时间淘汰；命中时刷新文件时间。
 * 可按组存放（如 `pet:<pet_id>`）：宠物下架时一次删掉它的贴纸、剪影与卡背照片缓存。
 */
export class DiskCache {
  constructor(
    readonly dir: string,
    readonly maxBytes: number,
  ) {}

  private static hash(s: string) {
    return createHash('sha256').update(s).digest('hex');
  }

  /** 组前缀取组名哈希的前 16 位，文件名形如 `<组>-<键>`；无组时只有键哈希。 */
  private static groupPrefix(group: string) {
    return `${DiskCache.hash(group).slice(0, 16)}-`;
  }

  private file(key: string, group?: string) {
    return join(this.dir, `${group ? DiskCache.groupPrefix(group) : ''}${DiskCache.hash(key)}`);
  }

  async get(key: string, maxAgeMs?: number, group?: string): Promise<{ body: Buffer; contentType: string } | null> {
    const path = this.file(key, group);
    try {
      const info = await stat(path);
      if (maxAgeMs !== undefined && Date.now() - info.mtimeMs > maxAgeMs) return null;
      const [body, contentType] = await Promise.all([readFile(path), readFile(`${path}.type`, 'utf8')]);
      const now = new Date();
      await utimes(path, now, now).catch(() => {});
      return { body, contentType };
    } catch {
      return null;
    }
  }

  async put(key: string, body: Buffer, contentType: string, group?: string) {
    await mkdir(this.dir, { recursive: true });
    const path = this.file(key, group);
    await writeFile(`${path}.type`, contentType);
    await writeFile(path, body);
    await this.evict();
  }

  async delete(key: string, group?: string) {
    const path = this.file(key, group);
    await Promise.all([rm(path, { force: true }), rm(`${path}.type`, { force: true })]);
  }

  private async groupFiles(group: string) {
    const prefix = DiskCache.groupPrefix(group);
    return (await readdir(this.dir).catch(() => [] as string[])).filter((n) => n.startsWith(prefix));
  }

  /** 删除一个组的全部缓存文件。 */
  async deleteGroup(group: string) {
    await Promise.all((await this.groupFiles(group)).map((n) => rm(join(this.dir, n), { force: true })));
  }

  async hasGroup(group: string) {
    return (await this.groupFiles(group)).length > 0;
  }

  async clear() {
    await rm(this.dir, { recursive: true, force: true });
  }

  private async evict() {
    const names = (await readdir(this.dir)).filter((n) => !n.endsWith('.type'));
    const files = await Promise.all(names.map(async (n) => ({ n, s: await stat(join(this.dir, n)) })));
    let total = files.reduce((sum, f) => sum + f.s.size, 0);
    for (const f of files.sort((a, b) => a.s.mtimeMs - b.s.mtimeMs)) {
      if (total <= this.maxBytes) break;
      await Promise.all([rm(join(this.dir, f.n), { force: true }), rm(join(this.dir, `${f.n}.type`), { force: true })]);
      total -= f.s.size;
    }
  }
}
