import { c, p, circle, rect, item, trayArrow, roundedPolygon } from './style.mjs';

const gearPoints = [];
for (let tooth = 0; tooth < 8; tooth++) for (const [offset, radius] of [[-22.5, 69], [-12, 88], [12, 88], [22.5, 69]]) {
  const angle = (tooth * 45 + offset) * Math.PI / 180;
  gearPoints.push([128 + Math.cos(angle) * radius, 128 + Math.sin(angle) * radius]);
}
const camera = p('M58 84H88L100 61H156L168 84H198Q216 84 216 103V193Q216 210 198 210H58Q40 210 40 193V103Q40 84 58 84Z', 'url(#paper)') + circle(128, 146, 39, 'url(#orange)') + circle(128, 146, 19, c.ink, 'none', 0) + circle(192, 112, 6, c.ink, 'none', 0);
const flip = `<g transform="rotate(-7 161 147)">${rect(99, 85, 113, 114, 16, 'url(#orange)')}</g><g transform="rotate(9 105 164)">${rect(43, 111, 126, 103, 16)}</g>` + p('M99 77Q122 48 161 56M146 42L163 55L148 69', 'none', c.orange, 11);
const document = p('M71 43H157L197 84V208Q197 220 184 220H71Q57 220 57 206V58Q57 43 71 43Z', 'url(#paper)') + p('M157 44V84H197', 'url(#orange)') + p('M86 119H166M86 149H166M86 178H143', 'none', c.ink, 8);

export const utility = [
  item('back', '返回', '02-common', p('M196 115H91L126 80Q136 69 126 59Q117 50 107 61L49 119Q40 128 49 137L107 195Q117 206 127 195Q137 185 126 175L91 140H196Q210 140 210 127Q210 115 196 115Z', 'url(#orange)', c.ink, 8)),
  item('close', '关闭', '02-common', p('M66 66L190 190M190 66L66 190', 'none', c.ink, 24)),
  item('search', '搜索', '02-common', p('M164 162L210 208', 'none', c.ink, 28) + p('M164 162L210 208', 'none', c.orange, 16) + circle(109, 109, 62)),
  item('settings', '设置', '02-common', p(roundedPolygon(gearPoints, .4), 'url(#paper)', c.ink, 7) + circle(128, 128, 25, 'url(#orange)')),
  item('choose-photo', '选择照片', '02-common', camera),
  item('share-image', '分享图片', '02-common', trayArrow()),
  item('flip-card', '翻面看原图', '02-common', flip),
  item('information', '信息说明', '02-common', document),
  item('share-image-white', '分享图片白色版', '02-common', trayArrow(false, true), { variant: 'white', base: 'share-image' }),
];

const globe = circle(128, 128, 80) + p('M49 128H207', 'none', c.orange, 11) + `<ellipse cx="128" cy="128" rx="32" ry="80" fill="none" stroke="${c.ink}" stroke-width="7.6"/>` + circle(128, 128, 80, 'none');
const notes = p('M96 171V69L194 46V157', 'none', c.ink, 15) + p('M96 70L194 47V68L96 91Z', c.ink, 'none', 0) + `<ellipse cx="72" cy="181" rx="26" ry="22" fill="url(#orange)" stroke="${c.ink}" stroke-width="7.6" transform="rotate(-15 72 181)"/><ellipse cx="170" cy="167" rx="26" ry="22" fill="url(#orange)" stroke="${c.ink}" stroke-width="7.6" transform="rotate(-15 170 167)"/>`;
const speaker = p('M57 101H85L137 65Q149 57 149 74V193Q149 206 137 198L85 167H57Q45 167 45 153V115Q45 101 57 101Z', 'url(#paper)') + p('M85 111V158', 'none', c.cream, 4) + p('M178 107Q194 130 178 154M202 86Q231 130 202 175', 'none', c.orange, 12);
const haptics = rect(89, 42, 78, 174, 22) + p('M63 79Q48 128 63 176M193 79Q208 128 193 176', 'none', c.orange, 12);
export const settings = [item('language', '语言', '09-settings', globe), item('music', '背景音乐', '09-settings', notes), item('sound-effects', '消除音效', '09-settings', speaker), item('haptics', '轻震', '09-settings', haptics)];

const awning = 'M40 103L66 51H190L216 103V119Q212 136 197 125Q184 137 173 125Q160 137 148 125Q134 137 122 125Q108 137 96 125Q82 137 69 125Q52 138 40 120Z';
const storefront = rect(55, 100, 148, 116, 3) + rect(75, 145, 45, 40, 6, c.window, c.ink, 6) + rect(146, 143, 38, 75, 5, 'url(#orange)', c.ink, 6) + circle(174, 180, 3, c.ink, 'none', 0) + `<defs><clipPath id="awning"><path d="${awning}"/></clipPath></defs>` + p(awning, 'url(#orange)', 'none', 0) + `<g clip-path="url(#awning)">${p('M87 50H109L105 115Q96 128 85 115ZM129 50H151L158 115Q146 128 136 115ZM172 50H191L212 109V119Q199 133 188 115Z', c.paper, 'none', 0)}</g>` + p(awning) + rect(45, 216, 171, 14, 6, c.ivory, c.ink, 6);
const exit = p('M171 106V45H63V212H171V164', 'none', c.ink, 12) + p('M63 47L136 76V228L63 201Z', 'url(#paper)') + p('M111 69L136 78V223L111 214Z', c.orange, 'none', 0) + p('M136 78V224', 'none', c.ink, 7) + p('M116 149V164', 'none', c.ink, 5) + p('M167 133H226M207 114L227 133L207 152', 'none', c.orange, 15);
const changePhoto = rect(75, 93, 117, 88, 14) + p('M92 165L115 137L135 155L151 143L177 165Z', c.ink, 'none', 0) + circle(161, 118, 10, c.orange, 'none', 0) + p('M42 112Q54 67 111 66H153M139 52L155 66L138 80', 'none', c.orange, 13) + p('M218 143Q217 200 164 202H137M152 188L135 202L152 217', 'none', c.ink, 13);
const retry = p('M204 153C195 191 162 212 126 208C81 204 48 178 47 135C46 91 80 60 117 51', 'none', c.ink, 20) + p('M117 51C150 43 181 64 194 91', 'none', c.orange, 20) + p('M179 88Q171 90 178 98L203 113Q212 119 212 108V81Q212 72 205 76L195 84Z', c.orange, 'none', 0);
export const actions = [item('back-to-shop', '回门店', '10-actions', storefront), item('exit', '退出', '10-actions', exit), item('change-photo', '换一张照片', '10-actions', changePhoto), item('save-image', '保存图片', '10-actions', trayArrow(true)), item('retry', '重试', '10-actions', retry), item('save-image-white', '保存图片白色版', '10-actions', trayArrow(true, true), { variant: 'white', base: 'save-image' })];
