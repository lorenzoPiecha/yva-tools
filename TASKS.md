# Próximas etapas

## Conversor de imagem para PDF — 2026-10-27

- Confirmado que não havia conversão de imagem para PDF; adicionada ferramenta dedicada em Arquivos.
- Aceita vários formatos de imagem, organiza uma imagem por página A4, preserva a ordem selecionada, corrige a orientação da página e cria PDF local.
- Limites explícitos: 30 imagens, 25 MB cada, 100 MB total, 40 MP por imagem. Formatos fora de JPEG/PNG dependem do decodificador do navegador e passam por Canvas.
- Typecheck e build passaram; testes: 66 passaram em 11 arquivos.

## Eletrônica: componentes passivos — 2026-10-27

- Implementadas as calculadoras de código de cores de resistores (4, 5 e 6 faixas, tolerância e ppm/°C) e capacitância equivalente de capacitores em série/paralelo.
- Adicionada validação para combinações inválidas e notas sobre tolerâncias, potência nominal, carga externa e tensão suportada.
- `npm run typecheck` passou; `npm test -- --reporter=dot` passou com 64 testes em 11 arquivos; `npm run build` passou. Bundle inicial: 334,54 kB (101,26 kB gzip).

## Pequeno bloco de ferramentas + passagem de contexto — 2026-10-27

- Adicionados divisor de tensão (Eletrônica), porcentagem reversa e conversor de timestamp Unix (Rede e utilidades).
- Criado `HANDOFF_NEXT_AI.md` com regras, arquitetura, comandos para continuar, limitações e backlog priorizado.
- Nesta rodada: `npm run typecheck` e `npm run build` passaram. Testes automatizados e inspeção visual não foram executados nesta rodada.

## Novas ferramentas solicitadas — 2026-10-27

- Adicionados identificador de componentes por código/nome com catálogo inicial de LM358, NE555, UC3842, TL431 e LM317; datasheets e páginas de fabricante para correspondências conhecidas; busca externa identificada como não verificada para outros códigos.
- Adicionados decodificador SMD comum (resistores de 3/4 dígitos e R decimal; capacitores de 3 dígitos), mapa de placa com foto/marcadores e exportação JSON, roteiro guiado de triagem com avisos de segurança e calculadora de orçamento de reparo.
- Histórico de bancada agora permite exportar registros em JSON e fichas PDF.
- Adicionado JSON → TypeScript com inferência de valores e tratamento de JSON inválido; conversor de imagens em lote com saída ZIP, qualidade e largura máxima.
- Verificações finais após integração: typecheck passou; 62 testes passaram em 11 arquivos; build passou. O gerador PDF ficou sob demanda; o maior chunk inicial é 320,88 kB (97,71 kB gzip), e o chunk PDF carregado sob demanda é 437,03 kB (180,60 kB gzip). O build não mostrou o aviso de chunk acima de 500 kB.
- Limites: catálogo de componentes é deliberadamente pequeno e não equivale a OCR nem identificação garantida; o mapa mantém a foto só durante a sessão e exporta marcações separadas; códigos SMD têm padrões alternativos por fabricante; imagens dependem dos formatos de exportação aceitos pelo navegador.

## Kit Web ampliado — 2026-10-27

- Catálogo com 179 ícones do Lucide, busca por nome exato e cópia da importação verificada; adicionado gerador de README com prévia e download.
- Kit Web carregado sob demanda. Typecheck/build e 55 testes passaram; conferência visual em 375 px.

## Revisão antes do PWA — 2026-10-27

- Responsividade conferida no navegador em 320 px e 375 px; corrigida a rolagem horizontal e ampliada a leitura em celulares estreitos.
- O visualizador de mídia agora baixa a imagem original, muda velocidade do vídeo (0,5×–2×) e salva o quadro atual como PNG.
- A lacuna de eletrônica do roteiro original foi iniciada com busca de datasheets por CI e montagem de consultas de esquemas/manuais por modelo/placa. Os resultados são links de busca, não documentos validados; integração de fontes diretas segue pendente.
- Acrescentados histórico local de bancada, calculadora IPv4/CIDR, estimativa de tempo de transferência e de espaço de vídeo.
- Parte 11 (PWA) adiada a pedido do usuário. Próximas pendências: avaliar teste real de velocidade com endpoint escolhido e consentido; edição/transcodificação de mídia; revisar tema claro e outros formulários; CI.

## Concluído nesta rodada

- Partes 3, 5 e 6: itens prioritários da lista anterior implementados. Consulte `docs/PROGRESS.md` para escopo e limitações.
- Parte 7: sete utilidades disponíveis.
- React Router atualizado para 7.18.4 após a auditoria indicar duas vulnerabilidades moderadas na versão anterior; a auditoria automática da instalação atual informou zero vulnerabilidades.

## Próximos blocos

1. Completar Parte 8: QR local e status de conexão já disponíveis; completar medição de rede apenas com endpoint seguro/consentido.
2. Completar Parte 9 — visualizador local de imagem/áudio/vídeo já disponível; edição/transcodificação avançada continua no roteiro.
3. Completar Parte 10 — bloco inicial implementado com Pomodoro, tarefas e cartões; expandir conforme necessário.
4. Parte 11 — PWA, privacidade, desempenho e revisão final.
5. Acabamento: revisão visual manual e configuração de CI.

## Limitações registradas

- Formatadores e minificadores HTML/CSS/JS são heurísticos, sem parser dedicado; revisar código complexo antes de usar em produção.
- A execução isolada de `npm audit` falhou na conexão do endpoint. A instalação após atualizar o roteador reportou zero vulnerabilidades.
# Atualização — 2026-10-27

## Feito nesta rodada

- [x] Ferramentas eletrônicas: RC, timer 555, LM317, AWG, pinouts, prefixos SI.
- [x] Arquivos: remover metadados de imagem, recortar imagem, regravar/otimizar estrutura de PDF (redução não garantida).
- [x] Programação: decodificador JWT, MD5/SHA-1/SHA-512, realce de regex em tempo real.
- [x] Utilidades: gerar/validar CPF e CNPJ para testes.
- [x] Dividir navegação entre Calculadoras e Rede; remover selo PRONTA; acrescentar relacionadas, botão de sugestão e textos do backup mais claros.
- [x] Typecheck, 71 testes automatizados e build de produção passaram.

## Próximo bloco

- [ ] Uniformizar visual e comportamento de copiar resultado em todas as ferramentas.
- [x] Criar atalhos claros para conversores repetidos e buscadores de CI, componentes e esquemas via recomendações relacionadas.
- [ ] Fazer revisão visual responsiva das novas telas e confirmar os estados claro/escuro.
- [ ] PWA/offline continua adiado por pedido do usuário.

# Expansão de Desenvolvimento Web solicitada em 2026-10-28

- [x] Auditar categorias, catálogo e ferramentas web existentes; reaproveitar o gerador de botões, gradientes e sombras.
- [x] Criar biblioteca inicial de componentes dentro de Desenvolvimento web (botão, card, selo, aviso e campo), com personalização, prévia e código copiável. Typecheck e build passaram; 94 testes passaram em 15 arquivos.
- [x] Ampliar a biblioteca com seletor, textarea, checkbox, switch e barra de progresso, com HTML/CSS e prévia acessível. Typecheck e build passaram; 95 testes passaram em 15 arquivos.
- [x] Adicionar gradiente, vidro, transparência, neon, relevo/inclinação 3D e controles de sombra; validação atual: typecheck/build passaram, 96 testes em 15 arquivos.
- [x] Permitir raios CSS independentes nos quatro cantos, com opção de vincular valores. Typecheck e build passaram; 97 testes em 15 arquivos.
- [ ] Ampliar biblioteca de componentes e interações JavaScript seguras.
- [ ] Completar geradores CSS restantes: radius independente por canto, glass, neon, transform, animação, fundos/padrões, clip-path, filtros e texto.
- [ ] Color Studio, estilos visuais agrupados e ferramentas gráficas ausentes.
- [ ] Editor visual de interfaces e exportação organizada de projetos.

