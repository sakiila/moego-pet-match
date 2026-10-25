#!/usr/bin/env bash
set -euo pipefail
umask 077
backup_dir=/app/moego-pet-match/db-backups
install -d -m 700 "$backup_dir"
backup_file="$backup_dir/pet_match-$(date -u +%Y%m%dT%H%M%SZ).dump"
temporary_file=$(mktemp "$backup_dir/.backup.XXXXXX")
trap 'rm -f -- "$temporary_file"' EXIT
timeout 120 docker exec postgresql sh -c 'exec pg_dump -U "$POSTGRES_USER" -d pet_match --format=custom --no-owner' > "$temporary_file"
test -s "$temporary_file"
# 先确认归档可读，成功后才发布本次备份。
docker exec -i postgresql pg_restore --list < "$temporary_file" > /dev/null
mv -- "$temporary_file" "$backup_file"
find "$backup_dir" -maxdepth 1 -type f -name 'pet_match-????????T??????Z.dump' -mtime +13 -delete
printf 'Database backup saved: %s\n' "$backup_file"
