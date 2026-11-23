# Backup and restore

## PostgreSQL

```bash
pg_dump --format=custom --file=bloeme-$(date +%Y%m%d).dump "$DATABASE_URL"
createdb bloeme_restore
pg_restore --clean --if-exists --dbname="$RESTORE_DATABASE_URL" bloeme-YYYYMMDD.dump
```

Back up the database and the media volume together. Media rows reference content-addressed files under `MEDIA_ROOT`; restoring only the database leaves images unavailable.

## Docker volume

```bash
docker compose exec db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > bloeme.dump
docker compose exec -T db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < bloeme.dump
```

Test restore procedures regularly in an isolated database. Never commit dumps, `.env`, sessions, Stripe keys or SMTP credentials.
