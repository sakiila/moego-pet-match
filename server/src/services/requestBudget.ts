/** 写接口的粗粒度突发保护；容量有上限，未知 IP 不能无限占用内存。 */
export function requestBudget(limit = 300, periodMs = 10_000, capacity = 4096) {
  const buckets = new Map<string, { until: number; count: number }>();
  return (key: string, now: number): number | null => {
    let bucket = buckets.get(key);
    if (!bucket || bucket.until <= now) {
      if (!bucket && buckets.size >= capacity) {
        for (const [oldKey, value] of buckets) if (value.until <= now) buckets.delete(oldKey);
        if (buckets.size >= capacity) return Math.ceil(periodMs / 1000);
      }
      bucket = { until: now + periodMs, count: 0 };
      buckets.set(key, bucket);
    }
    bucket.count = Math.min(limit + 1, bucket.count + 1);
    return bucket.count > limit ? Math.max(1, Math.ceil((bucket.until - now) / 1000)) : null;
  };
}
