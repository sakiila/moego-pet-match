/** 动效时长与位移（秒 / 像素 / 毫秒）。集中在这里，试玩时只改这一处。 */
export const MOTION = {
  /** 页面进入：淡入 + 横向滑入 */
  pageEnterS: 0.28,
  /** 页面退出：只淡出，保持短促 */
  pageExitS: 0.12,
  /** 前进 / 返回时的横向滑动距离 */
  slidePx: 28,
  /** 时间到后停一拍再进报告（毫秒）；减少动态效果时缩短 */
  timeUpHoldMs: 900,
  timeUpHoldReducedMs: 300,
  easeOut: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;
