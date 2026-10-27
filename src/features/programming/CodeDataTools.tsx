import { useMemo, useState } from 'react';
import { Dices, FileUp, KeyRound, ShieldCheck } from 'lucide-react';
import { NumberField } from '../../components/NumberField';
import { CopyResultButton } from '../../components/CopyResultButton';
import './code-data.css';

export function convertIntegerBase(value: string, from: number) {
  const text = value.trim().toLowerCase(); const negative = text.startsWith('-'); const digits = negative ? text.slice(1) : text;
  if (!digits || ![2, 8, 10, 16].includes(from)) throw new Error('Informe um inteiro e selecione uma base válida.');
  let decimal = 0n;
  for (const char of digits) { const digit = parseInt(char, 36); if (!Number.isInteger(digit) || digit >= from) throw new Error(`O valor não é válido na base ${from}.`); decimal = decimal * BigInt(from) + BigInt(digit); }
  if (negative) decimal = -decimal;
  return { binario: decimal.toString(2), decimal: decimal.toString(10), octal: decimal.toString(8), hexadecimal: decimal.toString(16).toUpperCase() };
}

export const encodeUrlComponent = (value: string) => encodeURIComponent(value);
export const decodeUrlComponent = (value: string) => decodeURIComponent(value);

export function analyzeText(value: string) {
  const characters = Array.from(value).length;
  const words = value.trim() ? (value.match(/[\p{L}\p{N}_]+/gu) ?? []).length : 0;
  const lines = value.length ? value.split(/\r\n|\r|\n/).length : 0;
  return { characters, words, lines, withoutSpaces: Array.from(value).filter((char) => !/\s/u.test(char)).length };
}

export async function sha256Text(value: string, algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256') {
  if (!globalThis.crypto?.subtle) throw new Error('A API segura de hash não está disponível neste contexto do navegador.');
  const digest = await globalThis.crypto.subtle.digest(algorithm, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function md5Bytes(input: Uint8Array) {
  const bitLength = BigInt(input.length) * 8n; const paddedLength = Math.ceil((input.length + 9) / 64) * 64; const data = new Uint8Array(paddedLength); data.set(input); data[input.length] = 0x80;
  for (let i = 0; i < 8; i++) data[paddedLength - 8 + i] = Number((bitLength >> BigInt(i * 8)) & 0xffn);
  const shifts = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const constants = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0); let a0 = 0x67452301; let b0 = 0xefcdab89; let c0 = 0x98badcfe; let d0 = 0x10325476;
  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = new Uint32Array(16); for (let i = 0; i < 16; i++) words[i] = (data[offset+i*4]! | data[offset+i*4+1]! << 8 | data[offset+i*4+2]! << 16 | data[offset+i*4+3]! << 24) >>> 0;
    let a = a0; let b = b0; let c = c0; let d = d0;
    for (let i = 0; i < 64; i++) { let f: number; let g: number; if (i < 16) { f = (b & c) | (~b & d); g = i; } else if (i < 32) { f = (d & b) | (~d & c); g = (5*i+1)%16; } else if (i < 48) { f = b ^ c ^ d; g = (3*i+5)%16; } else { f = c ^ (b | ~d); g = (7*i)%16; } const sum = (a + f + constants[i]! + words[g]!) >>> 0; const shift = shifts[i]!; const rotated = (sum << shift | sum >>> (32-shift)) >>> 0; a = d; d = c; c = b; b = (b + rotated) >>> 0; }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }
  return [a0,b0,c0,d0].map((word) => [0,8,16,24].map((shift) => ((word >>> shift) & 255).toString(16).padStart(2,'0')).join('')).join('');
}

function decodeJwtSegment(segment: string) { const normalized = segment.replace(/-/g, '+').replace(/_/g, '/'); const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')); const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0)); return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
export function decodeJwt(token: string) { const parts = token.trim().split('.'); if (parts.length !== 3 || parts.some((part) => !part)) throw new Error('JWT inválido: esperado o formato header.payload.signature.'); const header = decodeJwtSegment(parts[0]!); const payload = decodeJwtSegment(parts[1]!); if (!header || typeof header !== 'object' || Array.isArray(header) || !payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('O cabeçalho e o conteúdo do JWT precisam ser objetos JSON.'); return { header, payload, signature: parts[2] }; }

export function secureRandomInt(maxExclusive: number) {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 65536) throw new Error('Limite aleatório inválido.');
  const cutoff = Math.floor(65536 / maxExclusive) * maxExclusive; const words = new Uint16Array(1); let value: number;
  do { globalThis.crypto.getRandomValues(words); value = words[0]!; } while (value >= cutoff);
  return value % maxExclusive;
}

const CHARSETS = { lower: 'abcdefghijkmnopqrstuvwxyz', upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ', numbers: '23456789', symbols: '!@#$%^&*()-_=+[]{}:,.?' };
export function generatePassword(length: number, selected: { lower: boolean; upper: boolean; numbers: boolean; symbols: boolean }) {
  const groups = Object.entries(CHARSETS).filter(([key]) => selected[key as keyof typeof selected]).map(([, chars]) => chars);
  if (!Number.isInteger(length) || length < 8 || length > 128) throw new Error('Use um tamanho entre 8 e 128 caracteres.');
  if (!groups.length) throw new Error('Selecione ao menos um grupo de caracteres.');
  const pool = groups.join(''); const chars = groups.map((group) => group[secureRandomInt(group.length)]!);
  while (chars.length < length) chars.push(pool[secureRandomInt(pool.length)]!);
  for (let i = chars.length - 1; i > 0; i--) { const j = secureRandomInt(i + 1); [chars[i], chars[j]] = [chars[j]!, chars[i]!]; }
  return chars.join('');
}

export function estimatePasswordStrength(value: string) {
  if (!value) return { bits: 0, label: 'Digite uma senha para ver a estimativa.' };
  let pool = 0;
  if (/[a-z]/.test(value)) pool += 26; if (/[A-Z]/.test(value)) pool += 26; if (/\d/.test(value)) pool += 10; if (/[^a-zA-Z0-9]/.test(value)) pool += 33;
  const unique = new Set(Array.from(value)).size; let bits = Math.floor(value.length * Math.log2(Math.max(pool, 1)));
  if (unique <= 2 && value.length > 3) bits = Math.floor(bits * .35);
  if (/^(password|senha|qwerty|123456|letmein)/i.test(value)) bits = Math.min(bits, 10);
  const label = bits < 28 ? 'Muito fraca' : bits < 45 ? 'Fraca' : bits < 65 ? 'Razoável' : bits < 90 ? 'Forte' : 'Muito forte';
  return { bits, label };
}

const WORDS = ['aceno','alvo','amora','areia','astro','azul','bambu','brisa','cacto','calma','campo','caneca','carta','chuva','cobre','coral','dado','delta','doce','eco','faro','farol','festa','filtro','foca','folha','fonte','forno','gelo','gema','giro','gruta','ilha','jardim','jato','lago','lima','lince','luz','mapa','mel','nuvem','onda','ouro','pacto','panda','pedra','piano','pipa','pluma','ponte','prisma','quadro','quilo','raio','ramo','rio','rocha','sabiá','safira','sal','samba','seda','sinal','sol','sonho','tango','telha','tinta','trilha','turquesa','uva','vapor','vela','vento','verde','vidro','vila','xadrez'];
export function generatePassphrase(count: number) {
  if (!Number.isInteger(count) || count < 4 || count > 12) throw new Error('Escolha de 4 a 12 palavras.');
  return Array.from({ length: count }, () => WORDS[secureRandomInt(WORDS.length)]).join('-');
}

export function urlParts(input: string) {
  const value = input.trim(); if (!value) throw new Error('Cole uma URL para analisar.');
  const parsed = new URL(value);
  return { protocol: parsed.protocol, domain: parsed.hostname, port: parsed.port || '(padrão)', path: parsed.pathname || '/', query: parsed.search || '(nenhum)', hash: parsed.hash || '(nenhum)', credentials: Boolean(parsed.username || parsed.password) };
}

export function renderSafeMarkdown(source: string) {
  const escaped = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  return escaped.split(/\r?\n/).map((line) => {
    if (!line.trim()) return '';
    const content = line.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    const heading = /^(#{1,6})\s+(.+)$/.exec(content);
    if (heading) { const level = heading[1]!.length; return `<h${level}>${heading[2]}</h${level}>`; }
    if (/^[-*]\s+/.test(content)) return `<div class="md-list-item">• ${content.slice(2)}</div>`;
    return `<p>${content}</p>`;
  }).filter(Boolean).join('\n');
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="web-tool-panel code-data-panel"><header className="web-panel-heading"><h2>{title}</h2><p>{description}</p></header>{children}</section>; }
function CopyButton({ value }: { value: string; label?: string }) { return <CopyResultButton value={value}/>; }
function Output({ value }: { value: string }) { return <div className="dev-output"><pre>{value || 'O resultado aparecerá aqui.'}</pre>{value && <CopyButton value={value}/>}</div>; }
function ErrorBox({ children }: { children: React.ReactNode }) { return <p role="alert" className="validation-message">{children}</p>; }

function UrlCodec() {
  const [input, setInput] = useState('YVA Tools: ciano & café'); const [mode, setMode] = useState<'encode' | 'decode'>('encode'); const [error, setError] = useState('');
  let output = ''; try { output = mode === 'encode' ? encodeUrlComponent(input) : decodeUrlComponent(input); } catch { output = ''; }
  return <Panel title="Codificador e decodificador de URL" description="Codifica ou decodifica um componente de URL. Isso é codificação de caracteres, não criptografia."><div className="file-tabs"><button className={mode === 'encode' ? 'selected' : ''} onClick={() => { setMode('encode'); setError(''); }}>Codificar</button><button className={mode === 'decode' ? 'selected' : ''} onClick={() => { setMode('decode'); setError(''); }}>Decodificar</button></div><label className="text-field code-field"><span>Texto</span><textarea value={input} onChange={(event) => { setInput(event.target.value); setError(''); }} aria-label="Texto para URL"/></label><div className="dev-actions"><button className="primary-button" onClick={() => setError(mode === 'decode' && !output && input ? 'Sequência de URL inválida.' : '')}>{mode === 'encode' ? 'Codificar componente' : 'Decodificar componente'}</button><button className="text-button" onClick={() => { setInput(''); setError(''); }}>Limpar</button></div>{error && <ErrorBox>{error}</ErrorBox>}<Output value={output}/></Panel>;
}

function NumberBaseTool() {
  const [input, setInput] = useState('255'); const [base, setBase] = useState(10); let result: ReturnType<typeof convertIntegerBase> | null = null; let error = '';
  try { result = convertIntegerBase(input, base); } catch (caught) { error = caught instanceof Error ? caught.message : 'Valor inválido.'; }
  return <Panel title="Conversor de bases numéricas" description="Converta inteiros sem arredondamento, inclusive valores grandes, usando BigInt."><label className="text-field"><span>Valor</span><input aria-label="Valor numérico" value={input} onChange={(event) => setInput(event.target.value)}/></label><label className="text-field code-data-subfield"><span>Base de entrada</span><select className="select-control" value={base} onChange={(event) => setBase(Number(event.target.value))}><option value={2}>Binária</option><option value={8}>Octal</option><option value={10}>Decimal</option><option value={16}>Hexadecimal</option></select></label>{error && <ErrorBox>{error}</ErrorBox>}{result && <div className="conversion-grid">{[['BINÁRIO',result.binario],['DECIMAL',result.decimal],['OCTAL',result.octal],['HEXADECIMAL',result.hexadecimal]].map(([label,value]) => <div className="format-row" key={label}><span>{label}</span><code>{value}</code><CopyButton value={value!} label="Copiar"/></div>)}</div>}</Panel>;
}

function TextCounter() {
  const [input, setInput] = useState('YVA Tools — ferramentas locais.'); const [action, setAction] = useState(''); const stats = analyzeText(input);
  const transformed = action === 'upper' ? input.toLocaleUpperCase('pt-BR') : action === 'lower' ? input.toLocaleLowerCase('pt-BR') : action === 'title' ? input.toLocaleLowerCase('pt-BR').replace(/(^|\s)\S/gu, (part) => part.toLocaleUpperCase('pt-BR')) : input;
  return <Panel title="Contador e conversor de texto" description="Conte letras, palavras e linhas ou transforme maiúsculas e minúsculas. O texto permanece no navegador."><label className="text-field code-field"><span>Texto de entrada</span><textarea aria-label="Texto de entrada" value={input} onChange={(event) => setInput(event.target.value)}/></label><div className="text-stats">{[['Caracteres',stats.characters],['Sem espaços',stats.withoutSpaces],['Palavras',stats.words],['Linhas',stats.lines]].map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="dev-actions"><select className="select-control" value={action} onChange={(event) => setAction(event.target.value)}><option value="">Transformar texto…</option><option value="upper">MAIÚSCULAS</option><option value="lower">minúsculas</option><option value="title">Iniciais maiúsculas</option></select><button className="text-button" onClick={() => setInput(transformed)} disabled={!action}>Aplicar</button><button className="text-button" onClick={() => setInput('')}>Limpar</button></div></Panel>;
}

function HashTool() {
  const [mode, setMode] = useState<'text' | 'file'>('text'); const [input, setInput] = useState('YVA Tools'); const [file, setFile] = useState<File | null>(null); const [algorithm, setAlgorithm] = useState<'MD5'|'SHA-1'|'SHA-256'|'SHA-384'|'SHA-512'>('SHA-256'); const [output, setOutput] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const generate = async () => { const data = mode === 'text' ? new TextEncoder().encode(input) : file ? new Uint8Array(await file.arrayBuffer()) : null; if (!data) { setError('Escolha um arquivo para calcular o hash.'); return; } if (data.byteLength > 100 * 1024 * 1024) { setError('O limite desta ferramenta é 100 MB por arquivo.'); return; } setBusy(true); try { if (algorithm === 'MD5') setOutput(md5Bytes(data)); else { if (!crypto.subtle) throw new Error('SHA-1/SHA-2 requer um navegador atualizado em contexto seguro (localhost é aceito).'); const digest = await crypto.subtle.digest(algorithm, data); setOutput(Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')); } setError(''); } catch (caught) { setOutput(''); setError(caught instanceof Error ? caught.message : 'Não foi possível calcular o hash.'); } finally { setBusy(false); } };
  return <Panel title="Gerador de hashes" description="Calcule MD5, SHA-1 e SHA-2 para texto ou arquivos locais. MD5 e SHA-1 são legados e não devem ser usados para segurança ou senhas."><div className="file-tabs"><button className={mode === 'text' ? 'selected' : ''} onClick={() => { setMode('text'); setOutput(''); setError(''); }}>Texto</button><button className={mode === 'file' ? 'selected' : ''} onClick={() => { setMode('file'); setOutput(''); setError(''); }}>Arquivo</button></div>{mode === 'text' ? <label className="text-field code-field"><span>Texto para hash</span><textarea value={input} onChange={(event) => setInput(event.target.value)} aria-label="Texto para hash"/></label> : <label className="file-pick"><FileUp size={18}/><span>{file?.name ?? 'Escolher arquivo (máximo 100 MB)'}</span><input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)}/></label>}<label className="text-field code-data-subfield"><span>Algoritmo</span><select className="select-control" value={algorithm} onChange={(event) => setAlgorithm(event.target.value as typeof algorithm)}><option>MD5</option><option>SHA-1</option><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></label><div className="dev-actions"><button className="primary-button" onClick={() => void generate()} disabled={busy}>{busy ? 'Calculando…' : 'Calcular hash'}</button><button className="text-button" onClick={() => { setInput(''); setFile(null); setOutput(''); setError(''); }}>Limpar</button></div>{error && <ErrorBox>{error}</ErrorBox>}{output && <Output value={output}/>}</Panel>;
}

function JwtDecoderTool() { const [token, setToken] = useState(''); let decoded: ReturnType<typeof decodeJwt> | null = null; let error = ''; if (token.trim()) { try { decoded = decodeJwt(token); } catch (caught) { error = caught instanceof Error ? caught.message : 'JWT inválido.'; } } return <Panel title="Decodificador de JWT" description="Leia o cabeçalho e payload de um JWT localmente. A assinatura não é validada e o conteúdo não é confiável."><label className="text-field code-field"><span>Token JWT</span><textarea rows={5} value={token} onChange={(event) => setToken(event.target.value)} placeholder="Cole aqui o token completo"/></label>{error && <ErrorBox>{error}</ErrorBox>}{decoded && <><div className="conversion-grid"><div className="format-row"><span>CABEÇALHO</span><pre>{JSON.stringify(decoded.header, null, 2)}</pre></div><div className="format-row"><span>PAYLOAD</span><pre>{JSON.stringify(decoded.payload, null, 2)}</pre></div></div><p className="research-safety">A assinatura não foi verificada; nenhum claim está autenticado. Não cole tokens reais/sensíveis em dispositivos compartilhados.</p></>}</Panel>; }

function PasswordGenerator() {
  const [length, setLength] = useState(20); const [groups, setGroups] = useState({ lower: true, upper: true, numbers: true, symbols: true }); const [passphrase, setPassphrase] = useState(false); const [words, setWords] = useState(6); const [output, setOutput] = useState(''); const [error, setError] = useState('');
  const generate = () => { try { const value = passphrase ? generatePassphrase(words) : generatePassword(length, groups); setOutput(value); setError(''); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível gerar.'); } };
  return <Panel title="Gerador de senhas e frases-senha" description="Usa aleatoriedade criptográfica do navegador. A senha é criada aqui e não é enviada a um servidor."><div className="file-tabs"><button className={!passphrase ? 'selected' : ''} onClick={() => setPassphrase(false)}><KeyRound size={14}/> Senha aleatória</button><button className={passphrase ? 'selected' : ''} onClick={() => setPassphrase(true)}><ShieldCheck size={14}/> Frase-senha</button></div>{!passphrase ? <><label className="text-field"><span>Tamanho: {length} caracteres</span><input type="range" min="8" max="64" value={length} onChange={(event) => setLength(Number(event.target.value))}/></label><div className="security-checks">{([['lower','Letras minúsculas'],['upper','Letras maiúsculas'],['numbers','Números'],['symbols','Símbolos']] as const).map(([key,label]) => <label key={key}><input type="checkbox" checked={groups[key]} onChange={(event) => setGroups((current) => ({ ...current, [key]: event.target.checked }))}/>{label}</label>)}</div></> : <label className="text-field"><span>Número de palavras (4–12)</span><NumberField label="Número de palavras" value={words} onChange={(raw) => setWords(Number(raw) || 4)} min="4" max="12" step="1"/></label>}<div className="dev-actions"><button className="primary-button" onClick={generate}><Dices size={15}/> Gerar</button><button className="text-button" onClick={() => { setOutput(''); setError(''); }}>Limpar</button></div>{error && <ErrorBox>{error}</ErrorBox>}{output && <Output value={output}/>}</Panel>;
}

function PasswordStrength() {
  const [input, setInput] = useState(''); const estimate = estimatePasswordStrength(input); const tone = estimate.bits < 28 ? 'weak' : estimate.bits < 45 ? 'medium' : estimate.bits < 65 ? 'good' : 'strong';
  return <Panel title="Avaliador local de senha" description="Estimativa heurística feita apenas neste dispositivo. Não verifica vazamentos nem garante segurança absoluta."><label className="text-field"><span>Senha (não será salva nem enviada)</span><input type="password" value={input} onChange={(event) => setInput(event.target.value)} autoComplete="new-password"/></label><div className={`strength-meter ${tone}`}><span style={{ width: `${Math.min(100, estimate.bits / 1.2)}%` }}/></div><div className="strength-summary"><strong>{estimate.label}</strong>{input && <span>aprox. {estimate.bits} bits de entropia teórica</span>}</div><button className="text-button" onClick={() => setInput('')}>Limpar campo</button></Panel>;
}

function UrlAnalyzer() {
  const [input, setInput] = useState('https://example.com/caminho?origem=yva#detalhe'); const [error, setError] = useState(''); const parts = useMemo(() => { try { return urlParts(input); } catch { return null; } }, [input]);
  return <Panel title="Analisador informativo de URL" description="Mostra os componentes do endereço sem visitá-lo. Uma análise estrutural não detecta todos os links maliciosos."><label className="text-field"><span>URL</span><input value={input} onChange={(event) => { setInput(event.target.value); setError(''); }} aria-label="URL para analisar" placeholder="https://exemplo.com"/></label><div className="dev-actions"><button className="primary-button" onClick={() => { if (!parts) setError('URL inválida. Inclua protocolo e domínio, como https://exemplo.com.'); }}>Analisar</button><button className="text-button" onClick={() => { setInput(''); setError(''); }}>Limpar</button></div>{error && <ErrorBox>{error}</ErrorBox>}{parts && <div className="conversion-grid">{Object.entries(parts).map(([label,value]) => <div className="format-row" key={label}><span>{label === 'domain' ? 'DOMÍNIO' : label.toUpperCase()}</span><code>{typeof value === 'boolean' ? value ? 'Sim' : 'Não' : value}</code></div>)}</div>}</Panel>;
}

function TokenGenerator() {
  const [bytes, setBytes] = useState(32); const [output, setOutput] = useState(''); const [error, setError] = useState('');
  const generate = () => { try { if (!Number.isInteger(bytes) || bytes < 16 || bytes > 64) throw new Error('Escolha de 16 a 64 bytes.'); const data = crypto.getRandomValues(new Uint8Array(bytes)); setOutput(Array.from(data, (byte) => byte.toString(16).padStart(2, '0')).join('')); setError(''); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Aleatoriedade segura indisponível.'); } };
  return <Panel title="Gerador de tokens de teste" description="Gere uma string hexadecimal aleatória por CSPRNG. Use apenas em dados e ambientes de teste."><label className="text-field"><span>Comprimento ({bytes} bytes / {bytes * 2} caracteres hex)</span><input type="range" min="16" max="64" step="8" value={bytes} onChange={(event) => setBytes(Number(event.target.value))}/></label><div className="dev-actions"><button className="primary-button" onClick={generate}><Dices size={15}/> Gerar token</button><button className="text-button" onClick={() => setOutput('')}>Limpar</button></div>{error && <ErrorBox>{error}</ErrorBox>}{output && <Output value={output}/>}</Panel>;
}

function FakeDataTool() {
  const [count, setCount] = useState(5); const [rows, setRows] = useState<Array<{ name: string; email: string; phone: string; city: string; company: string; role: string }>>([]); const [error, setError] = useState('');
  const first = ['Alex','Bia','Caio','Dani','Eli','Fran','Gui','Ira','Jo','Kim','Luca','Mika','Noa','Rafa','Sam','Toni']; const last = ['Alves','Barros','Costa','Dias','Esteves','Freitas','Gomes','Lima','Mendes','Nunes','Oliveira','Paiva','Ramos','Silva','Teixeira','Vieira']; const cities = ['São Paulo','Curitiba','Recife','Manaus','Belém','Goiânia','Natal','Campinas']; const companies = ['Aurora Labs','Ciano Studio','Ponte Digital','Nuvem Aberta','Circuito Criativo','Farol Tech']; const roles = ['Design','Desenvolvimento','Suporte','Pesquisa','Produto','Operações'];
  const generate = () => { try { if (!Number.isInteger(count) || count < 1 || count > 50) throw new Error('Escolha de 1 a 50 registros.'); setRows(Array.from({ length: count }, (_, index) => ({ name: `${first[secureRandomInt(first.length)]} ${last[secureRandomInt(last.length)]}`, email: `pessoa${index + 1}@example.test`, phone: `+1-202-555-01${String(secureRandomInt(100)).padStart(2, '0')}`, city: cities[secureRandomInt(cities.length)]!, company: companies[secureRandomInt(companies.length)]!, role: roles[secureRandomInt(roles.length)]! }))); setError(''); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Falha ao gerar dados.'); } };
  const csv = ['nome,email,telefone,cidade,empresa,cargo', ...rows.map((row) => [row.name,row.email,row.phone,row.city,row.company,row.role].map((field) => `"${field.replace(/"/g, '""')}"`).join(','))].join('\n');
  return <Panel title="Gerador de dados fictícios" description="Cria perfis de demonstração com contatos reservados para testes. Não são dados de pessoas reais."><label className="text-field"><span>Quantidade (1–50)</span><NumberField label="Quantidade de registros" value={count} onChange={(raw) => setCount(Number(raw) || 1)} min="1" max="50" step="1"/></label><div className="dev-actions"><button className="primary-button" onClick={generate}>Gerar registros</button><button className="text-button" onClick={() => setRows([])}>Limpar</button>{rows.length > 0 && <button className="text-button" onClick={() => { const blob = new Blob([csv], { type: 'text/csv' }); const href = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'dados-ficticios.csv'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(href), 800); }}>Baixar CSV</button>}</div>{error && <ErrorBox>{error}</ErrorBox>}{rows.length > 0 && <div className="fake-table-wrap"><table className="fake-table"><thead><tr><th>Nome</th><th>E-mail reservado</th><th>Telefone fictício</th><th>Cidade</th><th>Empresa de exemplo</th><th>Área</th></tr></thead><tbody>{rows.map((row,i) => <tr key={`${row.email}-${i}`}><td>{row.name}</td><td>{row.email}</td><td>{row.phone}</td><td>{row.city}</td><td>{row.company}</td><td>{row.role}</td></tr>)}</tbody></table></div>}</Panel>;
}

function AsciiTable() {
  return <Panel title="Tabela ASCII imprimível" description="Consulta rápida dos caracteres visíveis na faixa ASCII de 32 a 126."><div className="ascii-table-wrap"><table className="ascii-table"><thead><tr><th>Decimal</th><th>Hex</th><th>Caractere</th></tr></thead><tbody>{Array.from({ length: 95 }, (_, index) => index + 32).map((code) => <tr key={code}><td>{code}</td><td>{code.toString(16).toUpperCase().padStart(2, '0')}</td><td>{String.fromCharCode(code)}</td></tr>)}</tbody></table></div></Panel>;
}

function LoremGenerator() {
  const [paragraphs, setParagraphs] = useState(3); const [output, setOutput] = useState(''); const sample = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae sem at nibh viverra sodales. Mauris non urna sed erat ultrices posuere. Donec blandit, tellus at commodo varius, nisi massa feugiat justo, vel facilisis justo magna vitae arcu.';
  const generate = () => setOutput(Array.from({ length: Math.max(1, Math.min(12, paragraphs)) }, () => sample).join('\n\n'));
  return <Panel title="Gerador de Lorem Ipsum" description="Crie texto fictício para preencher protótipos e layouts durante o desenvolvimento."><label className="text-field"><span>Parágrafos (1–12)</span><NumberField label="Quantidade de parágrafos" value={paragraphs} onChange={(raw) => setParagraphs(Number(raw) || 1)} min="1" max="12" step="1"/></label><div className="dev-actions"><button className="primary-button" onClick={generate}>Gerar texto</button><button className="text-button" onClick={() => setOutput('')}>Limpar</button></div>{output && <Output value={output}/>}</Panel>;
}

function MarkdownEditor() {
  const [source, setSource] = useState('# YVA Tools\n\nEdite **Markdown** com `código` e listas.\n- Rápido\n- Local'); const preview = useMemo(() => renderSafeMarkdown(source), [source]);
  return <Panel title="Editor e prévia Markdown" description="Visualização segura dos recursos básicos: títulos, parágrafos, listas, ênfase e código inline. HTML fornecido é exibido como texto."><div className="playground-editors markdown-editors"><label className="text-field code-field"><span>Markdown</span><textarea aria-label="Markdown de entrada" value={source} onChange={(event) => setSource(event.target.value)}/></label><div className="markdown-preview" aria-label="Prévia Markdown" dangerouslySetInnerHTML={{ __html: preview }}/></div><button className="text-button" onClick={() => setSource('')}>Limpar</button></Panel>;
}

export function inferTypeScriptFromJson(input: string, rootName = 'Root'): string {
  const value: unknown = JSON.parse(input);
  const infer = (item: unknown, depth = 0): string => {
    if (item === null) return 'null';
    if (typeof item === 'string') return 'string';
    if (typeof item === 'number') return 'number';
    if (typeof item === 'boolean') return 'boolean';
    if (Array.isArray(item)) { if (!item.length) return 'unknown[]'; const members = [...new Set(item.map((entry) => infer(entry, depth + 1)))]; return members.length === 1 ? `${members[0]}[]` : `(${members.join(' | ')})[]`; }
    if (typeof item === 'object') { const entries = Object.entries(item as Record<string, unknown>); if (!entries.length) return 'Record<string, unknown>'; const fields = entries.map(([key, field]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${infer(field, depth + 1)};`); return depth > 8 ? 'Record<string, unknown>' : `{ ${fields.join(' ')} }`; }
    return 'unknown';
  };
  const name = rootName.trim().replace(/[^A-Za-z0-9_$]/g, '') || 'Root';
  return `export type ${name} = ${infer(value)};`;
}

function JsonTypescriptTool() {
  const [input, setInput] = useState('{\n  "id": 12,\n  "nome": "YVA",\n  "ativo": true,\n  "tags": ["web", "tools"],\n  "perfil": { "nivel": 1 }\n}'); const [name, setName] = useState('Root'); const [output, setOutput] = useState(''); const [error, setError] = useState('');
  return <Panel title="JSON para TypeScript" description="Infere tipos a partir de uma amostra JSON processada localmente. Campos opcionais não são inferidos sem múltiplos exemplos."><label className="text-field code-field"><span>JSON de entrada</span><textarea value={input} onChange={(event) => setInput(event.target.value)} aria-label="JSON de entrada"/></label><label className="text-field"><span>Nome do tipo raiz</span><input value={name} onChange={(event) => setName(event.target.value)}/></label><div className="dev-actions"><button className="primary-button" onClick={() => { try { setOutput(inferTypeScriptFromJson(input, name)); setError(''); } catch (caught) { setOutput(''); setError(caught instanceof Error ? caught.message : 'JSON inválido.'); } }}>Gerar tipos</button><button className="text-button" onClick={() => { setInput(''); setOutput(''); setError(''); }}>Limpar</button></div>{error && <ErrorBox>{error}</ErrorBox>}{output && <Output value={output}/>}</Panel>;
}

export function CodeDataTool({ slug }: { slug: string }) {
  switch (slug) {
    case 'jwt-decoder': return <JwtDecoderTool />;
    case 'json-typescript': return <JsonTypescriptTool />;
    case 'url-codec': return <UrlCodec />;
    case 'bases-numericas': return <NumberBaseTool />;
    case 'contador-texto': return <TextCounter />;
    case 'hash': return <HashTool />;
    case 'gerador-senhas': return <PasswordGenerator />;
    case 'forca-senha': return <PasswordStrength />;
    case 'analisador-url': return <UrlAnalyzer />;
    case 'gerador-token': return <TokenGenerator />;
    case 'dados-ficticios': return <FakeDataTool />;
    case 'ascii': return <AsciiTable />;
    case 'lorem-ipsum': return <LoremGenerator />;
    case 'markdown': return <MarkdownEditor />;
    default: return null;
  }
}
