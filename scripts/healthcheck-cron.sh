#!/usr/bin/env bash
set -euo pipefail

# Fallback de supervision sans Uptime Kuma : interroge la readiness de l'API et
# alerte sur un webhook Discord en cas d'échec. À planifier via crontab :
#
#   * * * * * DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/xxx/yyy" \
#     /home/deploy/study-tune/scripts/healthcheck-cron.sh >> /var/log/study-tune-health.log 2>&1

HEALTH_URL="${HEALTH_URL:-https://study-tune.fr/api/health/ready}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

status_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$HEALTH_URL")" || status_code="000"

if [ "$status_code" = "200" ]; then
  exit 0
fi

message="StudyTune readiness check failed: HTTP ${status_code} on ${HEALTH_URL}"
echo "$(date --iso-8601=seconds) ${message}" >&2

if [ -n "$DISCORD_WEBHOOK_URL" ]; then
  curl -sS -H 'Content-Type: application/json' \
    -d "{\"content\": \"${message}\"}" \
    "$DISCORD_WEBHOOK_URL" >/dev/null || true
fi

exit 1
