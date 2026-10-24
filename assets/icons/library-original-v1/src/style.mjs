export const c = {
  ink: '#24282e', feature: '#12191f', orange: '#ff6b18', orangeLight: '#ff781f', orangeDeep: '#f36313',
  paper: '#ffffff', ivory: '#fffaf1', cream: '#f0ddbf', creamLight: '#f8eddc', shadow: '#f7e4cb',
  blue: '#69aff4', blueDeep: '#2995e5', blueDark: '#2377be', blueLight: '#b6e6ff',
  gray: '#86929e', grayLight: '#c4c9ce', grayDark: '#596674', muted: '#aeb3b9', window: '#c3d6e0', green: '#229264', gold: '#ffb521', copper: '#ee955f', copperLight: '#ffc28f', copperEdge: '#e78c54',
};
export const round = 'stroke-linecap="round" stroke-linejoin="round"';
export const defs = `<linearGradient id="orange" x2=".2" y2="1"><stop stop-color="${c.orangeLight}"/><stop offset="1" stop-color="${c.orangeDeep}"/></linearGradient><linearGradient id="paper" x2=".7" y2="1"><stop stop-color="${c.paper}"/><stop offset="1" stop-color="${c.ivory}"/></linearGradient><linearGradient id="blue" x2=".4" y2="1"><stop stop-color="${c.blueLight}"/><stop offset="1" stop-color="${c.blueDeep}"/></linearGradient><linearGradient id="silver" x2=".5" y2="1"><stop stop-color="${c.grayLight}"/><stop offset="1" stop-color="${c.gray}"/></linearGradient><linearGradient id="copper" x2=".5" y2="1"><stop stop-color="${c.copperLight}"/><stop offset="1" stop-color="${c.copper}"/></linearGradient>`;
export const p = (d, fill = 'none', stroke = c.ink, width = 7.6, extra = '') => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${round} ${extra}/>`;
export const circle = (x, y, r, fill = 'url(#paper)', stroke = c.ink, width = 7.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
export const rect = (x, y, w, h, radius, fill = 'url(#paper)', stroke = c.ink, width = 7.6) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
export const ellipse = (x, y, rx, ry, fill, opacity = 1) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}"/>`;
export const sparks = (color = c.orange) => p('M205 51L215 33M222 69L239 59', 'none', color, 8);
export const ground = (x = 128, y = 229, rx = 85) => ellipse(x, y, rx, 10, c.shadow, .65);
export const item = (id, label, group, body, extra = {}) => ({ id, label, group, body, width: 256, height: 256, ...extra });
export function arrowMark(axis, x = 128, y = 128, scale = 1) {
  const d = axis === 'h' ? 'M-18 0H18M-10-9L-20 0L-10 9M10-9L20 0L10 9' : axis === 'v' ? 'M0-18V18M-9-10L0-20L9-10M-9 10L0 20L9 10' : 'M-18 0H18M0-18V18';
  return `<g transform="translate(${x} ${y}) scale(${scale})">${p(d, 'none', c.orange, axis === 'plus' ? 10 : 8)}</g>`;
}
export const badge = axis => circle(211, 205, 31, c.ivory, c.ink, 6) + arrowMark(axis, 211, 205, .92);
export const trayArrow = (down = false, white = false) => p('M56 158V207H200V158', 'none', white ? c.paper : c.ink, 18) + p(down ? 'M128 49V156M94 123L128 157L162 123' : 'M128 157V50M94 84L128 50L162 84', 'none', white ? c.paper : c.orange, 17);
export function roundedPolygon(points, fraction = .15) {
  return points.map((point, i) => {
    const previous = points[(i + points.length - 1) % points.length];
    const next = points[(i + 1) % points.length];
    const before = point.map((v, j) => v + (previous[j] - v) * fraction);
    const after = point.map((v, j) => v + (next[j] - v) * fraction);
    return `${i ? 'L' : 'M'}${before.join(' ')}Q${point.join(' ')} ${after.join(' ')}`;
  }).join('') + 'Z';
}
