#!/usr/bin/env bash
#
# Lance l'environnement de dev complet :
#   1. démarre ngrok pour exposer le back publiquement
#   2. met à jour APP_PUBLIC_URL dans api/.env avec l'URL ngrok
#   3. démarre le back (NestJS) puis le front (Angular)
#
# Ctrl+C arrête proprement les trois.
#
# Variables optionnelles : API_PORT (def. 3001), CLIENT_PORT (def. 4200)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/api/.env"
API_PORT="${API_PORT:-3001}"
CLIENT_PORT="${CLIENT_PORT:-4200}"
NGROK_API="http://127.0.0.1:4040/api/tunnels"

log() { printf '\033[1;36m[dev]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[dev]\033[0m %s\n' "$*" >&2; }

command -v ngrok >/dev/null 2>&1 || { err "ngrok n'est pas installé — https://ngrok.com/download"; exit 1; }
command -v node  >/dev/null 2>&1 || { err "node n'est pas installé"; exit 1; }
[ -f "$ENV_FILE" ] || { err "Fichier introuvable : $ENV_FILE (copie api/.env.example)"; exit 1; }

cleanup() {
  log "Arrêt en cours..."
  kill "$(jobs -p)" 2>/dev/null || true
  # Filet de sécurité : tue ce qui écoute encore sur les ports
  lsof -ti:"$API_PORT"    2>/dev/null | xargs -r kill 2>/dev/null || true
  lsof -ti:"$CLIENT_PORT" 2>/dev/null | xargs -r kill 2>/dev/null || true
  pkill -f "ngrok http $API_PORT" 2>/dev/null || true
  log "Terminé."
}
trap cleanup EXIT
trap 'exit 130' INT TERM

# 1) ngrok ---------------------------------------------------------------------
log "Démarrage de ngrok sur le port $API_PORT..."
ngrok http "$API_PORT" --log=stdout > "$ROOT_DIR/.ngrok.log" 2>&1 &

# 2) Récupération de l'URL publique -------------------------------------------
log "Attente de l'URL publique ngrok..."
PUBLIC_URL=""
for _ in $(seq 1 30); do
  PUBLIC_URL="$(curl -s "$NGROK_API" 2>/dev/null | node -e '
    let d = "";
    process.stdin.on("data", c => d += c).on("end", () => {
      try {
        const tunnels = (JSON.parse(d).tunnels || []);
        const https = tunnels.find(t => t.public_url && t.public_url.startsWith("https"));
        process.stdout.write(https ? https.public_url : "");
      } catch { process.stdout.write(""); }
    });' 2>/dev/null || true)"
  [ -n "$PUBLIC_URL" ] && break
  sleep 1
done

if [ -z "$PUBLIC_URL" ]; then
  err "Impossible de récupérer l'URL ngrok (voir $ROOT_DIR/.ngrok.log)."
  exit 1
fi
log "URL publique : $PUBLIC_URL"

# 3) Mise à jour de api/.env ---------------------------------------------------
if grep -q '^APP_PUBLIC_URL=' "$ENV_FILE"; then
  tmp="$(mktemp)"
  sed "s#^APP_PUBLIC_URL=.*#APP_PUBLIC_URL=$PUBLIC_URL#" "$ENV_FILE" > "$tmp"
  mv "$tmp" "$ENV_FILE"
else
  printf '\nAPP_PUBLIC_URL=%s\n' "$PUBLIC_URL" >> "$ENV_FILE"
fi
log "api/.env mis à jour → APP_PUBLIC_URL=$PUBLIC_URL"
log "Webhook kie.ai : $PUBLIC_URL/api/music/webhook/kie"

# 4) Back + Front --------------------------------------------------------------
cd "$ROOT_DIR"

log "Démarrage du back (NestJS, port $API_PORT)..."
npm run dev:api &

log "Démarrage du front (Angular, port $CLIENT_PORT)..."
npm run dev:client &

log "Tout est lancé — Front: http://localhost:$CLIENT_PORT · API: http://localhost:$API_PORT · Ctrl+C pour arrêter."
wait
