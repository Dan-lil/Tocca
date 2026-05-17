#!/bin/sh
set -e
echo "Running database migrations..."
npx sequelize-cli db:migrate
echo "Starting API server..."
exec node src/app.js