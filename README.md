# YVA Tools

Central pessoal de ferramentas para desenvolvimento web, programação, eletrônica, arquivos e tarefas do dia a dia. A experiência deve ser rápida, responsiva, sem anúncios próprios e priorizar processamento no navegador para preservar a privacidade.

## Regras do projeto

- Trate `sources/` como referência somente leitura; nunca edite, renomeie ou remova seus arquivos.
- Prefira ferramentas que executem localmente no navegador e explique limites de recursos que dependam de serviços externos.
- Mantenha ferramentas isoladas em módulos e cadastradas no registro central (`src/data/tools.ts`).
- Preserve acessibilidade, navegação por teclado, interface em português brasileiro e suporte a telas pequenas.
- Não declare verificações que não foram executadas. Atualize `docs/PROGRESS.md` ao concluir cada etapa.
- Evite comandos destrutivos e não inclua segredos no repositório.

## Tecnologias

React 18, TypeScript, Vite, Tailwind CSS, React Router e Lucide. `fflate` e `pdf-lib` são carregadas somente na área de arquivos. Preferências e favoritos são armazenados no `localStorage` deste navegador.

## Personalização

O tema escuro é o padrão e usa acentos ciano; o tema claro mantém o mesmo acento com contraste reforçado. Busca, favoritos, histórico e preferências de leitura ficam no dispositivo. As configurações podem ser exportadas ou importadas em JSON.

## Início

Requer Node.js compatível com Vite 6 e npm.

```sh
npm install
npm run dev
```

Comandos de verificação: `npm run typecheck` e `npm run build`.
Testes de interface: `npm test`.

## Estrutura

- `src/app`: shell, rotas e páginas.
- `src/components`: componentes compartilhados.
- `src/data/tools.ts`: registro central de ferramentas.
- `src/features`: funcionalidades por domínio.
- `docs/`: arquitetura e andamento.

## Próximos blocos

Consulte `docs/PROGRESS.md`. A sequência planejada inclui desenvolvimento web, eletrônica, arquivos, programação, utilidades, rede/QR, mídia e produtividade, seguida de PWA, privacidade, desempenho e validação final.
