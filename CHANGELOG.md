# Alterações

## 2026-10-27 — catálogo de ícones e README

- Expandido o catálogo do Kit Web de 10 para 179 ícones Lucide, com busca por nome e cópia de importações exatas.
- Adicionado gerador de README Markdown com prévia, cópia e download.
- Kit Web movido para carregamento sob demanda. Checks: typecheck e build passaram, 55 testes passaram e conferência manual a 375 px.

## 2026-10-27 — responsividade e complementos locais

- Melhorada a leitura em telas estreitas, removida a rolagem horizontal em 320 px e reforçados os estados de foco ciano.
- No visualizador de mídia, adicionados download da imagem original, controle de velocidade de vídeo e exportação de quadro como PNG.
- Adicionados pesquisador de datasheets por CI e buscador de esquemas/manuais por fabricante, modelo e placa; as consultas externas não validam o documento.
- Adicionados caderno local de bancada, calculadora de sub-redes IPv4, tempo de transferência e tamanho estimado de vídeo.
- Parte 11 (PWA) permanece adiada enquanto as lacunas funcionais são tratadas.
- Checks: TypeScript passou, 54 testes passaram e build de produção passou; conferência manual no navegador em 320 px e 375 px.

## 2026-10-27 — início da Parte 10

- Adicionados temporizador Pomodoro, lista de tarefas e cartões de estudo com armazenamento local.
- Checks: 50 testes passaram; typecheck e build passaram.

## 2026-10-27 — formatador e mídia

- Tornado explícito o fluxo de formatação: instruções, ação, resultado em área própria e botão para reutilizar o resultado.
- Iniciada Parte 9 com prévia local de imagem/áudio/vídeo e dados básicos de mídia.
- Checks: 47 testes passaram; typecheck e build passaram.

## 2026-10-27 — Kit Web e Parte 8

- Melhoradas as abas do Kit Web como cartões selecionáveis com realce de estado; ícones Lucide agora aparecem no catálogo.
- Adicionados gerador local de QR Code PNG e painel de status de conectividade.
- Checks: 45 testes passaram; typecheck/build passaram; geração QR validada via Node.

## 2026-10-27 — pendências prioritárias

- Concluídas as ferramentas prioritárias das Partes 3, 5 e 6: kit web, recorte/proporção, prévia PDF, preservação de subpastas ZIP, prévia CSV e dados fictícios ampliados.
- Atualizado React Router para 7.18.4; auditoria automática da instalação reportou zero vulnerabilidades.
- Checks: 42 testes passaram; typecheck e build passaram.

## Parte 7 — utilidades iniciais

- Adicionadas calculadora de porcentagem/desconto/acréscimo, regra de três direta, IMC e conversor de unidades.
- Adicionados calculadora de média/mediana/amplitude, divisor de conta com gorjeta e calculadora de diferença entre datas.
- Adicionados testes para cálculos e entradas inválidas; suíte (37 testes), typecheck e build passaram.

## 2026-10-26

- Renomeada a identidade visual de NEXUS TOOLS para YVA Tools.
- Redesenhados os temas escuro e claro com acento ciano e contraste reforçado; o escuro segue como padrão.
- Implementada Parte 2: busca por teclado e sinônimos, favoritos, histórico, preferência de texto maior e backup JSON de dados locais.
- Adicionados cinco testes de interface e persistência. Corrigido o uso de `window.location` nas páginas individuais para respeitar navegação do React Router.
- Implementado o bloco prioritário da Parte 3: ferramentas de cor e CSS, JSON, Base64 UTF-8, UUID v4 e playground isolado. Adicionados oito testes para essas ferramentas.
- Refinado o tema escuro com sombras ciano suaves e brilho neon discreto; atualizada a paleta inicial do gerador.
- Implementada a Parte 4: quatro ferramentas da bancada de eletrônica, com unidades e validações.
- Implementado o bloco de arquivos da Parte 5: ZIP, conversão de imagens, PDF, CSV/JSON, conversores, comparador e identificador local.
- Melhorados os estilos de botões e o caminho de retorno de uma ferramenta para sua categoria e depois para o início.
- Parte 5 verificada com 23 testes em 4 arquivos; incluídos testes de compactação/extração ZIP e bloqueio de caminhos inseguros.
- Incluídos conversores de texto, bases, unidades e tamanhos de arquivos; o módulo de arquivos carrega sob demanda para manter o início mais leve.
- Implementado o bloco prioritário da Parte 6: bases numéricas, URL, contador de texto, SHA-2, senhas/frases-senha, analisador local de força e URL, tokens, dados fictícios, ASCII e Markdown com prévia escapada.
- Renovado o acabamento visual do tema escuro com contraste ciano forte, camadas tecnológicas e estados de foco e hover mais visíveis.
- Verificações da Parte 6: 30 testes passaram, TypeScript passou e a compilação de produção passou.
