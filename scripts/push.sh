#!/bin/bash
# Envia alterações do site para GitHub → deploy automático (Pages).
# Uso:
#   bash scripts/push.sh
#   bash scripts/push.sh "mensagem do commit"
# Duplo-clique: ./PUSH

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/bin:$PATH"

MSG="${1:-update site}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERRO: esta pasta não é um repo git."
  exit 1
fi

if ! git config user.email >/dev/null 2>&1; then
  git config user.email "peanutbrain@users.noreply.github.com"
  git config user.name "peanutbrain"
fi

if command -v gh >/dev/null 2>&1; then
  gh auth setup-git 2>/dev/null || true
fi

echo ""
echo "=========================================="
echo "  PUSH SITE → GitHub (tobiasassobiolda.github.io)"
echo "=========================================="
echo ""

echo "[1/4] git add..."
git add -A

if git diff --cached --quiet; then
  echo "  nada novo para commitar."
else
  echo "[2/4] commit: $MSG"
  git commit -m "$MSG"
fi

echo "[3/4] sync remoto (pull --rebase)..."
git pull --rebase origin main

echo "[4/4] push..."
git push origin main

echo ""
echo "OK — GitHub Actions faz o deploy sozinho (~1 min)."
echo "Site: https://tobiasassobiolda.github.io/"
echo "Actions: https://github.com/TobiasAssobioLda/TobiasAssobioLda.github.io/actions"
echo ""
