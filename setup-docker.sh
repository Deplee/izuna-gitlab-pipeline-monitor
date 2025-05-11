#!/bin/bash

# Создаем директорию для данных, если она не существует
mkdir -p ./data

# Устанавливаем правильные права доступа
chmod 777 ./data

echo "Директория ./data создана и настроена с правами доступа"

# Запускаем docker-compose с передачей UID и GID текущего пользователя
export UID=$(id -u)
export GID=$(id -g)

echo "Запуск docker-compose с UID=$UID и GID=$GID"
docker-compose up -d

echo "Контейнер запущен. Приложение доступно по адресу http://localhost:3000"
