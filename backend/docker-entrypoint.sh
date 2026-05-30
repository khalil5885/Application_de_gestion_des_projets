#!/bin/sh
set -e

echo "Waiting for database..."
until php artisan db:monitor 2>/dev/null || \
      php -r "new PDO('mysql:host=db;port=3306;dbname=khalil_pro','root','root');" 2>/dev/null; do
  echo "DB not ready, retrying in 3s..."
  sleep 3
done

echo "Running migrations..."
php artisan migrate --force

echo "Seeding database..."
php artisan db:seed --force

echo "Starting server..."
exec php artisan serve --host=0.0.0.0 --port=8000