# Arquitetura do YVA Tools

## Direção

Aplicação client-side com React e TypeScript. O registro de ferramentas é a fonte de metadados para busca, categorias, favoritos e futuras rotas. Cada implementação de ferramenta deve ficar em módulo próprio e ser carregada por sua página ou rota.

## Camadas

- `app`: layout persistente, navegação e roteamento.
- `components`: elementos de interface reutilizáveis.
- `data`: tipos e catálogo central de ferramentas.
- `features/<domínio>`: lógica e interface específica das ferramentas.
- `lib`: persistência e utilidades sem dependência visual.
- Ferramentas de arquivos e programação são carregadas sob demanda. As dependências PDF/ZIP ficam no módulo de arquivos, sem aumentar o bundle inicial da aplicação.

## Persistência e privacidade

Preferências, favoritos e histórico recente ficam no armazenamento local do navegador. Não há backend configurado. Ferramentas futuras devem informar quando um recurso exige rede ou serviço externo e preferir processamento local.

## Adicionar ferramenta

1. Definir metadados em `src/data/tools.ts`, incluindo id único, categoria, descrição, palavras-chave e rota.
2. Criar implementação em `src/features/<domínio>`.
3. Conectar a rota em `src/app/App.tsx` e atualizar os estados vazios/documentação pertinentes.
4. Conferir tipos e build, sem alegar verificações não executadas.
