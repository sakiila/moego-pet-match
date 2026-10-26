import type { SocialState } from '../../social/model';

/** 独立预览仓库，不复用游戏身份或生产 API。照片与动态一起存 IndexedDB。 */
export function createPreviewRepository() {
  let database: Promise<IDBDatabase> | undefined;
  const open = () =>
    (database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open('moego-social-preview', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('preview');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('storage_blocked'));
    }));
  let pending = Promise.resolve();
  return {
    async load(): Promise<SocialState | null> {
      const db = await open();
      return new Promise((resolve, reject) => {
        const request = db.transaction('preview').objectStore('preview').get('state');
        request.onsuccess = () => {
          const value = request.result as SocialState | undefined;
          if (value && (value.version !== 1 || !Array.isArray(value.posts) || !Array.isArray(value.notices)))
            return reject(new Error('invalid_preview'));
          resolve(value ?? null);
        };
        request.onerror = () => reject(request.error);
      });
    },
    save(state: SocialState): Promise<void> {
      const next = pending
        .catch(() => undefined)
        .then(async () => {
          const db = await open();
          await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction('preview', 'readwrite');
            transaction.objectStore('preview').put(state, 'state');
            transaction.oncomplete = () => resolve();
            transaction.onabort = () => reject(transaction.error);
            transaction.onerror = () => reject(transaction.error);
          });
        });
      pending = next;
      return next;
    },
  };
}
