#!/usr/bin/env bash
# 无网络的故障测试：Docker 边界使用 mock，状态文件与部署脚本均为真实操作。
set -euo pipefail

source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
test_root=$(mktemp -d)
trap 'rm -rf -- "$test_root"' EXIT
mkdir -p "$test_root/bin"

cat > "$test_root/bin/flock" <<'SH'
#!/usr/bin/env bash
exit 0
SH
cat > "$test_root/bin/docker" <<'PY'
#!/usr/bin/env python3
import json, os, pathlib, sys
args = sys.argv[1:]
root = pathlib.Path(args[args.index('--project-directory') + 1])
state = pathlib.Path(args[args.index('--env-file') + 1])
values = dict(line.split('=', 1) for line in state.read_text().splitlines() if '=' in line)
image = values['PET_MATCH_IMAGE']
operation = next(arg for arg in args if arg in ('config', 'pull', 'up', 'down'))
with open(os.environ['MOCK_LOG'], 'a') as output:
    output.write(operation + ' ' + image + '\n')
if operation == 'config':
    runtime = dict(line.split('=', 1) for line in (root / 'production.env').read_text().splitlines() if '=' in line and not line.startswith('#'))
    print(json.dumps({'services': {'pet-match': {'environment': runtime}}}))
elif operation == 'pull' and os.environ.get('MOCK_MODE') == 'pull-fail':
    sys.exit(1)
elif operation == 'up' and os.environ.get('MOCK_MODE') == 'health-fail' and image.endswith(':new'):
    sys.exit(1)
PY
chmod +x "$test_root/bin/docker" "$test_root/bin/flock"
export PATH="$test_root/bin:$PATH"

old_image=registry.example.test/moego-pet-match:old
new_image=registry.example.test/moego-pet-match:new
passed=0

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
assert_contains() { rg -q -- "$2" "$1" || fail "$1 must contain $2"; }
assert_absent() { if rg -q -- "$2" "$1"; then fail "$1 must not contain $2"; fi; }
setup_case() {
  case_dir="$test_root/$1"
  mkdir -p "$case_dir/active"
  printf '# old compose\n' > "$case_dir/active/compose.yml"
  cat > "$case_dir/active/production.env" <<'ENV'
PET_MATCH_DATABASE_URL=postgres://app:SECRET_SENTINEL@database.example.test/pet_match
R2_ACCOUNT_ID=account
R2_ACCESS_KEY_ID=access
R2_SECRET_KEY_ID=SECRET_SENTINEL
R2_BUCKET_NAME=star
SLACK_BOT_TOKEN=SECRET_SENTINEL
ENV
  printf 'PET_MATCH_IMAGE=%s\nPET_MATCH_PORT=8787\nPET_MATCH_MEMORY=512m\n' "$old_image" > "$case_dir/active/release.env"
  export MOCK_LOG="$case_dir/calls"
  : > "$MOCK_LOG"
  export MOCK_MODE=success
}
run_deploy() {
  bash "$source_dir/deploy.sh" "$new_image" "$case_dir/active" > "$case_dir/output" 2>&1
}
check_secret() { assert_absent "$case_dir/output" SECRET_SENTINEL; }
pass() { passed=$((passed + 1)); printf 'PASS: %s\n' "$1"; }

setup_case pull-fail
MOCK_MODE=pull-fail
if run_deploy; then fail 'pull failure returned success'; fi
assert_contains "$case_dir/active/release.env" ':old$'
assert_absent "$MOCK_LOG" '^up '
assert_contains "$case_dir/active/compose.yml" '^# old compose$'
check_secret
pass 'pull failure leaves the running release untouched'

setup_case success
run_deploy || { cat "$case_dir/output"; fail 'successful deploy returned failure'; }
assert_contains "$case_dir/active/release.env" ':new$'
assert_contains "$case_dir/active/release.env.previous" ':old$'
assert_contains "$case_dir/active/compose.yml.previous" '^# old compose$'
cmp -s "$source_dir/compose.yml" "$case_dir/active/compose.yml" || fail 'candidate compose was not promoted'
check_secret
pass 'success promotes image and preserves previous configuration'

setup_case health-fail
MOCK_MODE=health-fail
if run_deploy; then fail 'health failure returned success'; fi
assert_contains "$MOCK_LOG" '^up registry.example.test/moego-pet-match:new$'
assert_contains "$MOCK_LOG" '^up registry.example.test/moego-pet-match:old$'
assert_contains "$case_dir/active/release.env" ':old$'
assert_contains "$case_dir/active/compose.yml" '^# old compose$'
check_secret
pass 'health failure restores the active image and compose'

setup_case first-failure
rm "$case_dir/active/release.env" "$case_dir/active/compose.yml"
MOCK_MODE=health-fail
if run_deploy; then fail 'first deployment failure returned success'; fi
assert_contains "$MOCK_LOG" '^down '
test ! -f "$case_dir/active/release.env" || fail 'failed first deployment was promoted'
check_secret
pass 'first deployment failure removes only the failed project'

for mode in missing empty forbidden; do
  setup_case "env-$mode"
  case "$mode" in
    missing) sed '/^R2_BUCKET_NAME=/d' "$case_dir/active/production.env" > "$case_dir/env.tmp" ;;
    empty) sed 's/^R2_BUCKET_NAME=.*/R2_BUCKET_NAME=/' "$case_dir/active/production.env" > "$case_dir/env.tmp" ;;
    forbidden) cp "$case_dir/active/production.env" "$case_dir/env.tmp"; printf 'DATABASE_URL=SECRET_SENTINEL\n' >> "$case_dir/env.tmp" ;;
  esac
  mv "$case_dir/env.tmp" "$case_dir/active/production.env"
  if run_deploy; then fail "$mode runtime configuration returned success"; fi
  assert_absent "$MOCK_LOG" '^pull '
  assert_absent "$MOCK_LOG" '^up '
  check_secret
  pass "$mode runtime configuration is rejected without exposing values"
done

setup_case empty-preferred-key
printf 'R2_SECRET_ACCESS_KEY=\n' >> "$case_dir/active/production.env"
if run_deploy; then fail 'empty preferred R2 key shadowed the legacy key without rejection'; fi
assert_absent "$MOCK_LOG" '^pull '
check_secret
pass 'empty preferred R2 secret is rejected even when the legacy alias exists'

setup_case invalid-image
new_image='registry.example.test/moego-pet-match:latest'
if run_deploy; then fail 'latest image was accepted'; fi
test ! -s "$MOCK_LOG" || fail 'invalid image reached Docker'
check_secret
pass 'mutable latest image is rejected'

printf '%s deployment tests passed.\n' "$passed"
