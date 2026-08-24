#!/bin/bash
# Envia alterações do site para GitHub → deploy automático (Pages).
# Uso:
#   bash scripts/push.sh
#   bash scripts/push.sh "mensagem do commit"
# Duplo-clique: ./PUSH  (abre terminal)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

MSG="${1:-update site}"
SITE_URL="https://tobiasassobiolda.github.io/"
BRANCH="main"

die() { echo "ERRO: $*" >&2; exit 1; }

echo ""
echo "=========================================="
echo "  PUSH SITE → GitHub"
echo "  pasta: $ROOT"
echo "  URL:   $SITE_URL"
echo "=========================================="
echo ""

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || die "esta pasta não é um repo git ($ROOT)"

# identidade local só neste repo (não mexe no git config global)
if ! git config --local user.email >/dev/null 2>&1; then
  git config --local user.email "peanutbrain@users.noreply.github.com"
  git config --local user.name "peanutbrain"
fi

# HTTPS + gh: evita password popup partido
if command -v gh >/dev/null 2>&1; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "AVISO: gh não autenticado. Corre: gh auth login"
  else
    gh auth setup-git 2>/dev/null || true
  fi
fi

REMOTE="$(git remote get-url origin 2>/dev/null || true)"
[[ -n "$REMOTE" ]] || die "sem remote origin"
echo "remote: $REMOTE"
echo ""

echo "[1/4] git add..."
git add -A

if git diff --cached --quiet; then
  echo "  nada novo para commitar."
else
  echo "[2/4] commit: $MSG"
  git commit -m "$MSG" || die "commit falhou"
fi

echo "[3/4] sync remoto (fetch + rebase)..."
git fetch origin "$BRANCH"
if git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
  if ! git pull --rebase origin "$BRANCH"; then
    echo ""
    echo "pull --rebase falhou (conflito?)."
    echo "  git status"
    echo "  resolve e: git rebase --continue"
    echo "  ou aborta: git rebase --abort"
    exit 1
  fi
fi

echo "[4/4] push..."
if ! git push -u origin "$BRANCH"; then
  echo ""
  echo "push falhou. Tenta:"
  echo "  gh auth login"
  echo "  gh auth setup-git"
  echo "  bash scripts/push.sh"
  exit 1
fi

echo ""
echo "OK — GitHub Actions a fazer deploy (~1 min)."
echo "Abre: $SITE_URL"
echo "Runs:  gh run list --limit 3"
echo "(NÃO uses leifshinigami.github.io/trade1-web — site antigo)"
echo ""
