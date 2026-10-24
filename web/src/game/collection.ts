import type { CollectionPet } from '../api/types';

export type CollectionFilter = 'all' | 'collected' | 'uncollected';

/**
 * 图鉴浏览：已收集优先、新收集靠前（按首次保存收集时间）；未收集保持目录顺序。
 * 搜索：空白分词、每个词都要命中；宠物名匹配全部上架项，主人名匹配已收集宠物和自家宠物（自家主人本来就显示），不通过搜索揭晓其他未收集宠物的归属。
 */
export function browseCollection(pets: readonly CollectionPet[], filter: CollectionFilter, query: string): CollectionPet[] {
  // 按空白拆词，每个词都要命中宠物名或（已收集的）主人名，所以「hart peter」「Peter  Hart」都能找到
  const tokens = query.normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = (p: CollectionPet) => {
    const name = p.name.normalize('NFKC').toLocaleLowerCase();
    const owner = p.collected || p.own ? (p.owner?.name.normalize('NFKC').toLocaleLowerCase() ?? '') : '';
    return tokens.every((t) => name.includes(t) || owner.includes(t));
  };
  const inFilter = (p: CollectionPet) => filter === 'all' || (filter === 'collected') === p.collected;
  const collected = pets.filter((p) => p.collected).sort((a, b) => (b.collectedAt ?? '').localeCompare(a.collectedAt ?? ''));
  const uncollected = pets.filter((p) => !p.collected);
  return [...collected, ...uncollected].filter((p) => inFilter(p) && matches(p));
}

/** 贴纸册格位：按服务端 sheetOrder（主人英文名、再宠物英文名）排列；顺序里缺的宠物接在末尾，不丢格。 */
export function sheetCollection(pets: readonly CollectionPet[], sheetOrder: readonly string[]): CollectionPet[] {
  const rank = new Map(sheetOrder.map((id, i) => [id, i]));
  return [...pets].sort((a, b) => (rank.get(a.petId) ?? Infinity) - (rank.get(b.petId) ?? Infinity));
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
