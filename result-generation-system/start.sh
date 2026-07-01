#!/usr/bin/env bash
# start.sh — Quick start for the RGS frontend
set -e

echo "═══════════════════════════════════════════"
echo "  RGS Frontend — starting"
echo "═══════════════════════════════════════════"

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

echo "✅ Starting frontend on http://localhost:3000"
echo "   API calls proxy to http://localhost:4000 via Next.js rewrites"
npm run dev
