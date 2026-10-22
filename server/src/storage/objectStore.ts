import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { R2 } from './r2.ts';

export interface StoredObject {
  body: Buffer;
  contentType: string;
}

/** 对象存储接口：正式环境是 R2 私有桶，测试用内存实现。 */
export interface ObjectStore {
  get(key: string): Promise<StoredObject | null>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export function r2Store({ client, bucket }: R2): ObjectStore {
  return {
    async get(key) {
      try {
        const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        return { body: Buffer.from(await res.Body!.transformToByteArray()), contentType: res.ContentType ?? 'application/octet-stream' };
      } catch (error) {
        if ((error as { name?: string }).name === 'NoSuchKey') return null;
        throw error;
      }
    },
    async put(key, body, contentType) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

export function memoryStore(): ObjectStore & { objects: Map<string, StoredObject>; gets: number } {
  const objects = new Map<string, StoredObject>();
  const store = {
    objects,
    gets: 0,
    async get(key: string) {
      store.gets++;
      return objects.get(key) ?? null;
    },
    async put(key: string, body: Buffer, contentType: string) {
      objects.set(key, { body, contentType });
    },
    async delete(key: string) {
      objects.delete(key);
    },
  };
  return store;
}
