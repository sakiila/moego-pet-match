import { describe, expect, it, vi } from 'vitest';
import { createPlayerLikesController } from './playerLikes';

const available = { receivedLikes: 12, likedByViewer: false, canLike: true };
const liked = { receivedLikes: 13, likedByViewer: true, canLike: false };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('permanent player likes', () => {
  it('locks synchronously and only displays the count confirmed by the server', async () => {
    const save = deferred<typeof liked>();
    const send = vi.fn(() => save.promise);
    const controller = createPlayerLikesController('alice', 'bob', async () => available, send);
    await controller.refresh();
    const first = controller.like();
    const second = controller.like();
    expect(send).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toMatchObject({ view: available, sending: true });
    save.resolve(liked);
    await Promise.all([first, second]);
    expect(controller.getSnapshot()).toMatchObject({ view: liked, sending: false, error: null, celebration: 1 });
    await controller.like();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('keeps the original count after a failed request and allows an idempotent retry', async () => {
    let attempts = 0;
    const controller = createPlayerLikesController('alice', 'bob', async () => available, async () => {
      if (++attempts === 1) throw new Error('connection lost after server save');
      return liked;
    });
    await controller.refresh();
    await controller.like();
    expect(controller.getSnapshot()).toMatchObject({ view: available, sending: false, error: 'send' });
    await controller.like();
    expect(controller.getSnapshot()).toMatchObject({ view: liked, error: null });
    expect(attempts).toBe(2);
  });

  it('does not let an older read undo a successful like', async () => {
    const background = deferred<typeof available>();
    let reads = 0;
    const controller = createPlayerLikesController('alice', 'bob', () => ++reads === 1 ? Promise.resolve(available) : background.promise, async () => liked);
    await controller.refresh();
    const read = controller.refresh();
    await controller.like();
    background.resolve(available);
    await read;
    expect(controller.getSnapshot().view).toEqual(liked);
  });

  it('aborts reads and ignores late reads and writes after leaving a player', async () => {
    const read = deferred<typeof available>();
    let signal: AbortSignal | undefined;
    const controller = createPlayerLikesController('alice', 'bob', (_target, _viewer, requestSignal) => { signal = requestSignal; return read.promise; }, async () => liked);
    const pending = controller.refresh();
    controller.dispose();
    read.resolve(available);
    await pending;
    expect(signal?.aborted).toBe(true);
    expect(controller.getSnapshot().view).toBeNull();

    const save = deferred<typeof liked>();
    const second = createPlayerLikesController('charlie', 'bob', async () => available, () => save.promise);
    await second.refresh();
    const mutation = second.like();
    second.dispose();
    save.resolve(liked);
    await mutation;
    expect(second.getSnapshot().view).toEqual(available);
  });

  it('never sends self likes even if a malformed read says they are allowed', async () => {
    const send = vi.fn(async () => liked);
    const controller = createPlayerLikesController('bob', 'bob', async () => available, send);
    await controller.refresh();
    await controller.like();
    expect(send).not.toHaveBeenCalled();
  });

  it('can resume after React effect cleanup without admitting an old write', async () => {
    const save = deferred<typeof liked>();
    const controller = createPlayerLikesController('alice', 'bob', async () => available, () => save.promise);
    await controller.refresh();
    const mutation = controller.like();
    controller.dispose();
    controller.resume();
    await controller.refresh();
    save.resolve(liked);
    await mutation;
    expect(controller.getSnapshot()).toMatchObject({ view: available, sending: false });
  });

  it('keeps a visible zero and exposes independent read failure and retry', async () => {
    let reads = 0;
    const controller = createPlayerLikesController('alice', 'bob', async () => {
      if (++reads === 1) throw new Error('offline');
      return { ...available, receivedLikes: 0 };
    }, async () => liked);
    await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({ view: null, loading: false, error: 'load' });
    await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({ view: { receivedLikes: 0 }, error: null });
  });
});
