#!/usr/bin/env bash
# One-time setup for a new machine: creates the PostgreSQL user and databases, and writes backend/.env
# with generated secrets. Safe to run again: it does nothing if backend/.env already exists.
#
# Needs PostgreSQL installed and running, and a PostgreSQL superuser that matches your login name
# (the default with Homebrew). The names can be overridden with DB_NAME, TEST_DB_NAME, DB_ROLE, ENV_FILE.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/backend/.env}"
DB_NAME="${DB_NAME:-hotel_db}"
TEST_DB_NAME="${TEST_DB_NAME:-hotel_test}"
DB_ROLE="${DB_ROLE:-hotel_user}"

command -v psql >/dev/null || { echo "psql not found. Install PostgreSQL first, for example: brew install postgresql@17" >&2; exit 1; }
command -v openssl >/dev/null || { echo "openssl not found." >&2; exit 1; }

if [ -f "$ENV_FILE" ]; then
  echo "$ENV_FILE already exists, so nothing was changed."
  exit 0
fi

DB_PASSWORD="$(openssl rand -hex 12)"
JWT_SECRET="$(openssl rand -hex 32)"
ADMIN_PASSWORD="$(openssl rand -hex 8)"

psql -d postgres -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_ROLE') THEN
    ALTER ROLE $DB_ROLE WITH LOGIN PASSWORD '$DB_PASSWORD';
  ELSE
    CREATE ROLE $DB_ROLE WITH LOGIN PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;
SQL

for db in "$DB_NAME" "$TEST_DB_NAME"; do
  if ! psql -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1; then
    createdb -O "$DB_ROLE" "$db"
  fi
done

umask 177   # the file is readable by you only
cat > "$ENV_FILE" <<ENV
DB_URL=jdbc:postgresql://localhost:5432/$DB_NAME
DB_USER=$DB_ROLE
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$ADMIN_PASSWORD
ENV

echo "Done."
echo "  Databases: $DB_NAME and $TEST_DB_NAME (owner $DB_ROLE)"
echo "  Settings written to $ENV_FILE (keep it private; it is not committed)"
echo "  Admin login for the first start:  admin / $ADMIN_PASSWORD"
echo "Next: ./dev.sh"
