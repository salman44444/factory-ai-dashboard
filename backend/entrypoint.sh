#!/bin/sh
set -e

echo "Waiting for database to be ready..."
python -c "
import time, os, psycopg2
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/factory_db')
for _ in range(30):
    try:
        conn = psycopg2.connect(db_url)
        conn.close()
        print('Database connection established successfully!')
        break
    except Exception as e:
        time.sleep(1)
else:
    print('Database connection timed out.')
    exit(1)
"

echo "Applying database migrations..."
alembic upgrade head

echo "Database migrations completed successfully!"

exec "$@"
