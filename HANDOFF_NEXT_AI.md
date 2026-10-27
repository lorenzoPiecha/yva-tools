# YVA Tools — guia para a próxima IA

## Continuação mais recente — 2026-10-27

Foram adicionadas ferramentas RC, 555, LM317, AWG, pinouts e prefixos SI; remover EXIF via regravação em Canvas, recorte de imagem e regravação estrutural de PDF (sem promessa de redução); decodificação JWT sem validar assinatura; MD5/SHA-1/SHA-512; regex com realce ao vivo; CPF/CNPJ de teste; categoria Rede separada de Calculadoras; cards sem o selo genérico PRONTA; relacionados e sugestão/compartilhamento.

Checks desta continuação: `npm run typecheck`, `npm test -- --reporter=dot` (71 testes em 11 arquivos), `npm run build` passaram. Não foi feita inspeção visual manual. O primeiro teste após renomear a ação de backup falhou por seletor desatualizado; o teste foi atualizado para os rótulos novos e passou integralmente.

As recomendações relacionadas incluem atalhos explícitos para conversores semelhantes e para pesquisador de CI, identificador de componentes e buscador de esquemas.

Pendências conhecidas: padronizar botões de copiar em todas as ferramentas, revisão visual dos novos formulários nos dois temas. PWA continua adiado pelo usuário. Veja `TASKS.md` e o início de `docs/PROGRESS.md`.

Atualizado em 27/10/2026. Leia este arquivo junto com `AGENTS.md`, `README.md`, `PROJECT_STATUS.md`, `TASKS.md` e `docs/PROGRESS.md` antes de alterar o projeto.

## Objetivo e regras de colaboração

O YVA Tools é um site em português com ferramentas locais para desenvolvimento web, programação, eletrônica, arquivos, rede/utilidades e produtividade/estudos. O usuário quer continuar acrescentando e refinando recursos em etapas, preservando o app existente.

- Não recrie o projeto do zero; trabalhe na estrutura atual.
- Preserve arquivos e dados. Evite comandos destrutivos.
- `sources/` é material de referência sincronizado: nunca editar, mover, renomear ou excluir seus arquivos.
- O usuário pediu para deixar o PWA para depois. Não inicie a etapa PWA sem ele voltar a pedir.
- Interface e mensagens devem continuar em português brasileiro, com marca **YVA Tools**.
- Prefira processamento local; deixe explícito quando uma ferramenta abre busca externa ou depende do navegador.
- Componentes eletrônicos só podem ser identificados como correspondência confirmada quando o catálogo tiver uma entrada exata; não invente pinagem, equivalência ou diagnóstico.

## Como executar

Na pasta raiz deste projeto, com dependências instaladas:

```bash
npm run dev
```

Endereços e verificações do projeto:

```bash
npm run typecheck
npm test -- --reporter=dot
npm run build
```

`npm test` executa Vitest. Ao relatar checks, diga exatamente quais comandos foram rodados nesta continuação. Não trate checks de compilação como testes de interface visual.

## Stack e arquitetura

- React 18, TypeScript, Vite, Tailwind, React Router e Lucide.
- `src/data/tools.ts`: catálogo central de nomes, categorias, palavras-chave, ícones e caminhos.
- `src/app/App.tsx`: layout, pesquisa, favoritos, histórico, configurações e distribuição das rotas por grupos de ferramentas.
- `src/features/`: implementação separada por categoria.
- `src/lib/storage.ts`: persistência de preferências.
- `src/styles.css`: tema, layout e responsividade globais.
- `docs/ARCHITECTURE.md`, `docs/PROGRESS.md`, `TASKS.md`: arquitetura, progresso e pendências.

Ao adicionar uma ferramenta, registre-a no catálogo, encaminhe o slug no grupo de rota correto no `App.tsx` e adicione o caso no componente da categoria. Confira também palavras de busca/sinônimos e responsividade.

## Estado atual conhecido

Além das ferramentas anteriores descritas em `docs/PROGRESS.md`, esta sessão adicionou:

- **Eletrônica:** divisor de tensão ideal, com estimativa de tensão de saída, corrente e dissipação dos resistores.
- **Eletrônica:** leitura de resistores de 4/5/6 faixas e cálculo de capacitores equivalentes em série/paralelo.
- **Arquivos:** conversor de imagem para PDF, com múltiplas imagens em páginas A4 na ordem selecionada.
- **Rede e utilidades:** porcentagem reversa (valor original antes de acréscimo/desconto) e conversor de timestamp Unix (segundos/milissegundos, data local e ISO UTC).
- Armazenamento local mais tolerante a dados malformados e bloqueio do navegador; importação do backup tenta restaurar dados anteriores se uma gravação falhar.
- O menu móvel fecha com Escape e informa seu estado; cor da barra e título da aba acompanham a tela/tema.

Na rodada atual, typecheck e build passaram e `npm test -- --reporter=dot` passou com 66 testes em 11 arquivos. Ainda não foi feita inspeção visual manual desta rodada.

## Próximas ideias não implementadas (prioridade sugerida)

1. Eletrônica: calculadora de autonomia de bateria; ampliar decodificadores com referências cuidadosamente verificadas.
2. Programação: conversor JSON↔YAML/TOML e conversor de timestamps já foi implementado em utilidades.
3. Desenvolvimento web: gerador de variáveis CSS, auditor simples de contraste/acessibilidade, gerador de favicon e otimizador SVG.
4. Arquivos: extrair intervalos de páginas de PDF, renomear arquivos em lote e comparar textos extraídos de PDFs.
5. Rede/utilidades: IPv6 CIDR e fuso horário usando APIs nativas de data/Intl, documentando limites de horário de verão.
6. Produtividade: planejador semanal, rastreador de hábitos e cronômetro associado a tarefas.

Escolha poucas ferramentas por rodada para manter o escopo testável. Não tente implementar a lista inteira de uma vez. Revise `TASKS.md` e este arquivo após cada bloco; anote limitações reais e checks executados.

## Limitações relevantes já conhecidas

- O catálogo de componentes eletrônicos é pequeno e não lê inscrições por OCR. Buscas externas não são resultados validados.
- O mapa de placa guarda a foto apenas durante a sessão; as marcações podem ser exportadas separadamente.
- O conversor de imagens depende dos formatos de Canvas aceitos pelo navegador.
- Alguns formatadores do Kit Web são heurísticos, não substituem parsers completos.
- O painel de conectividade não é um teste de velocidade de internet.
- O PWA continua adiado por pedido do usuário.
