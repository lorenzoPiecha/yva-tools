# YVA Tools — catálogo de ferramentas e funções

Este arquivo resume o que está disponível no site. A lista oficial de nomes, categorias e endereços permanece em [`src/data/tools.ts`](src/data/tools.ts); consulte esse registro se este resumo ficar desatualizado.

## Funções gerais do site

- Início com busca global, navegação por categorias, cartões de ferramentas, itens recentes e favoritos.
- Categorias: Desenvolvimento web, Programação, Eletrônica, Arquivos, Calculadoras, Rede e Produtividade e estudos.
- Tema escuro (padrão) e claro, opção de texto maior, menu móvel, navegação por teclado e layout responsivo.
- Favoritos, histórico e preferências guardados neste navegador; exportação e importação de backup JSON.
- Recomendações de ferramentas relacionadas, com ligações para recursos complementares.
- Os cartões indicam quando o recurso é executado no navegador, combina processamento local e busca na web, ou abre uma busca externa.

## Desenvolvimento web

- **Paleta de cores:** criar combinações e copiar códigos.
- **Gradientes CSS:** configurar cores e direção, visualizar e copiar CSS.
- **Sombras CSS:** ajustar parâmetros e ver a prévia.
- **Conversor HEX · RGB · HSL:** converter entre formatos de cor.
- **Verificador de contraste:** avaliar contraste e legibilidade entre texto e fundo.
- **Extrator de cores:** obter cores de uma imagem escolhida no dispositivo.
- **Gerador de botões CSS:** personalizar e visualizar um botão, copiando HTML/CSS.
- **Bordas e cantos CSS:** controlar bordas e raios com prévia.
- **Conversor de unidades CSS:** converter px e rem com base configurável.
- **Kit de desenvolvimento web:** formatar/minificar HTML, CSS e JavaScript (heurístico); testar expressões regulares com realce; criar metatags; montar exemplos Flexbox/Grid; explorar fontes e ícones Lucide; gerar README Markdown.

## Programação

- **Formatador JSON:** formatar, compactar e validar JSON.
- **Gerador de tipos TypeScript:** inferir tipos a partir de JSON.
- **Decodificador de JWT:** exibir cabeçalho e payload; não valida a assinatura.
- **Codificador Base64:** codificar/decodificar texto Unicode.
- **Gerador de UUID:** UUID v4.
- **Playground HTML · CSS · JS:** prévia isolada de código no navegador.
- **Codificador de URL:** codificar/decodificar componentes de URL.
- **Conversor de bases numéricas:** binária, octal, decimal e hexadecimal.
- **Contador e conversor de texto:** contagem e operações de texto disponíveis na interface.
- **Geradores de hash:** SHA-256, MD5, SHA-1 e SHA-512; também há SHA-384 no seletor de algoritmo. MD5 e SHA-1 são legados e não devem proteger senhas.
- **Gerador de senhas** e **Avaliador local de senha:** criar senha aleatória e estimar força localmente.
- **Analisador de URL:** separar e inspecionar partes de um endereço.
- **Gerador de tokens de teste:** criar sequências aleatórias para desenvolvimento.
- **Gerador de dados fictícios:** produzir dados de exemplo, não associados a pessoas reais.
- **Tabela ASCII:** consultar caracteres imprimíveis e seus códigos.
- **Gerador Lorem Ipsum:** texto de preenchimento para protótipos.
- **Editor Markdown:** escrever e visualizar Markdown.
- **Guia de comandos Git e GitHub:** gerar sequências em ordem para primeiro envio, atualizações, clone, branches e sincronização; comandos são exibidos para revisão e cópia, nunca executados pelo site.

## Eletrônica

- **Lei de Ohm:** resolver grandezas elétricas a partir dos valores informados.
- **Resistores em série e paralelo:** calcular resistência equivalente.
- **Resistor para LED:** estimar resistor limitador para LED.
- **Potência e consumo:** calcular potência, energia e custo estimado.
- **Divisor de tensão:** estimar saída, corrente e dissipação ideal.
- **Código de cores de resistores:** ler 4, 5 ou 6 faixas, tolerância e coeficiente térmico.
- **Capacitores em série e paralelo:** calcular capacitância equivalente.
- **Filtro RC:** frequência de corte ideal de −3 dB.
- **Timer 555:** estimar modo astável ou monoestável.
- **LM317:** estimar tensão de saída pela rede resistiva.
- **Tabela AWG:** consultar diâmetro, área e corrente estimada para fios de cobre.
- **Referência de pinouts:** Arduino Uno R3, ESP32 DevKit genérico, USB e HDMI; confirme sempre modelo, revisão e fabricante.
- **Conversor de prefixos SI:** converter entre pico, nano, micro, mili, quilo, mega, giga e tera.
- **Pesquisador de circuitos integrados:** abre documentação/datasheets de fabricante ou busca externa; resultados externos precisam ser conferidos.
- **Buscador de esquemas e manuais:** monta consultas por modelo, placa, fonte ou CI; não valida os arquivos encontrados.
- **Histórico de bancada:** salvar registros locais e exportá-los.
- **Identificador de componentes:** procurar códigos e nomes em catálogo local limitado e acessar referências quando disponíveis.
- **Leitor de códigos SMD:** decodificar padrões comuns de resistores e capacitores.
- **Mapa visual da placa:** marcar pontos sobre foto local; a foto é temporária na sessão e as marcações podem ser exportadas.
- **Roteiro de diagnóstico:** checklist de observações com avisos de segurança; não é diagnóstico automático.
- **Orçamento de reparo:** estimar peças, mão de obra, custos e acréscimo.

## Arquivos

- **ZIP e arquivos compactados:** criar e extrair ZIP localmente.
- **Conversor e compressor de imagens:** converter, redimensionar e comprimir uma imagem.
- **Conversor de imagens em lote:** processar várias imagens e baixar ZIP.
- **Remover metadados de imagem:** regravar por Canvas para remover EXIF e outros metadados não visuais; formatos dependem do navegador.
- **Recortar imagem:** recorte central em proporções comuns.
- **Ferramentas de PDF:** unir PDFs e extrair/reorganizar páginas.
- **Converter imagens para PDF:** criar PDF local, com imagens ordenadas em páginas A4.
- **Otimizar PDF:** regravar estrutura do PDF sem rasterizar; a redução de tamanho não é garantida.
- **Conversor CSV · JSON:** converter entre tabela CSV e JSON, com prévia.
- **Conversores rápidos:** operações de texto, bases e unidades simples.
- **Comparador de textos:** mostrar diferenças entre duas versões.
- **Identificador de arquivos:** examinar informações disponíveis sobre arquivos.
- **Calculadora de tamanho de arquivos:** somar tamanhos de arquivos selecionados.
- **Visualizador de mídia:** prévia de imagens, áudio e vídeo; permite salvar imagem/quadros e ajustar velocidade de vídeo.
- **Editor de imagens:** recorte por arraste, giro, espelhamento, ajustes de cor, texto, redimensionamento e exportação PNG/JPEG/WebP. O processamento é local; a prévia limita o maior lado a 4096 px e formatos aceitos dependem do navegador.

## Calculadoras

- **Calculadora de porcentagem:** porcentagem, acréscimo e desconto.
- **Porcentagem reversa:** estimar o valor original antes de acréscimo/desconto.
- **Regra de três:** resolver proporções diretas.
- **Calculadora de IMC:** cálculo de referência geral, não diagnóstico.
- **Conversor de unidades:** comprimento, massa, temperatura e volume.
- **Calculadora de média:** média, mediana e amplitude.
- **Divisor de conta:** dividir entre pessoas e incluir gorjeta opcional.
- **Calculadora de datas:** calcular dias corridos entre datas.
- **Gerador e validador de CPF/CNPJ:** validar dígitos verificadores e gerar números aleatórios para testes; não consulta nem emite documentos reais.

## Rede

- **Calculadora de sub-redes IPv4:** rede, broadcast, máscara e intervalo de hosts via IP/CIDR.
- **Calculadora de transferência:** estimar duração conforme tamanho e velocidade informados.
- **Calculadora de espaço para vídeo:** estimar armazenamento a partir da duração e bitrate.
- **Conversor de timestamp Unix:** converter segundos/milissegundos e data.
- **Gerador de QR code:** gerar e baixar QR para texto ou endereço.
- **Status da conexão:** mostrar o estado e métricas que o navegador disponibiliza; não mede velocidade real nem confirma acesso a um site.

## Produtividade e estudos

- **Temporizador Pomodoro:** períodos de foco e pausa configuráveis.
- **Lista de tarefas:** tarefas salvas neste navegador.
- **Cartões de estudo:** perguntas e respostas para revisão.

## Limitações e itens ainda não disponíveis

- PWA e modo offline instalado foram adiados; este catálogo descreve a versão web atual.
- Os botões de copiar ainda não estão totalmente padronizados entre todas as ferramentas.
- Formatação/minificação de código é heurística e deve ser conferida em código complexo.
- Estimativas elétricas, AWG e pinouts são referências; não substituem datasheet, medição ou revisão do circuito real.
- Buscas externas abrem fontes de terceiros e não garantem que o documento seja correto ou corresponda à revisão do equipamento.
- O catálogo de componentes não cobre todos os componentes nem realiza identificação por OCR.
- O navegador limita codecs, formatos de imagem, recursos de rede e APIs disponíveis.
