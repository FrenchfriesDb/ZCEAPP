#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

CLEAR_FLAG=""
if [[ "${1:-}" == "--clear" ]]; then
	CLEAR_FLAG="--clear"
fi

# Kill stale Expo instances so we never hop ports interactively.
pkill -f "node_modules/.bin/expo start" >/dev/null 2>&1 || true
pkill -f "npm exec expo start" >/dev/null 2>&1 || true

export USE_WATCHMAN=0
export NODE_OPTIONS=--max-old-space-size=8192

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)"
DEV_SERVER_URL="http://${LAN_IP}:8083"
ENCODED_DEV_SERVER_URL="$(node -e "process.stdout.write(encodeURIComponent(process.argv[1]))" "$DEV_SERVER_URL")"

echo "Starting Expo dev client server on ${DEV_SERVER_URL}"

# Helper runs in background so Expo can stay interactive in foreground.
(
	for i in {1..90}; do
		if curl -fsS "http://localhost:8083/status" >/dev/null 2>&1; then
			echo "Metro ready, opening development build via zce://expo-development-client"
			open -a Simulator >/dev/null 2>&1 || true
			xcrun simctl boot "iPhone 17 Pro Max" >/dev/null 2>&1 || true
			xcrun simctl bootstatus booted -b >/dev/null 2>&1 || true
			xcrun simctl openurl booted "zce://expo-development-client/?url=${ENCODED_DEV_SERVER_URL}" >/dev/null 2>&1 || true
			xcrun simctl openurl booted "exp://${LAN_IP}:8083" >/dev/null 2>&1 || true
			break
		fi
		sleep 1
	done
) &

exec npx expo start --dev-client ${CLEAR_FLAG} --host lan --port 8083
