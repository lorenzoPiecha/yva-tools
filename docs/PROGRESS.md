# Progresso do projeto

Última atualização: 2026-10-27

## Arquivos — conversor de imagem para PDF

- Adicionada ferramenta dedicada que converte de 1 a 30 imagens para um PDF, uma imagem por página A4, respeitando a ordem selecionada e orientação retrato/paisagem.
- JPEG/PNG são incorporados diretamente; outros formatos de imagem aceitos pelo navegador são desenhados em Canvas antes da inclusão. Limites: 25 MB por arquivo, 100 MB por lote e 40 megapixels por imagem.
- Typecheck e build passaram; `npm test -- --reporter=dot`: 66 testes aprovados em 11 arquivos. Foi coberta a validação de lote e presença da ferramenta via rota; não houve teste visual manual.

## Eletrônica — componentes passivos

- Adicionadas leitura de resistor por 4/5/6 faixas com valor, tolerância e coeficiente térmico de resistores de 6 faixas.
- Adicionado cálculo de capacitância equivalente em série e paralelo com entradas em µF.
- Cobertos por testes os cálculos e alguns casos inválidos. Typecheck, 64 testes em 11 arquivos e build de produção passaram; bundle inicial 334,54 kB (101,26 kB gzip).

## Bloco curto de ferramentas — 2026-10-27

- Divisor de tensão estima saída, corrente e dissipação com resistores ideais, incluindo aviso sobre o efeito de carga externa.
- Porcentagem reversa recupera valor-base após acréscimo ou desconto e rejeita desconto igual/superior a 100%.
- Conversor Unix cobre segundos/milissegundos, data/hora local e ISO UTC.
- Criado `HANDOFF_NEXT_AI.md`, com arquitetura, salvaguardas, como executar e ideias futuras priorizadas.
- `npm run typecheck` e `npm run build` passaram. Testes e revisão visual não foram feitos nesta rodada.

## Revisão geral e melhorias — 2026-10-27

- Preferências locais agora tratam armazenamento indisponível e dados corrompidos sem impedir a abertura do app; importação de backup valida tudo e tenta restaurar os valores anteriores se a gravação falhar. Favoritos permanecem utilizáveis durante a sessão mesmo sem persistência.
- Menu móvel informa seu estado por acessibilidade e fecha com Escape; a cor da barra do navegador acompanha o tema e o título da aba indica a ferramenta atual.
- Verificações nesta revisão: `npm run typecheck` e `npm run build` passaram. A suíte de testes não foi executada nesta rodada; última execução registrada antes desta revisão: 62 testes aprovados. Não foi feita inspeção visual manual nesta rodada.

## Atualização — novas ferramentas solicitadas

- Identificador de componentes aceita códigos e nomes de um catálogo local inicial (LM358, NE555, UC3842, TL431, LM317), traz links oficiais de produto/datasheet e oferece busca externa sem apresentar resultados desconhecidos como identificação certa.
- Leitor SMD converte códigos de resistor de 3/4 dígitos e formato R decimal, além de capacitores de 3 dígitos; comunica que tolerância, tensão e convenções de fabricante precisam ser conferidas.
- Mapa de placa permite selecionar foto local, posicionar/remover anotações e exportar os marcadores como JSON; a foto não persiste após sair da página.
- Roteiro guiado organiza uma triagem inicial, com checklist e alertas de segurança, sem diagnosticar nem pedir medições energizadas.
- Orçamento estima peças, horas, taxa, outros custos e acréscimo; histórico de bancada exporta fichas em PDF junto com o backup JSON.
- Conversor JSON→TypeScript infere tipos da amostra; conversor de imagens em lote limita quantidade/tamanho/dimensões, gera ZIP e usa formatos suportados pelo navegador.
- Testes finais: `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 62 testes em 11 arquivos; `npm run build` passou sem aviso de chunk acima de 500 kB. Bundle inicial: 320,88 kB (97,71 kB gzip); PDF sob demanda: 437,03 kB (180,60 kB gzip); arquivos: 44,04 kB (15,97 kB gzip).

## Implementado

- Kit Web ampliado: 179 ícones Lucide conferidos com as exportações do pacote instalado, pesquisa por nome exato e cópia do import; gerador de README Markdown com prévia, cópia e download.
- Kit Web passou a carregar sob demanda: chunk 72,15 kB (17,11 kB gzip), preservando o bundle inicial em 302,54 kB (92,70 kB gzip).
- Nova conferência manual em 375 px: pesquisa por `Wifi` retorna o único ícone esperado; README e controles aparecem no celular.

- Revisão de responsividade: conferida visualmente em viewport de 375 px e 320 px, incluindo a página Lei de Ohm; removida a rolagem horizontal em 320 px e ampliada a legibilidade dos cartões até 390 px.
- Mídia: visualizador permite baixar a imagem original, mudar a velocidade de reprodução do vídeo (0,5×–2×) e salvar o quadro atual como PNG. O processamento permanece local no navegador.
- Tema e acessibilidade: acento ciano aplicado ao estado CSS inicial e foco mais visível no tema claro.
- Novas ferramentas locais: calculadora IPv4/CIDR, estimador de tempo de transferência e espaço de vídeo; caderno de bancada com armazenamento local e exportação JSON.
- Revisão manual adicional em viewport 320 px: pesquisador de CIs e caderno de bancada, sem rolagem horizontal.

- Partes 0–2: base React + TypeScript + Vite + Tailwind + React Router + Lucide; identidade YVA Tools; temas claro/escuro; layout responsivo, rotas, catálogo de ferramentas, busca, favoritos, histórico, preferências e backup local.
- Parte 3: cores, contraste, CSS, playground isolado, JSON/Base64/UUID e kit web com formatação HTML/CSS/JS heurística, minificação, regex em Web Worker com limite de tempo, metatags, snippets Flexbox/Grid e catálogo de pilhas de fontes/ícones Lucide.
- Parte 4: Lei de Ohm, resistores série/paralelo, resistor para LED e consumo elétrico. Ampliada com pesquisador de CIs (consultas em TI, ST, Microchip, onsemi, NXP, Renesas e Infineon) e buscador de esquemas/manuais por fabricante, modelo, placa/fonte e CI. Abrem buscas externas e não alegam validar resultados; incluído link oficial do TI UC3842 como referência.
- Parte 5: ZIP, conversão de imagens, recorte central 1:1/4:3/16:9/3:4, união/ordenação/rotação e prévia embutida de PDF, CSV↔JSON com prévia tabelar (até 100 linhas), conversores, comparador e identificação de arquivos. Extração ZIP gera outro ZIP preservando os caminhos relativos, em vez de escrever direto no dispositivo.
- Parte 6: URL, bases numéricas, texto, SHA-2 em texto/arquivo, senhas, avaliação local, tokens, dados fictícios (nome, e-mail reservado, telefone fictício, cidade, empresa e área), ASCII e Markdown seguro.
- Parte 7: porcentagem, regra de três, IMC, conversor de unidades, média/mediana/amplitude, divisor de conta com gorjeta e diferença entre datas.
- Parte 8 inicial: gerador de QR Code PNG com controles e processamento local; painel de conectividade com eventos online/offline e métricas opcionais do navegador.
- Kit Web: fluxo Formatar/Minificar agora tem instruções curtas, botão explícito, campo de resultado separado, estado de resultado inalterado e ação para substituir a entrada.
- Parte 9 inicial: visualizador local de imagem, áudio e vídeo com reprodução/prévia, tamanho, tipo e metadados disponibilizados pelo navegador.
- Parte 10 inicial: temporizador Pomodoro configurável, lista de tarefas persistida no dispositivo e cartões de estudo com revisão frente/verso, também persistidos localmente.
- Kit Web refinado com cartões de navegação destacados e ícones Lucide renderizados no catálogo.
- React Router atualizado para 7.18.4 para corrigir as vulnerabilidades reportadas na versão anterior.

## Verificações executadas

- Última revisão manual: início em 375 px, início em 320 px e página de Lei de Ohm em 320 px. Sem barra horizontal após a correção; modo claro e outros formulários ainda precisam de revisão visual manual.

- `npm run typecheck`: passou.
- Checks finais: `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 54 testes em 10 arquivos; `npm run build` passou. Bundle inicial 312,33 kB (95,86 kB gzip); arquivos 471,99 kB (193,13 kB gzip); programação 21,85 kB (7,48 kB gzip); rede/QR 30,40 kB (11,91 kB gzip); mídia 6,71 kB (2,53 kB gzip); produtividade 8,41 kB (2,87 kB gzip); CSS inicial 45,03 kB (9,88 kB gzip).
- A instalação do React Router atualizado informou zero vulnerabilidades. Execução isolada de `npm audit --omit=dev` falhou por conexão ao endpoint do npm. Geração QR validada em Node: saída PNG Base64.

## Verificação atual — 2026-10-27

- `npm run typecheck`: passou.
- `npm test -- --reporter=dot`: 55 testes passaram em 10 arquivos.
- `npm run build`: passou. Bundle inicial 302,54 kB (92,70 kB gzip); Kit Web sob demanda 72,15 kB (17,11 kB gzip); arquivos 471,24 kB (192,98 kB gzip); CSS inicial 45,05 kB (9,86 kB gzip).
- Conferência manual do catálogo e gerador README em 375 px.

## Limitações e próximas etapas

- Os formatadores/minificadores HTML/CSS/JS são heurísticos; código complexo deve ser revisado. Um parser dedicado é melhoria futura.
- Parte 8 está iniciada; painel de conexão não mede velocidade nem confirma acesso a sites. Um teste real exige endpoint escolhido; não foi simulado. Parte 9 está iniciada; o navegador determina formatos reproduzíveis e edição/transcodificação avançada continua pendente. A pesquisa de CIs/esquemas monta consultas externas, mas não coleta nem valida documentos. O catálogo de componentes e os decodificadores SMD cobrem apenas padrões explicitamente listados; OCR de placas, comparação automática de equivalentes e biblioteca técnica ampla continuam pendentes. O mapa é temporário e não guarda a imagem. Parte 10 está iniciada; outras ferramentas podem ser acrescentadas. Parte 11 (PWA) foi adiada a pedido do usuário. O gerador QR existente do usuário não foi integrado (código/endereço não fornecido); o YVA tem gerador local próprio.
- Revisão manual em celular foi executada nos tamanhos listados; revisar tema claro e demais formulários. CI ainda não configurada.
# Atualização — ferramentas solicitadas e organização — 2026-10-27

- Eletrônica: filtro RC, timer 555 astável/monoestável, estimador LM317, tabela AWG 10–30, pinouts de referência e conversor de prefixos SI.
- Arquivos: remoção de metadados por regravação Canvas, recorte dedicado e regravação estrutural de PDF. O compressor de PDF não rasteriza nem garante redução do tamanho.
- Programação: decodificador JWT (sem validar assinatura), MD5/SHA-1/SHA-512 além dos hashes anteriores, e destaque de regex ao vivo com limite/worker existentes.
- Utilidades: geração e validação matemática de CPF/CNPJ para dados de teste, sem consulta ou emissão de documentos reais.
- Navegação: categoria Rede e utilidades foi dividida em Calculadoras e Rede; os cards substituem o selo genérico PRONTA por estados de processamento/localidade; páginas de ferramenta ganharam recomendações relacionadas.
- Interface: largura e textos pequenos ajustados; botão para sugerir/compartilhar ideias; nomes do backup deixam claro que inclui favoritos e recentes.
- Verificação desta rodada: `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 71 testes em 11 arquivos; `npm run build` passou. Busca no código confirmou que não restam os rótulos “Rede e utilidades” ou “PRONTA”. Não foi feita inspeção visual manual nesta rodada.
- Relacionadas agora também fazem ligação explícita entre conversores semelhantes e as pesquisas de CI, componentes e esquemas.
- Pendências: ainda falta uniformizar todos os botões de cópia entre ferramentas. PWA permanece adiado conforme pedido anterior.

## Menu e preparação para Netlify — 2026-10-27

- Menu lateral: configurações ficam no rodapé fixo; navegação de categorias pode rolar independentemente, evitando que o item desapareça em telas menores.
- Removida anteriormente a ação de pedir/sugerir ideias a amigos, conforme solicitação.
- Adicionado `public/_redirects` para servir a aplicação React em URLs de rotas internas no Netlify.
- Verificações desta revisão: `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 86 testes em 14 arquivos; `npm run build` passou. Confirmado que `dist/_redirects` é incluído no build.
- O usuário publicou o projeto pelo GitHub e Netlify; endereço mostrado: `https://yvatools.netlify.app`.

## Identidade visual — logo e ícone — 2026-10-27

- Adicionada a imagem fornecida em `public/yva-tools-icon.png`, aplicada à marca do menu lateral e configurada como favicon e ícone Apple.
- Criado `public/manifest.webmanifest` com nome, cores, ícone 512×512 e modo de abertura standalone. Isso configura a identidade de instalação; não adiciona suporte offline/service worker.
- Verificações após esta mudança: `npm run typecheck` passou; os 86 testes passaram em 14 arquivos; `npm run build` passou. Conferido que `dist/` contém logo, manifesto e regra de rotas.

## Guia Git e GitHub — 2026-10-27

- Nova ferramenta em Programação com roteiros passo a passo para primeiro envio, atualizações, clone, branch/Push Request e sincronização.
- Campos de usuário/repositório/branch/mensagem geram comandos PowerShell copiáveis. O site apenas apresenta os comandos, não executa ações; alerta para revisar `git status` e evitar segredos.
- Adicionado teste unitário de montagem/validação dos comandos e teste de integração da rota da ferramenta.
- Cada comando tem seu próprio botão de cópia para incentivar a revisão e execução passo a passo. A interface explica que os comandos são para PowerShell do Windows e pede para interromper o fluxo se algum comando falhar.
- Verificações: `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 91 testes em 15 arquivos; `npm run build` passou.

## Busca e ícones de navegador — 2026-10-27

- Busca: removida a moldura duplicada causada pelo estilo global de inputs; ampliados campo e painel de resultados, realçado o ícone, atalho e seleção; adicionado contador de resultados e indicação de cálculo rápido. Consultas em branco não listam todo o catálogo.
- Ícones: favicon ICO versionado e PNGs recortados de 192/512 px e Apple Touch Icon; paths novos evitam manter o favicon antigo em cache. O manifesto agora declara os tamanhos corretos. A imagem original permanece preservada.
- Verificações após esta rodada: `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 91 testes em 15 arquivos; `npm run build` passou. Build contém o favicon ICO, PNG 192/512 e ícone Apple.

## Gerador de botões do Kit Web — 2026-10-27

- Ampliado o gerador com estilos sólido, gradiente, 3D elevado, 3D inclinado, contorno, vidro fosco e neon.
- Efeitos ao passar o mouse: elevar, ampliar, inclinar, brilho suave ou nenhum; opções de texto, cores, sombra/brilho, raio, espaçamento e profundidade. Inclinação controlável aparece no estilo 3D inclinado.
- Prévia interativa e CSS copiável incluem hover, active, focus-visible, disabled e respeito a `prefers-reduced-motion`.
- Verificações: `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 91 testes em 15 arquivos; `npm run build` passou. Não foi feita revisão visual manual nesta rodada.

## Editor de imagens — 2026-10-27

- Nova ferramenta em Arquivos: importar imagem local de até 20 MB; recortar com arraste; girar, espelhar, ajustar brilho/contraste/saturação/preto e branco/sépia/desfoque; adicionar texto; redimensionar e exportar PNG/JPEG/WebP.
- Usa Canvas no navegador sem upload. Limita a prévia e processamento-base a 4096 px no maior lado para conter uso de memória; HEIC/HEIF depende de suporte do navegador.
- Adicionado teste de rota e validação de formato inválido.
- Verificações: `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 92 testes em 15 arquivos; `npm run build` passou. Não foi feita revisão visual manual nesta rodada.

## Correção de rolagem e logo lateral — 2026-10-27

- Ao trocar de rota, se a janela estava rolada, agora volta ao topo antes da próxima página ser exibida; o cabeçalho e o início da ferramenta ficam visíveis.
- Substituída a imagem da marca lateral pelo arquivo enviado `public/yva-tools-logo.png`. O enquadramento agora preserva o espaço original da arte dentro do ícone, com brilho ciano mais discreto.
- Atualizados favicon, ícones de instalação e manifesto com assets versionados derivados da imagem recebida para evitar cache da logo anterior.
- Verificações: `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 93 testes em 15 arquivos; `npm run build` passou. O teste de navegação confirma que uma página rolada retorna ao topo ao abrir uma ferramenta.

