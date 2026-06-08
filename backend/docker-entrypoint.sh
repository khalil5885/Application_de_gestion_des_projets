#!/bin/sh
set -e

echo "Running migrations..."
php artisan migrate --force

echo "Seeding database..."
php artisan db:seed --force 2>/dev/null || echo "Seeding skipped (data already exists)."

echo "Starting server..."
exec php artisan serve --host=0.0.0.0 --port=8000