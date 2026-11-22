# Federação · Oráculo 2026

Web app cinematográfica — **React 19 + TypeScript + Vite + WebGL**.
O vidro e o pedestal vêm da referência fotográfica. O shader compõe uma câmara
sem rosto, um retrato independente e dois planos de nevoeiro animado. A pesquisa
de equipas e a simulação dos estados KO−10 / KO−9 / KO−8 continuam na aplicação.

**Sem API real, sem previsões reais, sem autenticação** — tudo é servido por um
motor de demonstração local (`src/oracle/client.ts`) isolado atrás das interfaces
`OracleClient` / `OracleAuth` em `src/oracle/types.ts`. Para ligar ao motor real
basta implementar essas interfaces e trocar o singleton exportado.

## Estrutura

```
src/
  oracle/    contratos + catálogo + motor demo (ponto único de integração)
  fx/        deteção de qualidade/reduced-motion
  scene/     LivingCrystal: composição; Presence: comportamento; chamberShader: luz e fumo
  components/ UI: TopBar, SearchBar, ResultPanel, DemoDock
  App.tsx    máquina de estados idle → consulting → charging → revealed
```

## Qualidade adaptativa

Um triângulo, três texturas WebP, sem pós-processamento. Alvo de 30 fps; a largura
interna tem teto de 480 / 768 / 1024 px consoante o perfil e baixa se a cadência
medida não acompanhar. A cena pausa fora do ecrã ou com o separador escondido.
Com movimento reduzido ou sem WebGL, mostra a câmara vazia sem animação.

## Desenvolver

```bash
npm install
npm run dev
```

Build de produção: `npm run build` → `dist/` (base `/oraculo/`). O deploy é feito
pelo workflow `.github/workflows/pages.yml` que monta `public/` + `dist/` em
`deploy/` e publica no GitHub Pages — a capa fica em `/`, a app em `/oraculo/`.

## Notas

- O dock "DEMO" no canto simula o timing do Oráculo (KO−10/KO−9/KO−8); na versão
  final será o motor real a decidir o estado — desaparece nessa altura.
- As TIPs mostradas são **demonstrativas e determinísticas** — nunca previsões reais.
