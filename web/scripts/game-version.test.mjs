import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { readGameVersion } from './game-version.mjs';

const savedVersion = process.env.GAME_VERSION;
delete process.env.GAME_VERSION;
after(() => {
  if (savedVersion === undefined) delete process.env.GAME_VERSION;
  else process.env.GAME_VERSION = savedVersion;
});

function git(cwd, args, env = {}) {
  return execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function temporaryDirectory(t) {
  const directory = mkdtempSync(join(tmpdir(), 'moego-game-version-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function repository(t) {
  const root = temporaryDirectory(t);
  const cwd = join(root, 'repo');
  mkdirSync(cwd);
  git(cwd, ['init', '--quiet', '--initial-branch=main']);
  git(cwd, ['config', 'user.name', 'Version Test']);
  git(cwd, ['config', 'user.email', 'version-test@example.invalid']);
  git(cwd, ['config', 'commit.gpgsign', 'false']);
  git(cwd, ['config', 'core.hooksPath', '/dev/null']);
  return { root, cwd };
}

function datedGit(cwd, args, date) {
  return git(cwd, args, { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
}

function commit(cwd, date) {
  datedGit(cwd, ['commit', '--quiet', '--allow-empty', '-m', `Commit ${date}`], date);
}

test('same-day commits increment the revision and repeated reads stay stable', (t) => {
  const { cwd } = repository(t);
  commit(cwd, '2026-10-25T01:00:00+08:00');
  assert.equal(readGameVersion({ cwd }), '20261025.1');
  assert.equal(readGameVersion({ cwd }), '20261025.1');
  commit(cwd, '2026-10-25T02:00:00+08:00');
  assert.equal(readGameVersion({ cwd }), '20261025.2');
  assert.equal(readGameVersion({ cwd }), '20261025.2');
});

test('the date and daily revision follow Beijing midnight across timestamp timezones', (t) => {
  const { cwd } = repository(t);
  commit(cwd, '2026-10-24T15:59:59Z');
  assert.equal(readGameVersion({ cwd }), '20261024.1');
  commit(cwd, '2026-10-24T16:00:00Z');
  assert.equal(readGameVersion({ cwd }), '20261025.1');
  commit(cwd, '2026-10-25T10:00:00+08:00');
  assert.equal(readGameVersion({ cwd }), '20261025.2');
});

test('a merge counts the first-parent mainline without counting feature commits', (t) => {
  const { cwd } = repository(t);
  commit(cwd, '2026-10-25T01:00:00+08:00');
  git(cwd, ['checkout', '--quiet', '-b', 'feature']);
  commit(cwd, '2026-10-25T02:00:00+08:00');
  commit(cwd, '2026-10-25T03:00:00+08:00');
  git(cwd, ['checkout', '--quiet', 'main']);
  commit(cwd, '2026-10-25T04:00:00+08:00');
  datedGit(cwd, ['merge', '--quiet', '--no-ff', 'feature', '-m', 'Merge feature'], '2026-10-25T05:00:00+08:00');
  assert.equal(readGameVersion({ cwd }), '20261025.3');
});

test('an explicit build version works without Git metadata', (t) => {
  const cwd = temporaryDirectory(t);
  assert.equal(readGameVersion({ cwd, version: '20261025.7' }), '20261025.7');
});

test('the GAME_VERSION environment variable supplies the default override', (t) => {
  const cwd = temporaryDirectory(t);
  process.env.GAME_VERSION = '20261025.12';
  try {
    assert.equal(readGameVersion({ cwd }), '20261025.12');
  } finally {
    delete process.env.GAME_VERSION;
  }
});

test('invalid build overrides are rejected before a Git fallback', (t) => {
  const cwd = temporaryDirectory(t);
  for (const version of ['invalid', '2026-10-25.1', '20261025', '20261025.0']) {
    assert.throws(() => readGameVersion({ cwd, version }), /version|版本/i);
  }
});

test('a shallow clone is rejected rather than silently reporting revision one', (t) => {
  const { root, cwd } = repository(t);
  commit(cwd, '2026-10-25T01:00:00+08:00');
  commit(cwd, '2026-10-25T02:00:00+08:00');
  const clone = join(root, 'shallow');
  git(root, ['clone', '--quiet', '--depth', '1', pathToFileURL(cwd).href, clone]);
  assert.throws(() => readGameVersion({ cwd: clone }), /shallow|浅/i);
});

test('a directory without Git or a build override fails with a clear message', (t) => {
  const cwd = temporaryDirectory(t);
  assert.throws(() => readGameVersion({ cwd }), /git|version|版本/i);
});
