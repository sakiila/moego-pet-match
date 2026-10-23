import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import type { ObjectStore } from './objectStore.ts';

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', heic: 'image/heic' };

/**
 * 本地目录对象存储：与 R2 相同的键布局（如 pets/<id>/<hash>/128.png），
 * 用于开发及 R2 可用之前；切换到 R2 时只需把同样的键上传过去。
 */
export function localDirStore(root: string): ObjectStore {
  const path = (key: string) => {
    const p = normalize(join(root, key));
    if (!p.startsWith(normalize(root))) throw new Error('invalid key');
    return p;
  };
  return {
    async get(key) {
      try {
        const body = await readFile(path(key));
        return { body, contentType: TYPES[key.split('.').pop() ?? ''] ?? 'application/octet-stream' };
      } catch {
        return null;
      }
    },
    async put(key, body) {
      await mkdir(dirname(path(key)), { recursive: true });
      await writeFile(path(key), body);
    },
    async delete(key) {
      await rm(path(key), { force: true });
    },
  };
}
