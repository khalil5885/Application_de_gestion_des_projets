FROM php:8.4

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    unzip \
    zip \
    git

RUN docker-php-ext-install pdo pdo_mysql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install

# ← replaces the old CMD
COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]