# Trade1 Web (Vercel)

Site Next.js / TSX — quadro de **opens** Pipoca + Chill.
Telegram fica para entradas/alertas; isto é só consulta.

## Local

```bash
cd web
npm install
npm run dev
```

Abre http://localhost:3000 — usa `public/opens.sample.json` se não houver URL.

## Dados reais

O bot grava `data/web/opens.json` a cada report (30 min) no Kamatera.

1. Serve esse JSON por HTTP (nginx no VPS, ou path público).
2. Na Vercel → Environment Variables:

```
NEXT_PUBLIC_OPENS_URL=https://TEU-DOMINIO-OU-IP/opens.json
```

Sem essa var = sample estático (demo).

## Deploy Vercel

1. Repo GitHub só com esta pasta **ou** monorepo com Root Directory = `web`
2. Import project na Vercel → Framework: Next.js
3. Deploy. Depois: mudanças de UI = `git push` (auto). Opens = o bot actualiza o JSON (sem redeploy).

## Não vai para o Kamatera

`scripts/deploy.sh` exclui `web/node_modules` e o site em si não precisa no VPS — só o JSON em `data/web/`.
