#!/bin/bash
# Script que mantiene el servidor vivo reiniciándolo cuando muere
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=512"
export NEXT_TELEMETRY_DISABLED=1

while true; do
  # Verificar si el servidor está respondiendo
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$HTTP_CODE" != "200" ]; then
    # Matar procesos previos
    pkill -9 -f "next dev" 2>/dev/null
    pkill -9 -f "next-server" 2>/dev/null
    sleep 1
    # Iniciar servidor en background
    node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
    NEXT_PID=$!
    disown $NEXT_PID
    # Esperar a que arranque
    for i in $(seq 1 15); do
      sleep 2
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
      if [ "$HTTP_CODE" = "200" ]; then
        echo "[$(date)] Servidor listo (PID: $NEXT_PID)"
        break
      fi
    done
  fi
  sleep 3
done
