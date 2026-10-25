/** 仅合并正在执行的相同工作；完成或失败立即释放，下次调用重新读取真实状态。 */
export function singleFlight<T>() {
  const pending = new Map<string, Promise<T>>();
  return (key: string, load: () => Promise<T>): Promise<T> => {
    const active = pending.get(key);
    if (active) return active;
    const task = Promise.resolve().then(load).finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
  };
}
