import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const beijingDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
});

function dateOf(timestamp) {
  const parts = beijingDate.formatToParts(new Date(Number(timestamp) * 1000));
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type).value).join('');
}

/** Latest commit's Beijing date and same-day first-parent revision; fixed for each commit. */
export function readGameVersion({ cwd = repositoryRoot, version = process.env.GAME_VERSION } = {}) {
  if (version) {
    if (!/^\d{8}\.[1-9]\d*$/.test(version)) throw new Error('GAME_VERSION must use YYYYMMDD.N, starting at revision 1.');
    return version;
  }

  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let shallow;
  let timestamps;
  try {
    shallow = git('rev-parse', '--is-shallow-repository') === 'true';
    timestamps = git('log', '--first-parent', '--format=%ct', 'HEAD').split('\n');
  } catch (cause) {
    throw new Error('Cannot read Git history. Build from a Git checkout or pass GAME_VERSION=YYYYMMDD.N.', { cause });
  }
  if (shallow) throw new Error('Cannot calculate a version from shallow Git history. Fetch full history (fetch-depth: 0).');

  const date = dateOf(timestamps[0]);
  const revision = timestamps.filter((timestamp) => dateOf(timestamp) === date).length;
  return `${date}.${revision}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(readGameVersion());
}
