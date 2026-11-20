#!/usr/bin/env bash
# bourse-custom — reconstruction complète de l'image sur la VM (≈ 5–10 min), puis bascule et contrôle.
# Usage : scripts/bourse-build-image.sh b4   (le code doit être poussé sur bourse-custom)
set -euo pipefail
TAG="ghostfolio-bourse:3.100.0-${1:?suffixe de version requis, ex. b4}"
VM="${BOURSE_VM:-cyprien@162.38.112.138}"
ssh -o ConnectTimeout=10 "$VM" "cd ~/ghostfolio-src && git pull -q --ff-only && git log --oneline -1 && \
  (setsid nohup sh -c 'docker build -t $TAG . > ~/ghostfolio-build.log 2>&1; echo FIN-\$? >> ~/ghostfolio-build.log' \
  > /dev/null 2>&1 < /dev/null &)"
echo "→ construction de $TAG lancée…"
until ssh -o ConnectTimeout=10 "$VM" 'grep -q FIN- ~/ghostfolio-build.log' 2>/dev/null; do sleep 30; done
ssh "$VM" "tail -1 ~/ghostfolio-build.log | grep -q FIN-0 || { tail -20 ~/ghostfolio-build.log; exit 1; }
  cd ~/ghostfolio && sed -i -E 's#image: ghostfolio-bourse:[^ ]+#image: $TAG#' docker-compose.yml
  docker compose up -d ghostfolio >/dev/null 2>&1
  for i in \$(seq 1 40); do s=\$(docker inspect -f '{{.State.Health.Status}}' \$(docker compose ps -q ghostfolio)); [ \"\$s\" = healthy ] && break; sleep 5; done
  echo \"→ \$(grep 'image: ghostfolio-bourse' docker-compose.yml | xargs) : \$s\""
