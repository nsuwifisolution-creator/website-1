#!/bin/sh
set -e

echo "🚀 Starting Indotel Web..."

if [ -z "$APP_KEY" ]; then
    echo "🔑 Generating APP_KEY..."
    php artisan key:generate --force || true
fi

if [ ! -L "/var/www/html/public/storage" ]; then
    echo "🔗 Creating storage link..."
    php artisan storage:link || true
fi

if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "📦 Running migrations..."
    php artisan migrate --force || true
fi

if [ "$APP_ENV" = "production" ]; then
    echo "⚡ Optimizing caches..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
    php artisan event:cache || true
fi

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

echo "✅ Startup complete!"
exec "$@"
