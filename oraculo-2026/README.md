# Federação · Oráculo 2026

Web app cinematográfica — **React 19 + TypeScript + Vite + Three.js (React Three Fiber)**.
Bola de cristal 3D viva (shaders GLSL, partículas, relâmpagos, bloom), pesquisa de
equipas com sugestões, e simulação dos estados KO−10 / KO−9 / KO−8 com revelação
epic da TIP demonstrativa.

**Sem API real, sem previsões reais, sem autenticação** — tudo é servido por um
motor de demonstração local (`src/oracle/client.ts`) isolado atrás das interfaces
`OracleClient` / `OracleAuth` em `src/oracle/types.ts`. Para ligar ao motor real
basta implementar essas interfaces e trocar o singleton exportado.

## Estrutura

```
src/
  oracle/    contratos + catálogo + motor demo (ponto único de integração)
  fx/        deteção de qualidade/reduced-motion
  scene/     bola de cristal 3D (R3F + shaders + fallback CSS sem WebGL)
  components/ UI: TopBar, SearchBar, ResultPanel, DemoDock
  App.tsx    máquina de estados idle → consulting → charging → revealed
```

## Qualidade adaptativa

Três níveis (`low` / `balanced` / `high`) detetados por hardware
(cores/memória/rede): partículas 350→1600, dpr 1.25→2, bloom só em `high`.
`prefers-reduced-motion` desliga vibração/relâmpagos/parallax e post-fx.
Sem WebGL → orbe CSS equivalente.

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
- WebGL2/WebGL com fallback CSS. WebGPU fica para iteração futura.
