FROM php:8.3-cli-alpine

# Install system dependencies
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    libpng-dev \
    oniguruma-dev \
    zip \
    unzip \
    git \
    curl

# Install PHP extensions needed for Laravel
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    mbstring \
    zip \
    gd \
    opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy all project files
COPY . .

# Install PHP dependencies (no dev packages)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Set correct permissions
RUN chmod -R 775 storage bootstrap/cache

# Expose the port Render will use
EXPOSE 8080

# Start: run migrations then serve
CMD php artisan config:clear && \
    php artisan migrate --force && \
    php artisan db:seed --class=SystemSettingsSeeder --force 2>/dev/null || true && \
    php artisan serve --host=0.0.0.0 --port=8080
