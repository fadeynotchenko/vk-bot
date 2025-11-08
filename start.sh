#!/usr/bin/env bash
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# env
if [[ -f .env ]]; then
  set -a; . ./.env; set +a
fi

API_LISTEN_URL="${API_LISTEN_URL:-http://127.0.0.1:8788}"
VITE_API_URL="${VITE_API_URL:-http://127.0.0.1:8788}"
WEB_URL="${WEB_URL:-http://127.0.0.1:4173}"
API_STARTUP_DELAY="${API_STARTUP_DELAY:-3}"
BOT_STARTUP_DELAY="${BOT_STARTUP_DELAY:-2}"

API_HOST="$(node -e 'const u=new URL(process.env.API_LISTEN_URL);console.log(u.hostname)')"
API_PORT="$(node -e 'const u=new URL(process.env.API_LISTEN_URL);console.log(u.port?Number(u.port):(u.protocol==="https:"?443:80))')"
WEB_HOST="$(node -e 'const u=new URL(process.env.WEB_URL);console.log(u.hostname)')"
WEB_PORT="$(node -e 'const u=new URL(process.env.WEB_URL);console.log(u.port?Number(u.port):(u.protocol==="https:"?443:80))')"

export API_LISTEN_URL VITE_API_URL WEB_URL API_HOST API_PORT WEB_HOST WEB_PORT

API_PID=""; WEB_PID=""; BOT_PID=""

cleanup() {
  echo "🧹 Stopping..."
  [[ -n "${BOT_PID}" ]] && kill "${BOT_PID}" 2>/dev/null || true
  [[ -n "${WEB_PID}" ]] && kill "${WEB_PID}" 2>/dev/null || true
  [[ -n "${API_PID}" ]] && kill "${API_PID}" 2>/dev/null || true
  wait || true
}
trap cleanup EXIT INT TERM

echo "🚀 API bind: ${API_HOST}:${API_PORT} (${API_LISTEN_URL})"
node --loader ts-node/esm api/http.ts & API_PID=$!

echo "⏳ Wait ${API_STARTUP_DELAY}s for API..."
sleep "${API_STARTUP_DELAY}"

echo "🛠 Building web..."
npm run build --prefix max-web

echo "🔎 Preview web on ${WEB_URL}"
npm run preview --prefix max-web -- --host "${WEB_HOST}" --port "${WEB_PORT}" & WEB_PID=$!

echo "🤖 Bot: starting in ${BOT_STARTUP_DELAY}s..."
sleep "${BOT_STARTUP_DELAY}"
node --loader ts-node/esm bot/bot.ts & BOT_PID=$!

wait
