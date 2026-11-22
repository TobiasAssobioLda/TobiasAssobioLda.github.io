# tobiasassobiolda.github.io

Site estático servido via GitHub Pages.

URL: https://tobiasassobiolda.github.io/

- `public/` — capa de entrada (`index.html` + `capa/`) e `main.html` (redirect
  para o Oráculo). O botão OK da capa abre `/oraculo/`.
- `oraculo-2026/` — código-fonte da web app **Federação Oráculo 2026**
  (React 19 + TypeScript + Vite + R3F). Ver o README da pasta.

Deploy automático em cada push para `main`: o workflow `pages.yml` compila a app
Vite, junta `public/` + `oraculo-2026/dist/` e publica o artifact.
Alterações apenas a ficheiros `*.json` não disparam deploy (dados publicados
por automação externa).
