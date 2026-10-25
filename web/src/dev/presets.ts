/**
 * 开发验收用的固定棋盘（仅开发环境，?preset=<name>）。生产构建不会引用。
 * A–F 对应本局 kind 0–5，h / v / x / d 为横梳 / 竖梳 / 剪刀 / 吹风机。
 */
export const PRESETS: Record<string, { board: string[]; refill?: number[] }> = {
  /** 拖 (5,3) ↓ (6,3)：底行直五，500 分并生成吹风机，之后与邻格交换发动。 */
  five: {
    board: ['ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA', 'CDEFABC', 'EFAACDE', 'BAACAAD'],
    refill: [1, 2, 3, 4],
  },
  /** 拖 (4,4) → (4,3)：三消 → 三消 → 四消 = 210 分并留下横梳。 */
  cascade: {
    board: ['EFEFDFD', 'DEDEFEF', 'FDFCEDE', 'EFEBDFD', 'DEDFAEF', 'EDFACDE', 'DEBABCC'],
    refill: [0, 1, 0, 0, 2, 0, 1, 2, 0],
  },
  /** 横梳 (3,2) 与剪刀 (3,3) 相邻（梳＋剪合体），另有竖梳 (5,5)。 */
  tools: {
    board: ['ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABhxEFA', 'CDEFABC', 'EFABCvE', 'ABCDEFA'],
  },
  /** 拖 (1,2) ↑ (0,2) 消掉第 0 行三格，补落后成死局，触发系统洗牌。 */
  shuffle: {
    board: ['BBEDEFA', 'CDBFABC', 'EFABCDE', 'ABCDEFA', 'CDEFABC', 'EFABCDE', 'ABCDEFA'],
    refill: [0, 1, 2],
  },
};
