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

if ! git config --local user.email >/dev/null 2>&1; then
  git config --local user.email "peanutbrain@users.noreply.github.com"
  git config --local user.name "peanutbrain"
fi

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

SHA="$(git rev-parse HEAD)"
SHORT="${SHA:0:7}"
progress 55 "push ok — Actions p/ $SHORT"

# Espera o run DESTE commit (não o deploy anterior já concluído).
wait_actions() {
  if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
    progress 80 "sem gh — espera CDN ~45s"
    sleep 45
    progress 100 "feito — abre link com ?v="
    return 0
  fi

  local run_id=""
  local i status conclusion
  for i in $(seq 1 20); do
    run_id="$(gh run list --branch "$BRANCH" --limit 8 \
      --json databaseId,headSha,status,conclusion \
      --jq ".[] | select(.headSha==\"$SHA\") | .databaseId" 2>/dev/null | head -1 || true)"
    if [[ -n "$run_id" && "$run_id" != "null" ]]; then
      break
    fi
    progress $((55 + i)) "à procura do run $SHORT…"
    sleep 3
  done

  if [[ -z "$run_id" || "$run_id" == "null" ]]; then
    progress 85 "run não apareceu — espera CDN"
    sleep 40
    progress 100 "push ok — confere Actions"
    return 0
  fi

  local max_wait=240
  local waited=0
  while [[ $waited -lt $max_wait ]]; do
    status="$(gh run view "$run_id" --json status --jq '.status' 2>/dev/null || echo unknown)"
    conclusion="$(gh run view "$run_id" --json conclusion --jq '.conclusion // empty' 2>/dev/null || true)"

    local pct=$((55 + waited * 40 / 120))
    [[ $pct -gt 95 ]] && pct=95

    if [[ "$status" == "completed" ]]; then
      if [[ "$conclusion" == "success" ]]; then
        progress 96 "deploy OK — CDN a propagar…"
        # GitHub Pages / browser ainda podem servir HTML antigo uns segundos
        sleep 12
        progress 100 "no ar ($SHORT)"
        return 0
      fi
      if [[ "$conclusion" == "cancelled" ]]; then
        progress 60 "run cancelado — à procura do novo…"
        sleep 4
        run_id="$(gh run list --branch "$BRANCH" --limit 8 \
          --json databaseId,headSha,status \
          --jq ".[] | select(.headSha==\"$SHA\") | .databaseId" 2>/dev/null | head -1 || true)"
        waited=0
        continue
      fi
      echo ""
      echo "Actions falhou ($conclusion). Vê: gh run view $run_id"
      exit 1
    fi

    progress "$pct" "Actions: $status…"
    sleep 4
    waited=$((waited + 4))
  done

  echo ""
  echo "timeout Actions (run $run_id). Continua no browser."
  progress 100 "push ok — Actions ainda a correr?"
}

wait_actions

TOTAL=$(( $(date +%s) - START_TS ))
BUST_URL="${SITE_URL}?v=${SHORT}&t=$(date +%s)"
echo ""
echo "OK — site actualizado (~${TOTAL}s) · build $SHORT"
echo "Abre ESTE link (fura cache do browser):"
echo "  $BUST_URL"
echo "(NÃO uses leifshinigami.github.io/trade1-web — site antigo)"
echo ""
