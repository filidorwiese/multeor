#!/bin/bash -e

mkdir -p /app/logs

npm run build

npm run start
