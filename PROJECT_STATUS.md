# Estado do YVA Tools

- Antes de iniciar o PWA, foi feita revisão visual em celulares de 320 px e 375 px. O PWA permanece adiado enquanto as lacunas funcionais são concluídas.
- Visualizador de mídia agora inclui download da imagem original, controle de velocidade de vídeo e captura do quadro atual em PNG.
- Módulo de eletrônica também oferece consultas de datasheets por CI e de esquemas por fabricante/modelo/placa; os resultados externos não são validados pelo app.
- O PWA está temporariamente adiado até a conclusão das lacunas e da revisão responsiva.
- Acrescentados caderno de bancada salvo no dispositivo, calculadora de sub-redes IPv4 e estimadores de transferência/gravação de vídeo.

## Funcionalidades

- Aplicação React/TypeScript/Vite com temas ciano claro/escuro, navegação, busca, favoritos, histórico e configurações locais.
- Ferramentas das Partes 3–10 (blocos parciais): desenvolvimento web, programação, eletrônica, arquivos, utilidades, QR local, status de conexão e mídia, Pomodoro, lista de tarefas e cartões de estudo. A lista detalhada está em `docs/PROGRESS.md`.
- React Router 7.18.4; a auditoria da instalação reportou zero vulnerabilidades.

## Limitações e próximos passos

- Partes 8–10 iniciadas. Parte 11 (PWA, privacidade, desempenho e revisão final) continua no roteiro.
- O gerador QR já existente do usuário não foi integrado por falta do código/endereço; o site dispõe de gerador local próprio.
- Formatadores/minificadores de código são heurísticos e podem precisar de parsers dedicados para casos complexos.
- Revisão visual manual e CI permanecem para a etapa de acabamento.

## Executar

```sh
npm install
npm run dev
```

Verificar com `npm test`, `npm run typecheck` e `npm run build`.
