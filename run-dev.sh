#!/bin/bash
# Runner con auto-restart inmediato
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=512"
export NEXT_TELEMETRY_DISABLED=1

while true; do
  node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1
  pkill -9 -f "next-server" 2>/dev/null
  sleep 1
done
