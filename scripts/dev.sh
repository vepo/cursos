#!/usr/bin/env bash
#
# Start the Cursos dev environment:
#   - Passport (user API)  -> http://localhost:8080
#   - Cursos (Quarkus+Quinoa/Angular via live coding on 4203) -> http://localhost:8083
#
# Passport is only started when port 8080 is free (it may already be running).
# Ctrl+C stops everything this script started.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CURSOS_DIR="$(dirname "${SCRIPT_DIR}")"
PASSPORT_DIR="${PASSPORT_DIR:-${CURSOS_DIR}/../passport}"

PASSPORT_PORT=8080
CURSOS_PORT=8083

PIDS=()

cleanup() {
    echo ""
    echo "Stopping dev environment..."
    for pid in "${PIDS[@]:-}"; do
        if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
            kill "${pid}" 2>/dev/null || true
        fi
    done
    wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

port_in_use() {
    (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && exec 3>&- && return 0
    return 1
}

wait_for_port() {
    local port="$1" name="$2" timeout="${3:-180}"
    local waited=0
    until port_in_use "${port}"; do
        sleep 2
        waited=$((waited + 2))
        if (( waited >= timeout )); then
            echo "ERROR: ${name} did not start on port ${port} after ${timeout}s" >&2
            exit 1
        fi
    done
    echo "${name} is up on port ${port}."
}

# --- Passport ---------------------------------------------------------------
if port_in_use "${PASSPORT_PORT}"; then
    echo "Port ${PASSPORT_PORT} already in use — assuming Passport is running."
else
    if [[ ! -d "${PASSPORT_DIR}" ]]; then
        echo "ERROR: Passport not found at ${PASSPORT_DIR} (set PASSPORT_DIR to override)" >&2
        exit 1
    fi
    echo "Starting Passport (${PASSPORT_DIR}) on port ${PASSPORT_PORT}..."
    (cd "${PASSPORT_DIR}" && mvn quarkus:dev) &
    PIDS+=("$!")
    wait_for_port "${PASSPORT_PORT}" "Passport"
fi

# --- Cursos -----------------------------------------------------------------
if port_in_use "${CURSOS_PORT}"; then
    echo "ERROR: Port ${CURSOS_PORT} already in use — is Cursos already running?" >&2
    exit 1
fi

if [[ ! -d "${CURSOS_DIR}/src/main/webui/node_modules" ]]; then
    echo "Installing Angular dependencies (first run)..."
    (cd "${CURSOS_DIR}/src/main/webui" && npm install)
fi

echo "Starting Cursos on port ${CURSOS_PORT} (Angular live coding on 4203)..."
(cd "${CURSOS_DIR}" && mvn quarkus:dev) &
PIDS+=("$!")
wait_for_port "${CURSOS_PORT}" "Cursos" 300

echo ""
echo "Dev environment ready:"
echo "  Passport: http://localhost:${PASSPORT_PORT}"
echo "  Cursos:   http://localhost:${CURSOS_PORT}"
echo "  Login:    cto@passport.vepo.dev / qwas1234"
echo ""
echo "Press Ctrl+C to stop."
wait
