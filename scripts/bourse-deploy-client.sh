#!/usr/bin/env bash
# bourse-custom — mise à jour RAPIDE de l'interface (style, affichage) sans reconstruire l'image Docker.
# Compile l'interface en français sur le PC, l'envoie sur la VM et la remplace dans le conteneur en marche.
# Limite : perdu si le conteneur est recréé depuis une image plus ancienne → pousser le code et
# reconstruire l'image ensuite (bourse-build-image.sh) pour que la modification soit permanente.
# Ne concerne que l'interface : un changement côté serveur (apps/api) exige une reconstruction.
set -euo pipefail
VM="${BOURSE_VM:-cyprien@162.38.112.138}"
cd "$(dirname "$0")/.."

echo "→ compilation de l'interface (français)…"
export NX_DAEMON=false
npx nx run client:copy-assets --output-style=static >/dev/null
npx nx run client:build:production --output-style=static >/dev/null
node replace.build.mjs >/dev/null

echo "→ envoi sur la VM…"
tar -C dist/apps -czf - client | ssh -o ConnectTimeout=10 "$VM" '
  set -e
  rm -rf ~/ghostfolio-client && mkdir -p ~/ghostfolio-client && tar -C ~/ghostfolio-client -xzf -
  cd ~/ghostfolio
  id=$(docker compose ps -q ghostfolio)
  docker exec -u root "$id" rm -rf /ghostfolio/apps/client
  docker cp ~/ghostfolio-client/client "$id":/ghostfolio/apps/client
  docker exec -u root "$id" chown -R node:node /ghostfolio/apps/client
  docker restart "$id" >/dev/null
  for i in $(seq 1 30); do
    s=$(docker inspect -f "{{.State.Health.Status}}" "$id"); [ "$s" = healthy ] && break; sleep 3
  done
  echo "→ Ghostfolio : $s"'
