# Trade1 Web

Site Next.js estático — quadro de **opens** Pipoca + Chill.
Deploy: **GitHub Pages** via Actions (sem Vercel).

URL: https://tobiasassobiolda.github.io/

## Local

```bash
cd web
npm install
# opcional: .env.local
# NEXT_PUBLIC_SITE_PASSWORD=segredo
# NEXT_PUBLIC_OPENS_URL=https://teu-servidor/opens.json
# NEXT_PUBLIC_BASE_PATH=   # vazio em localhost
npm run dev
```

Build de produção (raiz do github.io):

```bash
npm run build
```

## Secrets no GitHub (Settings → Secrets → Actions)

| Secret | Função |
|--------|--------|
| `SITE_PASSWORD` | Password à entrada do site |
| `NEXT_PUBLIC_OPENS_URL` | URL pública do `opens.json` (Kamatera) |

Sem `SITE_PASSWORD` = site sem pass. Sem `OPENS_URL` = sample estático.

## Password

É um ecrã no browser (sessionStorage). Afastas curiosos; **não** é autenticação de servidor. A pass vai no bundle do build — não uses a mesma que emails/bancos.

## Dados reais

O bot grava `data/web/opens.json` no Kamatera. Serve por HTTP e mete essa URL em `NEXT_PUBLIC_OPENS_URL`.
