#!/usr/bin/env npx prisma db push
export DATABASE_URL=postgres://hometest_user:123456@hometest_db:5432/hometest_db
until psql -c '\l'; do
  echo >&2 "$(date +%Y%m%dt%H%M%S) Postgres is unavailable - sleeping"
  sleep 1
done
echo >&2 "$(date +%Y%m%dt%H%M%S) Postgres is up - executing command"

exec ${@}