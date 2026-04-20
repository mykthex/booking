#!/bin/bash

# Database Corruption Prevention Script
# This script helps prevent SQLite database corruption by checking for existing processes

DB_PATH="./data/db.sqlite3"
PORT=9000

echo "🔍 Checking for existing server processes on port $PORT..."

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port $PORT is already in use!"
    echo "📋 Processes using port $PORT:"
    lsof -i :$PORT -P -n
    
    echo -n "Do you want to kill existing processes? (y/N): "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "🔥 Killing existing processes..."
        lsof -ti:$PORT | xargs -r kill -9
        sleep 2
        echo "✅ Processes killed"
    else
        echo "❌ Cannot start server while port $PORT is in use"
        exit 1
    fi
fi

# Check for processes using database files
echo "🔍 Checking for processes using database files..."
if lsof "$DB_PATH"* 2>/dev/null | grep -q .; then
    echo "⚠️  Found processes using database files:"
    lsof "$DB_PATH"* 2>/dev/null
    
    echo -n "Do you want to kill these processes? (y/N): "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "🔥 Killing database processes..."
        lsof "$DB_PATH"* 2>/dev/null | awk 'NR>1 {print $2}' | xargs -r kill -9
        sleep 2
        echo "✅ Database processes killed"
    fi
fi

# Clean up WAL and SHM files if they exist
if [ -f "${DB_PATH}-wal" ] || [ -f "${DB_PATH}-shm" ]; then
    echo "🧹 Cleaning up WAL and SHM files..."
    rm -f "${DB_PATH}-wal" "${DB_PATH}-shm"
    echo "✅ WAL and SHM files removed"
fi

# Run database integrity check
echo "🔍 Running database integrity check..."
if command -v sqlite3 >/dev/null 2>&1; then
    integrity_result=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;" 2>&1)
    if [ "$integrity_result" = "ok" ]; then
        echo "✅ Database integrity check passed"
    else
        echo "❌ Database integrity check failed: $integrity_result"
        echo "🔧 Running database maintenance..."
        npm run db:maintenance
    fi
else
    echo "⚠️  sqlite3 not found, skipping integrity check"
fi

echo "🚀 Starting server..."
npm start