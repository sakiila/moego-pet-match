import type { CollectionPet } from '../api/types';

export type CollectionFilter = 'all' | 'collected' | 'uncollected';

/**
 * 图鉴浏览：已收集优先、新收集靠前（按首次保存收集时间）；未收集保持目录顺序。
 * 搜索：宠物名匹配全部上架项；主人名只匹配已收集宠物，不通过搜索揭晓未收集归属（自家宠物也一样）。
 */
export function browseCollection(pets: readonly CollectionPet[], filter: CollectionFilter, query: string): CollectionPet[] {
  const q = query.trim().toLocaleLowerCase();
  const matches = (p: CollectionPet) =>
    !q || p.name.toLocaleLowerCase().includes(q) || (p.collected && !!p.owner?.name.toLocaleLowerCase().includes(q));
  const inFilter = (p: CollectionPet) => filter === 'all' || (filter === 'collected') === p.collected;
  const collected = pets.filter((p) => p.collected).sort((a, b) => (b.collectedAt ?? '').localeCompare(a.collectedAt ?? ''));
  const uncollected = pets.filter((p) => !p.collected);
  return [...collected, ...uncollected].filter((p) => inFilter(p) && matches(p));
}

/**
 * 「主人说」先显示前一两句，可展开全文。按中英文句末标点切分；
 * 返回 null 表示原文已足够短，不需要展开。
 */
export function quoteExcerpt(quote: string, sentences = 2): string | null {
  const parts = quote.match(/[^。！？!?.\n]+[。！？!?.]*[」"』）)]*\s*|\n+/g) ?? [quote];
  let taken = 0;
  let out = '';
  for (const part of parts) {
    if (taken === sentences) break;
    out += part;
    if (part.trim()) taken++;
  }
  out = out.trim();
  return out.length < quote.trim().length ? out : null;
}
