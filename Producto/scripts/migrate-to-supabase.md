1) Crea un archivo .env.local (no se versiona) con:

SUPABASE_DATABASE_URL=postgresql://postgres:TU_PASSWORD@db.TU_REF.supabase.co:5432/postgres?sslmode=require
DATABASE_URL=postgresql://postgres:TU_PASSWORD@db.TU_REF.supabase.co:5432/postgres?sslmode=require

2) Levanta tu stack local (para tener el contenedor firststep-postgres con pg_dump/psql):

docker compose up -d db

3) Migra (vacía public en Supabase y carga public desde local):

set -a
source .env.local
set +a

bash scripts/migrate-to-supabase.sh

4) Levanta backend apuntando a Supabase:

docker compose up -d backend

