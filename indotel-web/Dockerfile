FROM composer:2.7 AS vendor
WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist --optimize-autoloader --ignore-platform-reqs || true

FROM php:8.3-fpm-alpine AS production
LABEL maintainer="Indotel Team <dev@indotel.id>"

RUN apk add --no-cache curl libpng-dev libjpeg-turbo-dev freetype-dev libxml2-dev libzip-dev zip unzip git oniguruma-dev icu-dev sqlite-dev sqlite supervisor tini && rm -rf /var/cache/apk/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install -j$(nproc) pdo pdo_sqlite pdo_mysql bcmath gd mbstring xml zip intl opcache pcntl

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

RUN { \
    echo "memory_limit=256M"; \
    echo "max_execution_time=60"; \
    echo "post_max_size=20M"; \
    echo "upload_max_filesize=20M"; \
    echo "opcache.enable=1"; \
    echo "opcache.memory_consumption=128"; \
    echo "opcache.max_accelerated_files=10000"; \
    echo "opcache.validate_timestamps=0"; \
    echo "date.timezone=Asia/Jakarta"; \
    echo "expose_php=Off"; \
    echo "display_errors=Off"; \
    echo "log_errors=On"; \
    echo "error_log=/dev/stderr"; \
} > /usr/local/etc/php/conf.d/99-custom.ini

WORKDIR /var/www/html
COPY --chown=www-data:www-data . .
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor

RUN composer dump-autoload --optimize --no-dev --no-scripts || true

RUN mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache database

RUN chown -R www-data:www-data storage bootstrap/cache database && \
    chmod -R 775 storage bootstrap/cache database

COPY --chown=root:root docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=stderr DB_CONNECTION=sqlite DB_DATABASE=/app/database/indotel.db

EXPOSE 9000
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]
