#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  if [[ -f ".env.local" ]]; then
    set -a
    source ".env.local"
    set +a
  fi
fi

if [[ -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  if [[ -f ".env" ]]; then
    set -a
    source ".env"
    set +a
  fi
fi

if [[ -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  if [[ -n "${DATABASE_URL:-}" ]]; then
    SUPABASE_DATABASE_URL="${DATABASE_URL}"
    export SUPABASE_DATABASE_URL
  fi
fi

if [[ -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  echo "Falta SUPABASE_DATABASE_URL (o DATABASE_URL) para conectar a Supabase."
  exit 1
fi

if ! echo "${SUPABASE_DATABASE_URL}" | grep -qE 'supabase\.co|pooler\.supabase\.com'; then
  echo "SUPABASE_DATABASE_URL no parece un Postgres de Supabase."
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q '^firststep-postgres$'; then
  echo "No existe el contenedor firststep-postgres. Levanta docker-compose primero."
  exit 1
fi

SUPABASE_PSQL_URL="${SUPABASE_DATABASE_URL}"
SUPABASE_HOST="$(printf '%s' "${SUPABASE_DATABASE_URL}" | sed -nE 's#^postgres(ql)?://[^@]+@([^:/?]+).*#\\2#p')"
if [[ -n "${SUPABASE_HOST}" ]]; then
  RESOLVED="$(docker exec -i firststep-postgres sh -lc "getent hosts \"${SUPABASE_HOST}\" | head -n 1" | tr -d '\r')"
  RESOLVED_ADDR="$(printf '%s' "${RESOLVED}" | cut -d ' ' -f 1)"
  if [[ -n "${RESOLVED_ADDR}" ]] && printf '%s' "${RESOLVED_ADDR}" | grep -q ':'; then
    echo "El host de Supabase resolvió solo a IPv6 (${RESOLVED_ADDR}) y este entorno no tiene conectividad IPv6."
    echo "Solución recomendada: usa el Connection String del Pooler (modo Session) en Supabase (Project Settings → Database → Connection string)."
    exit 2
  fi
fi

echo "Probando conexión a Supabase..."
docker exec -i firststep-postgres sh -lc "psql \"${SUPABASE_PSQL_URL}\" -v ON_ERROR_STOP=1 -c 'select 1'"

echo "Exportando schema public desde Postgres local..."
docker exec -i firststep-postgres sh -lc "pg_dump -U postgres -d firststep --schema=public --clean --if-exists --no-owner --no-privileges" \
  | docker exec -i firststep-postgres sh -lc "psql \"${SUPABASE_PSQL_URL}\" -v ON_ERROR_STOP=1"

echo "Listo."
