import { useState } from 'react';
import { Dices } from 'lucide-react';
import { NumberField } from '../../components/NumberField';
import { CopyResultButton } from '../../components/CopyResultButton';

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="web-tool-panel dev-tool-panel"><header className="web-panel-heading"><h2>{title}</h2><p>{description}</p></header>{children}</section>; }
function CopyButton({ value }: { value: string }) { return <CopyResultButton value={value}/>; }
function Output({ value }: { value: string }) { return <div className="dev-output"><pre><code>{value || 'O resultado aparecerá aqui.'}</code></pre>{value && <CopyButton value={value}/>}</div>; }

export function JsonFormatter() {
  const [input, setInput] = useState('{"ferramenta":"YVA Tools","pronto":true}'); const [output, setOutput] = useState(''); const [error, setError] = useState('');
  const format = (compact: boolean) => { try { const parsed: unknown = JSON.parse(input); setOutput(JSON.stringify(parsed, null, compact ? 0 : 2)); setError(''); } catch (caught) { setOutput(''); setError(caught instanceof Error ? caught.message : 'JSON inválido.'); } };
  return <Panel title="Formatador e validador JSON" description="Formate ou compacte JSON no próprio navegador. O texto não é enviado a um servidor."><label className="text-field code-field"><span>JSON de entrada</span><textarea aria-label="JSON de entrada" spellCheck={false} value={input} onChange={(event) => setInput(event.target.value)} placeholder={'{"chave":"valor"}'}/></label><div className="dev-actions"><button className="web-copy primary-copy" onClick={() => format(false)}>Formatar e validar</button><button className="text-button" onClick={() => format(true)}>Compactar</button><button className="text-button" onClick={() => { setInput(''); setOutput(''); setError(''); }}>Limpar</button></div>{error && <p className="validation-message" role="alert">JSON inválido: {error}</p>}{output && <Output value={output}/>}</Panel>;
}

function encodeBase64(text: string) { const bytes = new TextEncoder().encode(text); let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary); }
function decodeBase64(text: string) { const binary = atob(text.trim()); const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0)); return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
export function Base64Tool() {
  const [input, setInput] = useState('Olá, YVA Tools!'); const [output, setOutput] = useState(''); const [error, setError] = useState('');
  const convert = (mode: 'encode' | 'decode') => { try { setOutput(mode === 'encode' ? encodeBase64(input) : decodeBase64(input)); setError(''); } catch { setOutput(''); setError(mode === 'decode' ? 'Base64 inválido ou conteúdo que não é texto UTF-8.' : 'Não foi possível codificar este texto.'); } };
  return <Panel title="Codificador Base64" description="Codifique ou decodifique texto UTF-8, inclusive caracteres acentuados e emojis."><label className="text-field code-field"><span>Texto ou Base64</span><textarea aria-label="Texto ou Base64" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false}/></label><div className="dev-actions"><button className="web-copy primary-copy" onClick={() => convert('encode')}>Codificar</button><button className="text-button" onClick={() => convert('decode')}>Decodificar</button><button className="text-button" onClick={() => { setInput(''); setOutput(''); setError(''); }}>Limpar</button></div>{error && <p className="validation-message" role="alert">{error}</p>}{output && <Output value={output}/>}</Panel>;
}

function createUuid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function UuidGenerator() {
  const [ids, setIds] = useState<string[]>([]); const [count, setCount] = useState(1); const [error, setError] = useState('');
  const generate = () => { try { setIds(Array.from({ length: Math.max(1, Math.min(100, count)) }, createUuid)); setError(''); } catch { setError('O navegador não disponibilizou uma fonte segura de aleatoriedade.'); } };
  return <Panel title="Gerador de UUID v4" description="Gere identificadores aleatórios usando a fonte criptográfica do navegador."><div className="uuid-controls"><label className="text-field"><span>Quantidade</span><NumberField label="Quantidade de UUIDs" min="1" max="100" step="1" value={count} onChange={(raw) => setCount(Math.max(1, Math.min(100, Number(raw) || 1)))}/></label><button className="web-copy primary-copy" onClick={generate}><Dices size={15}/> Gerar UUID</button></div>{error && <p role="alert" className="validation-message">{error}</p>}{ids.map((id) => <div className="format-row uuid-row" key={id}><code>{id}</code><CopyButton value={id}/></div>)}</Panel>;
}

export function HtmlPlayground() {
  const [html, setHtml] = useState('<main>\n  <h1>Olá, YVA Tools!</h1>\n  <p>Edite o HTML, CSS e JavaScript.</p>\n  <button id="hello">Clique aqui</button>\n</main>');
  const [css, setCss] = useState('body { font-family: system-ui; padding: 24px; color: #e8f7fb; background: #071219; }\nh1 { color: #5ee7f7; }\nbutton { padding: 10px 14px; border: 0; border-radius: 8px; color: #071219; background: #5ee7f7; cursor: pointer; }');
  const [js, setJs] = useState("document.querySelector('#hello')?.addEventListener('click', (event) => { event.currentTarget.textContent = 'Funcionou!'; });");
  const safeScript = js.replace(/<\/script/gi, '<\\/script');
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:"><style>${css}</style></head><body>${html}<script>${safeScript}</script></body></html>`;
  return <Panel title="Playground HTML · CSS · JS" description="Experimente código em uma prévia isolada. O conteúdo fica neste dispositivo e roda em um iframe sem acesso à aplicação."><div className="playground-editors"><label className="text-field code-field"><span>HTML</span><textarea aria-label="HTML" spellCheck={false} value={html} onChange={(event) => setHtml(event.target.value)}/></label><label className="text-field code-field"><span>CSS</span><textarea aria-label="CSS" spellCheck={false} value={css} onChange={(event) => setCss(event.target.value)}/></label><label className="text-field code-field"><span>JavaScript</span><textarea aria-label="JavaScript" spellCheck={false} value={js} onChange={(event) => setJs(event.target.value)}/></label></div><h3 className="preview-title">Prévia</h3><iframe className="playground-preview" title="Prévia isolada do código" sandbox="allow-scripts" srcDoc={srcDoc}/></Panel>;
}
