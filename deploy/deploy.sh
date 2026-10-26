#!/usr/bin/env bash
# 用法：bash incoming/deploy.sh registry/project@sha256:... /app/moego-pet-match
# production.env 预先放在部署目录；脚本不读取本机 .env，也不执行数据库迁移。
set +x
set -euo pipefail
umask 077

die() { printf 'Deployment failed: %s\n' "$*" >&2; exit 1; }
source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
image=${1:-}
[[ $# -ge 1 && $# -le 2 ]] || die 'usage: deploy.sh IMAGE [DEPLOY_DIRECTORY]'
[[ "$image" =~ ^[a-z0-9][a-z0-9.-]*(:[0-9]+)?/[a-z0-9][a-z0-9._/-]*(:[A-Za-z0-9_][A-Za-z0-9_.-]*|@sha256:[a-f0-9]{64})$ ]] || die 'use a registry image with a version tag or sha256 digest'
[[ "$image" != *:latest ]] || die 'latest is not a release version'

for dependency in docker python3 flock; do
  command -v "$dependency" >/dev/null 2>&1 || die "missing dependency: $dependency"
done
deploy_dir=${2:-$source_dir}
[[ -d "$deploy_dir" ]] || die 'deployment directory does not exist'
deploy_dir=$(cd -- "$deploy_dir" && pwd)
candidate_compose="$source_dir/compose.yml"
active_compose="$deploy_dir/compose.yml"
active_release="$deploy_dir/release.env"
[[ -f "$candidate_compose" ]] || die 'candidate compose.yml is missing'
[[ -f "$deploy_dir/production.env" ]] || die 'production.env is missing'

exec 9> "$deploy_dir/.deploy.lock"
flock -n 9 || die 'another deployment is running'
[[ ! -f "$active_release" || -f "$active_compose" ]] || die 'active release has no compose.yml'

read_release() {
  [[ -f "$active_release" ]] || return 0
  awk -F= -v key="$1" '$1 == key { print substr($0, index($0, "=") + 1); exit }' "$active_release"
}
port=${PET_MATCH_PORT:-$(read_release PET_MATCH_PORT)}
port=${port:-8787}
memory=${PET_MATCH_MEMORY:-$(read_release PET_MATCH_MEMORY)}
memory=${memory:-512m}
[[ "$port" =~ ^[1-9][0-9]{0,4}$ && "$port" -le 65535 ]] || die 'PET_MATCH_PORT must be between 1 and 65535'
[[ "$memory" =~ ^[1-9][0-9]*[mMgG]$ ]] || die 'PET_MATCH_MEMORY must use a positive m or g size'

candidate_release=$(mktemp "$deploy_dir/.release.XXXXXX")
resolved_config=$(mktemp "$deploy_dir/.config.XXXXXX")
trap 'rm -f -- "$candidate_release" "$resolved_config"' EXIT
printf 'PET_MATCH_IMAGE=%s\nPET_MATCH_PORT=%s\nPET_MATCH_MEMORY=%s\n' "$image" "$port" "$memory" > "$candidate_release"

compose() {
  local compose_file=$1 release_file=$2
  shift 2
  # --env-file 只保存发布信息；运行凭据始终由 compose 的 env_file 读取。
  env -u PET_MATCH_IMAGE -u PET_MATCH_PORT -u PET_MATCH_MEMORY \
    docker compose --project-name moego-pet-match --project-directory "$deploy_dir" \
    --env-file "$release_file" -f "$compose_file" "$@"
}

# 让 Compose 负责 dotenv 的引号、转义与插值；只输出校验错误的键名。
# config 的完整内容含凭据，限制在 0600 临时文件中，退出即删除。
compose "$candidate_compose" "$candidate_release" config --format json > "$resolved_config" 2>/dev/null \
  || die 'Compose could not parse production.env or the deployment configuration'
python3 - "$resolved_config" <<'PY' || die 'invalid production.env; no container was changed'
import json, sys
try:
    runtime = json.load(open(sys.argv[1]))['services']['pet-match'].get('environment', {})
    allowed = {'PET_MATCH_DATABASE_URL', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID',
               'R2_SECRET_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME',
               'R2_JURISDICTION', 'SLACK_BOT_TOKEN', 'SLACK_NOTIFY_CHANNEL',
               'SLACK_SIGNING_SECRET', 'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'}
    unknown = sorted(set(runtime) - allowed)
    required = ['PET_MATCH_DATABASE_URL', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_BUCKET_NAME', 'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY']
    missing = [key for key in required if not str(runtime.get(key) or '').strip()]
    # 应用使用 ?? 选择新名称：空的新名称也会遮住旧名称，必须直接拒绝。
    secret = runtime.get('R2_SECRET_ACCESS_KEY')
    if secret is None:
        secret = runtime.get('R2_SECRET_KEY_ID')
    if not str(secret or '').strip():
        missing.append('R2_SECRET_ACCESS_KEY or R2_SECRET_KEY_ID')
    if unknown:
        print('Unsupported runtime keys: ' + ', '.join(unknown), file=sys.stderr)
    if missing:
        print('Missing runtime keys: ' + ', '.join(missing), file=sys.stderr)
    if unknown or missing:
        sys.exit(1)
    if not runtime['PET_MATCH_DATABASE_URL'].startswith(('postgres://', 'postgresql://')):
        print('PET_MATCH_DATABASE_URL must be a Postgres connection URL', file=sys.stderr)
        sys.exit(1)
except (OSError, ValueError, KeyError, TypeError):
    print('Could not validate resolved production configuration', file=sys.stderr)
    sys.exit(1)
PY
rm -f -- "$resolved_config"

# 拉取失败时尚未操作现有容器，也未更新当前发布信息。
printf 'Pulling release %s\n' "$image"
compose "$candidate_compose" "$candidate_release" pull pet-match || die 'image pull failed; active release is unchanged'

if compose "$candidate_compose" "$candidate_release" up -d --wait --wait-timeout 120 pet-match; then
  if [[ -f "$active_release" ]]; then
    cp -- "$active_release" "$active_release.previous"
    cp -- "$active_compose" "$active_compose.previous"
  fi
  if [[ "$candidate_compose" != "$active_compose" ]]; then
    cp -- "$candidate_compose" "$active_compose"
    cp -- "$source_dir/deploy.sh" "$deploy_dir/deploy.sh"
  fi
  mv -- "$candidate_release" "$active_release"
  printf 'Deployment healthy: %s\n' "$image"
  exit 0
fi

printf 'New release failed its health check.\n' >&2
if [[ -f "$active_release" ]]; then
  # 未覆盖旧版文件，因此恢复使用的是上一版镜像、端口与 Compose 配置。
  if compose "$active_compose" "$active_release" up -d --wait --wait-timeout 120 pet-match; then
    die 'previous release restored'
  fi
  die 'rollback also failed; inspect the project with docker compose logs'
fi

# 首次部署没有可回滚版本；不删除卷，不影响其他 Compose project。
compose "$candidate_compose" "$candidate_release" down --timeout 20 >/dev/null 2>&1 \
  || die 'first deployment failed and cleanup failed; inspect the project manually'
die 'first deployment failed; failed containers removed'
