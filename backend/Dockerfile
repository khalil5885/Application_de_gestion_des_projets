FROM php:8.4

WORKDIR /var/www

# Install dependencies
RUN apt-get update && apt-get install -y \
    unzip \
    zip \
    git

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy project
COPY . .

# Install PHP dependencies
RUN composer install

CMD ["php", "artisan", "serve", "--host=0.0.0.0"]