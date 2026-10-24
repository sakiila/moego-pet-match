import { c, p, circle, rect, item, badge, arrowMark, ground } from './style.mjs';

const combBody = [0, 1, 2, 3, 4].map(i => rect(44 + i * 33, 115, 26, 67 - i * 2, 11, 'url(#paper)', c.ink, 6)).join('') + p('M37 99C84 90 141 90 195 97Q212 100 210 115Q208 128 191 127C137 121 89 128 41 132Q25 132 25 118Q24 104 37 99Z', 'url(#orange)', c.ink, 6.5);
const combH = `<g transform="rotate(-17 128 128)">${combBody}</g>` + p('M40 80C13 99 13 132 42 149C19 142 11 112 40 80ZM31 173Q52 197 91 202Q51 211 31 173Z', c.orange, 'none', 0);
const combV = `<g transform="rotate(-78 128 128)">${combBody}</g>` + p('M55 54Q20 98 39 150Q8 101 55 54ZM27 151Q38 185 65 200Q29 194 27 151Z', c.orange, 'none', 0);

const ring = (x, y, rx, ry, angle) => `<g transform="rotate(${angle} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${c.ink}" stroke-width="22"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${c.orange}" stroke-width="10"/></g>`;
const scissors = p('M90 164L125 133L157 141L145 180', 'none', c.ink, 21) + p('M90 164L125 133L157 141L145 180', 'none', c.orange, 10) + p('M117 141L185 47Q200 26 208 38Q212 45 205 60L160 154Z', 'url(#paper)', c.ink, 6.5) + p('M121 136L208 95Q228 86 229 100Q229 110 214 118L157 154Z', 'url(#paper)', c.ink, 6.5) + ring(70, 172, 27, 22, -27) + ring(142, 204, 21, 24, 3) + circle(135, 143, 8, c.gray, c.ink, 4) + p('M218 61L226 44M230 77L240 70', 'none', c.orange, 7) + p('M35 221Q55 219 75 209Q57 228 35 221Z', c.orange, 'none', 0);

const dryer = ground(128, 237, 81) + p('M91 148L133 139L158 210Q161 224 149 229L134 234Q122 238 115 223Z', 'url(#orange)', c.ink, 6.5) + p('M131 153L143 149L151 168Q150 179 141 177Z', c.gray, c.ink, 4) + p('M52 107Q38 109 36 126Q36 145 56 150L69 145L68 110Z', 'url(#orange)', c.ink, 6) + p('M58 102C82 88 113 83 161 85L179 140C153 151 121 158 83 160Q54 154 49 131Q45 112 58 102Z', 'url(#paper)', c.ink, 6.5) + p('M152 87L176 82Q187 82 192 104L198 124Q201 140 186 145L168 149Z', 'url(#orange)', c.ink, 6.5) + `<ellipse cx="183" cy="115" rx="9" ry="27" fill="${c.grayDark}" stroke="${c.ink}" stroke-width="5" transform="rotate(-15 183 115)"/>` + p('M199 92C216 68 235 64 244 78C227 75 218 88 199 98ZM204 111C229 93 253 108 246 129C232 112 219 116 204 119ZM202 135Q233 133 233 162Q218 145 202 143Z', c.orange, 'none', 0) + p('M57 176Q66 190 90 196Q64 198 57 176Z', c.orange, 'none', 0);

const conchOutline = 'M27 132C34 121 41 118 47 115C53 98 64 95 73 92C88 77 110 73 129 81C144 89 156 85 171 81C187 75 205 78 211 91C216 108 205 128 206 149C209 176 195 195 178 196C161 192 148 201 128 191C112 186 98 190 87 178C69 176 57 168 54 154C43 150 35 148 27 140Z';
const conchShape = p(conchOutline, 'url(#paper)', 'none', 0) + `<defs><clipPath id="conch-clip"><path d="${conchOutline}"/></clipPath></defs><g clip-path="url(#conch-clip)">` + p('M52 97Q87 119 69 170M88 75Q134 116 110 191M137 74Q171 116 147 201', 'none', c.blueDeep, 15) + `</g>` + p(conchOutline, 'none', c.ink, 6.5) + circle(29, 134, 9, c.blue, c.ink, 5) + `<ellipse cx="186" cy="139" rx="20" ry="52" fill="${c.blueDark}" stroke="${c.ink}" stroke-width="6.5" transform="rotate(7 186 139)"/>` + p('M189 96Q168 136 183 181', 'none', c.blueDeep, 8);
const waterJet = p('M215 104Q231 78 243 82Q251 91 215 109ZM218 122Q241 104 248 116Q253 126 218 128ZM216 140Q240 137 239 150Q235 157 216 145Z', c.blueDeep, 'none', 0);
const conchH = `<g transform="rotate(-6 128 128)">${conchShape}</g>` + waterJet;
const conchV = `<g transform="rotate(-90 128 128)">${conchShape}</g>` + p('M150 49Q153 23 169 26Q177 34 150 55ZM168 62Q189 37 201 47Q207 59 170 69ZM181 77Q204 68 207 81Q202 91 181 82Z', c.blueDeep, 'none', 0);

const fan = 'M36 141C22 121 33 100 55 102C48 80 73 60 93 73C104 43 142 40 156 70C182 54 208 75 204 99C228 99 238 121 224 139C211 158 189 166 165 169H91C67 167 47 158 36 141Z';
const shell = p(fan, 'url(#blue)', c.ink, 6.5) + p('M55 104L102 158M93 75L115 153M156 72L137 153M204 100L153 159', 'none', c.blueDark, 5) + p('M35 176C52 168 74 170 90 176C105 169 122 172 136 176C151 168 169 172 184 177C201 170 215 172 222 179C209 214 174 235 129 235C84 235 47 213 35 176Z', 'url(#blue)', c.ink, 6.5) + p('M43 178C60 172 73 177 90 183C107 176 122 179 136 183C153 177 172 181 184 184Q204 177 215 181', 'none', c.paper, 7) + circle(128, 153, 35, 'url(#paper)', c.ink, 6.5) + p('M25 162L17 153M26 184L14 181M226 161L237 147', 'none', c.orange, 7);

const wave = p('M22 217C50 200 49 170 68 148C95 103 112 78 141 83C164 67 186 83 192 105C196 126 182 135 176 149C170 173 184 193 216 204L236 216Q244 221 236 225C174 239 54 234 22 220Z', 'url(#blue)', c.ink, 6.5) + p('M71 215C100 180 82 140 115 113C137 91 160 92 166 112C153 110 140 122 142 143C142 171 159 193 191 207C143 202 115 199 71 215Z', c.blueDeep, 'none', 0) + p('M123 112Q99 143 115 180Q108 147 138 115', 'none', c.blueDark, 8) + p('M99 106C101 89 112 77 129 80C136 61 155 63 166 74C184 65 197 81 195 96C214 98 226 112 219 124C235 139 220 160 206 153C205 177 186 181 178 163C159 169 154 149 162 136C149 141 138 128 143 116C129 122 116 110 99 106Z', 'url(#paper)', c.ink, 5.5) + p('M33 188Q48 140 77 125Q53 157 33 188ZM50 219Q71 189 95 207Q116 211 125 224Z', c.blueLight, 'none', 0) + p('M219 73Q228 47 239 62Q244 72 219 73ZM232 94Q253 83 249 99Q244 108 232 94ZM225 184Q238 170 246 185Q248 199 225 184Z', c.blueDeep, 'none', 0);

const subjects = [
  ['comb-horizontal', '横扫梳子', combH, 'h', 'pets', 'row'],
  ['comb-vertical', '竖扫梳子', combV, 'v', 'pets', 'column'],
  ['scissors', '十字剪刀', scissors, 'plus', 'pets', 'cross'],
  ['hair-dryer', '吹风机', dryer, null, 'pets', 'full-board-performance-only'],
  ['conch-horizontal', '横向海螺', conchH, 'h', 'fish', 'row'],
  ['conch-vertical', '纵向海螺', conchV, 'v', 'fish', 'column'],
  ['pearl-shell', '珍珠贝壳', shell, 'plus', 'fish', 'cross'],
  ['big-wave', '大浪花', wave, null, 'fish', 'full-board-performance-only'],
];
export const tools = subjects.map(([id, label, body, axis, mode, ability]) => item(id, label, '04-tools', body + (axis ? badge(axis) : ''), { mode, ability, ability_axis: axis, recommended_min_size: axis ? 40 : 64 }));
for (const [id, label, body, axis, mode, ability] of subjects) if (axis) tools.push(item(id + '-base', label + '无角标', '04-tools', body, { variant: 'without-ability-badge', base: id, mode, ability }));
for (const [axis, label] of [['h', '横扫能力标识'], ['v', '竖扫能力标识'], ['plus', '十字能力标识']]) tools.push(item('ability-' + axis, label, '04-tools', circle(128, 128, 78, c.ivory, c.ink, 10) + arrowMark(axis, 128, 128, 2.25), { variant: 'ability-marker', ability_axis: axis }));
