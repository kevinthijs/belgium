#!/usr/bin/env bash
# Run from this project with Docker access (or use sg docker -c to load existing group membership).
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
release_image='convoy-belgium:map-motion-20261110-v2'
backup_dir="/docker/backups/belgium-government-$(date -u +%Y%m%dT%H%M%SZ)"

docker compose ps web >/dev/null
install -d -m 700 "$backup_dir"
cp docker-compose.yml "$backup_dir/docker-compose.before.yml"
docker compose ps --format json > "$backup_dir/containers.before.json"
docker build -t "$release_image" .

rollback() {
  trap - ERR
  cp "$backup_dir/docker-compose.before.yml" docker-compose.yml
  docker compose up -d --no-deps --no-build web
  printf 'Deployment failed; restored previous web image. Backup: %s\n' "$backup_dir" >&2
}
trap 'rollback; exit 1' ERR
python3 - "$release_image" <<'PY'
from pathlib import Path
import sys
p=Path('docker-compose.yml')
s=p.read_text()
allowed=['convoy-belgium:polish-20261109','convoy-belgium:government-comparison-20261109','convoy-belgium:complete-comparison-20261109','convoy-belgium:map-motion-20261110','convoy-belgium:map-motion-20261110-v2']
matches=['image: '+image for image in allowed if s.count('image: '+image)==1]
if len(matches)!=1:
 raise RuntimeError('Unexpected production image; Compose has not been changed')
p.write_text(s.replace(matches[0],'image: '+sys.argv[1]))
PY
docker compose up -d --no-deps --no-build web
python3 - <<'PY'
import time,urllib.request
for _ in range(45):
 try:
  with urllib.request.urlopen('http://127.0.0.1:3140/vergelijk',timeout=5) as r:
   html=r.read().decode()
   assert r.status==200 and all(marker in html for marker in ['landenkaart','Relatief verschil','overheid-en-burgemeesters','bestuurskosten','publieke-resultaten','demografische-context','evolutie-bestuurskosten','34.875'])
   break
 except Exception:
  time.sleep(1)
else:
 raise RuntimeError('New comparison page did not pass the deployment check')
for path in ['/', '/belgie']:
 with urllib.request.urlopen('http://127.0.0.1:3140'+path,timeout=30) as r:
  html=r.read().decode()
  assert r.status==200 and 'burgemeesters' in html
PY
trap - ERR
printf 'Published %s. Previous configuration: %s\n' "$release_image" "$backup_dir/docker-compose.before.yml"
