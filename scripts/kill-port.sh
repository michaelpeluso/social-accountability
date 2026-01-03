#!/bin/bash
# Kill process on port 8081 (Metro bundler)

PORT=${1:-8081}

echo "Looking for process on port $PORT..."

if command -v lsof &> /dev/null; then
    # macOS/Linux
    PID=$(lsof -ti :$PORT)
    if [ -n "$PID" ]; then
        echo "   Found process $PID"
        kill -9 $PID
        echo "Killed process on port $PORT"
    else
        echo "   No process found on port $PORT"
    fi
elif command -v netstat &> /dev/null; then
    # Windows (Git Bash)
    netstat -ano | findstr :$PORT | awk '{print $5}' | while read PID; do
        if [ -n "$PID" ] && [ "$PID" != "0" ]; then
            echo "   Found process $PID"
            taskkill //F //PID $PID 2>/dev/null || echo "   Could not kill $PID"
        fi
    done
    echo "Cleared port $PORT"
else
    echo "Unable to find process management tool"
    exit 1
fi
