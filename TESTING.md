# Verificações

## Verificação atual — catálogo e README (2026-10-27)

- TypeScript: passou.
- Vitest: 55 testes passaram em 10 arquivos.
- Build de produção: passou; bundle inicial 302,54 kB (92,70 kB gzip); Kit Web carregado sob demanda em chunk separado de 72,15 kB (17,11 kB gzip).
- Conferência manual do catálogo/pesquisa e do gerador de README em 375 px.

## Comandos

- `npm test` — suíte Vitest com jsdom e Testing Library.
- `npm run typecheck` — verificação TypeScript.
- `npm run build` — compilação de produção.

## Última execução — 2026-10-27

- Testes: 50 passaram em 10 arquivos; cobrem ferramentas das Partes 3–10, incluindo fluxo de formatação, QR, mídia, Pomodoro, tarefas/cartões, hash por arquivo e ZIP com pastas.
- Typecheck: passou com React Router 7.18.4.
- Build: passou; bundle inicial 296,05 kB (91,29 kB gzip), arquivos 471,99 kB (193,13 kB gzip), programação 21,85 kB (7,48 kB gzip), rede/QR 30,40 kB (11,91 kB gzip), mídia 4,64 kB (1,86 kB gzip), produtividade 8,41 kB (2,87 kB gzip), CSS inicial 42,07 kB (9,31 kB gzip).
- Auditoria: durante a instalação do roteador atualizado, npm reportou zero vulnerabilidades. A chamada isolada posterior falhou por conexão ao endpoint.
- Geração QR conferida por execução Node; produziu PNG Base64 válido.
- Revisão manual no navegador/CI: não executadas/configuradas.
