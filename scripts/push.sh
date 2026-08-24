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
START_TS=$(date +%s)

die() { echo "ERRO: $*" >&2; exit 1; }

# Barra aproximada 0–100 (largura 24)
# Uso: progress PCT "mensagem"
progress() {
  local pct="$1"
  local msg="${2:-}"
  local width=24
  [[ "$pct" -lt 0 ]] && pct=0
  [[ "$pct" -gt 100 ]] && pct=100
  local filled=$((pct * width / 100))
  local empty=$((width - filled))
  local bar=""
  local i
  for ((i = 0; i < filled; i++)); do bar+="█"; done
  for ((i = 0; i < empty; i++)); do bar+="░"; done
  local elapsed=$(( $(date +%s) - START_TS ))
  printf "\r\033[K[%s] %3d%%  %s  (%ds) " "$bar" "$pct" "$msg" "$elapsed"
  if [[ "$pct" -eq 100 ]]; then
    echo ""
  fi
}

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

progress 5 "git add..."
git add -A

if git diff --cached --quiet; then
  progress 20 "nada novo p/ commit"
else
  progress 15 "commit..."
  git commit -m "$MSG" >/dev/null || die "commit falhou"
  progress 25 "commit ok"
fi

progress 35 "fetch + rebase..."
git fetch origin "$BRANCH" >/dev/null 2>&1
if git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
  if ! git pull --rebase origin "$BRANCH" >/dev/null 2>&1; then
    echo ""
    echo "pull --rebase falhou (conflito?)."
    echo "  git status"
    echo "  resolve e: git rebase --continue"
    echo "  ou aborta: git rebase --abort"
    exit 1
  fi
fi
progress 50 "push..."

if ! git push -u origin "$BRANCH" >/dev/null 2>&1; then
  echo ""
  echo "push falhou. Tenta:"
  echo "  gh auth login"
  echo "  gh auth setup-git"
  echo "  bash scripts/push.sh"
  exit 1
fi
progress 55 "push ok — à espera do Actions"

# Espera deploy Pages (~1 min). Barra sobe ~55→98 enquanto corre; 100 no fim.
wait_actions() {
  if ! command -v gh >/dev/null 2>&1; then
    progress 90 "sem gh — assume deploy ~1 min"
    sleep 8
    progress 100 "feito (confirma no browser)"
    return 0
  fi
  if ! gh auth status >/dev/null 2>&1; then
    progress 90 "gh sem auth — assume deploy ~1 min"
    sleep 8
    progress 100 "feito (confirma no browser)"
    return 0
  fi

  # deixa o workflow aparecer
  local run_id=""
  local i
  for i in 1 2 3 4 5 6; do
    run_id="$(gh run list --branch "$BRANCH" --limit 1 --json databaseId,status,conclusion,displayTitle \
      --jq '.[0].databaseId' 2>/dev/null || true)"
    [[ -n "$run_id" && "$run_id" != "null" ]] && break
    progress $((55 + i * 3)) "à procura do workflow..."
    sleep 2
  done

  if [[ -z "$run_id" || "$run_id" == "null" ]]; then
    progress 95 "workflow não encontrado"
    sleep 3
    progress 100 "push ok — confere Actions"
    return 0
  fi

  local max_wait=180
  local waited=0
  local status="queued"
  local conclusion=""
  while [[ $waited -lt $max_wait ]]; do
    status="$(gh run view "$run_id" --json status --jq '.status' 2>/dev/null || echo unknown)"
    conclusion="$(gh run view "$run_id" --json conclusion --jq '.conclusion // empty' 2>/dev/null || true)"

    # 55% → 98% ao longo de ~90s típicos
    local pct=$((55 + waited * 43 / 90))
    [[ $pct -gt 98 ]] && pct=98

    if [[ "$status" == "completed" ]]; then
      if [[ "$conclusion" == "success" ]]; then
        progress 100 "deploy OK"
        return 0
      fi
      echo ""
      echo "Actions falhou ($conclusion). Vê: gh run view $run_id"
      exit 1
    fi

    progress "$pct" "Actions: $status…"
    sleep 3
    waited=$((waited + 3))
  done

  echo ""
  echo "timeout à espera do Actions (run $run_id). Continua no browser."
  progress 100 "push ok — Actions ainda a correr?"
}

wait_actions

TOTAL=$(( $(date +%s) - START_TS ))
echo ""
echo "OK — site actualizado (~${TOTAL}s)."
echo "Abre: $SITE_URL"
echo "(NÃO uses leifshinigami.github.io/trade1-web — site antigo)"
echo ""
