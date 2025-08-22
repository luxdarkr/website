#!/bin/bash

echo "Запуск Python сервера..."
cd "$(dirname "$0")/server"
python3 python_server.py