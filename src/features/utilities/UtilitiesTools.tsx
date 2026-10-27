import { useState } from 'react';
import { NumberField as SharedNumberField } from '../../components/NumberField';

export function calculatePercentage(value: number, rate: number) {
  if (![value, rate].every(Number.isFinite)) return null;
  const amount = value * rate / 100;
  return { amount, increased: value + amount, discounted: value - amount };
}

export function recoverOriginalValue(finalValue: number, rate: number, change: 'increase' | 'discount') {
  if (![finalValue, rate].every(Number.isFinite) || finalValue < 0 || rate < 0 || (change === 'discount' && rate >= 100)) return null;
  const factor = change === 'increase' ? 1 + rate / 100 : 1 - rate / 100;
  const original = finalValue / factor;
  return Number.isFinite(original) ? { original, difference: Math.abs(finalValue - original) } : null;
}

export function timestampToDate(timestamp: number, unit: 'seconds' | 'milliseconds') {
  if (!Number.isFinite(timestamp)) return null;
  const milliseconds = unit === 'seconds' ? timestamp * 1000 : timestamp;
  if (!Number.isFinite(milliseconds) || Math.abs(milliseconds) > 8.64e15) return null;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date;
}
export function dateToTimestamp(dateTime: string, unit: 'seconds' | 'milliseconds') {
  if (!dateTime.trim()) return null;
  const milliseconds = new Date(dateTime).getTime();
  if (!Number.isFinite(milliseconds)) return null;
  return unit === 'seconds' ? Math.floor(milliseconds / 1000) : milliseconds;
}

export type BrazilianDocumentKind = 'CPF' | 'CNPJ';
function documentDigits(value: string) { return value.replace(/\D/g, ''); }
export function isValidBrazilianDocument(value: string, kind: BrazilianDocumentKind) {
  const digits = documentDigits(value); const length = kind === 'CPF' ? 11 : 14;
  if (digits.length !== length || /^([0-9])\1+$/.test(digits)) return false;
  const base = digits.slice(0, length - 2).split('').map(Number);
  const weights1 = kind === 'CPF' ? Array.from({ length: 9 }, (_, i) => 10 - i) : [5,4,3,2,9,8,7,6,5,4,3,2];
  const weights2 = kind === 'CPF' ? Array.from({ length: 10 }, (_, i) => 11 - i) : [6,5,4,3,2,9,8,7,6,5,4,3,2];
  const digit = (values: number[], weights: number[]) => { const remainder = values.reduce((sum, item, index) => sum + item * weights[index]!, 0) % 11; return remainder < 2 ? 0 : 11 - remainder; };
  const first = digit(base, weights1); const second = digit([...base, first], weights2);
  return digits.endsWith(`${first}${second}`);
}
export function generateBrazilianDocument(kind: BrazilianDocumentKind) {
  const baseLength = kind === 'CPF' ? 9 : 12; const bytes = new Uint32Array(1); const randomDigit = () => { do { globalThis.crypto.getRandomValues(bytes); } while (bytes[0]! >= Math.floor(2 ** 32 / 10) * 10); return bytes[0]! % 10; };
  const base = Array.from({ length: baseLength }, randomDigit).join('');
  const firstWeights = kind === 'CPF' ? Array.from({ length: 9 }, (_, i) => 10 - i) : [5,4,3,2,9,8,7,6,5,4,3,2];
  const secondWeights = kind === 'CPF' ? Array.from({ length: 10 }, (_, i) => 11 - i) : [6,5,4,3,2,9,8,7,6,5,4,3,2];
  const digit = (values: string, weights: number[]) => { const remainder = [...values].reduce((sum, item, index) => sum + Number(item) * weights[index]!, 0) % 11; return remainder < 2 ? 0 : 11 - remainder; };
  const first = digit(base, firstWeights); return `${base}${first}${digit(`${base}${first}`, secondWeights)}`;
}

export function solveRuleOfThree(a: number, b: number, c: number) {
  if (![a, b, c].every(Number.isFinite) || a === 0) return null;
  const result = b * c / a;
  return Number.isFinite(result) ? result : null;
}

export function calculateBmi(weightKg: number, heightCm: number) {
  if (![weightKg, heightCm].every(Number.isFinite) || weightKg <= 0 || heightCm <= 0) return null;
  const bmi = weightKg / ((heightCm / 100) ** 2);
  return Number.isFinite(bmi) ? bmi : null;
}

export function summarizeNumbers(values: number[]) {
  if (!values.length || values.some((value) => !Number.isFinite(value))) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (![mean, median].every(Number.isFinite)) return null;
  return { mean, median, range: sorted[sorted.length - 1] - sorted[0], count: values.length };
}

export function splitBill(total: number, tipPercent: number, people: number) {
  if (![total, tipPercent, people].every(Number.isFinite) || total < 0 || tipPercent < 0 || !Number.isInteger(people) || people < 1) return null;
  const tip = total * tipPercent / 100;
  const finalTotal = total + tip;
  return Number.isFinite(finalTotal) ? { tip, total: finalTotal, each: finalTotal / people } : null;
}

export function daysBetweenDates(start: string, end: string) {
  const parse = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
    const stamp = Date.UTC(year, month - 1, day);
    const date = new Date(stamp);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? stamp : null;
  };
  const a = parse(start); const b = parse(end);
  return a === null || b === null ? null : Math.abs(b - a) / 86400000;
}

type UnitKind = 'comprimento' | 'massa' | 'volume' | 'temperatura';
const units: Record<Exclude<UnitKind, 'temperatura'>, Record<string, number>> = {
  comprimento: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048 },
  massa: { mg: 0.001, g: 1, kg: 1000, lb: 453.59237 },
  volume: { ml: 0.001, l: 1, m3: 1000, cup: 0.2365882365 },
};
export function convertMeasurement(value: number, kind: UnitKind, from: string, to: string) {
  if (!Number.isFinite(value)) return null;
  if (kind === 'temperatura') {
    const celsius = from === '°C' ? value : from === '°F' ? (value - 32) * 5 / 9 : value - 273.15;
    const result = to === '°C' ? celsius : to === '°F' ? celsius * 9 / 5 + 32 : celsius + 273.15;
    return Number.isFinite(result) ? result : null;
  }
  const table = units[kind];
  if (!(from in table) || !(to in table)) return null;
  const result = value * table[from] / table[to];
  return Number.isFinite(result) ? result : null;
}

function ipv4ToNumber(address: string) {
  const parts = address.trim().split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
  return parts.reduce((value, part) => (value * 256 + Number(part)) >>> 0, 0);
}
function numberToIpv4(value: number) { return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.'); }
export function calculateIpv4Subnet(address: string, prefix: number) {
  const ip = ipv4ToNumber(address);
  if (ip === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const totalAddresses = 2 ** (32 - prefix);
  const usableHosts = prefix >= 31 ? totalAddresses : Math.max(0, totalAddresses - 2);
  return { mask: numberToIpv4(mask), network: numberToIpv4(network), broadcast: numberToIpv4(broadcast), firstHost: prefix <= 30 ? numberToIpv4(network + 1) : numberToIpv4(network), lastHost: prefix <= 30 ? numberToIpv4(broadcast - 1) : numberToIpv4(broadcast), totalAddresses, usableHosts };
}
export function calculateTransferSeconds(sizeMB: number, speedMbps: number) {
  if (![sizeMB, speedMbps].every(Number.isFinite) || sizeMB <= 0 || speedMbps <= 0) return null;
  const seconds = sizeMB * 8 / speedMbps;
  return Number.isFinite(seconds) ? seconds : null;
}
export function calculateVideoStorage(durationSeconds: number, videoMbps: number, audioKbps: number) {
  if (![durationSeconds, videoMbps, audioKbps].every(Number.isFinite) || durationSeconds <= 0 || videoMbps < 0 || audioKbps < 0 || videoMbps + audioKbps / 1000 <= 0) return null;
  const bytes = durationSeconds * (videoMbps + audioKbps / 1000) * 1_000_000 / 8;
  return Number.isFinite(bytes) ? { mb: bytes / 1_000_000, gb: bytes / 1_000_000_000 } : null;
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="web-tool-panel"><header className="web-panel-heading"><h2>{title}</h2><p>{description}</p></header>{children}</section>; }
function NumberField({ label, value, onChange, unit }: { label: string; value: string; onChange: (value: string) => void; unit?: string }) { return <label className="text-field"><span>{label}</span><SharedNumberField label={label} value={value} onChange={onChange} unit={unit} step="any"/></label>; }
function Result({ children }: { children: React.ReactNode }) { return <div className="electronics-results"><div className="electronics-result"><span>Resultado</span><strong>{children}</strong></div></div>; }
function ErrorMessage({ children }: { children: React.ReactNode }) { return <p className="validation-message" role="alert">{children}</p>; }

function PercentageTool() {
  const [value, setValue] = useState('100'); const [rate, setRate] = useState('15');
  const result = calculatePercentage(Number(value), Number(rate)); const invalid = value.trim() === '' || rate.trim() === '' || !result;
  return <Panel title="Calculadora de porcentagem" description="Veja o valor percentual e simule acréscimo ou desconto sobre um valor base."><div className="electronics-fields"><NumberField label="Valor base" value={value} onChange={setValue} unit="unidade monetária ou valor"/><NumberField label="Percentual" value={rate} onChange={setRate} unit="%"/></div>{invalid ? <ErrorMessage>Informe valores numéricos válidos.</ErrorMessage> : <div className="electronics-results">{[['Percentual', result.amount], ['Com acréscimo', result.increased], ['Com desconto', result.discounted]].map(([label, number]) => <div className="electronics-result" key={label as string}><span>{label}</span><strong>{Number(number).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</strong></div>)}</div>}</Panel>;
}

function ReversePercentageTool() {
  const [finalValue, setFinalValue] = useState('85'); const [rate, setRate] = useState('15'); const [change, setChange] = useState<'increase' | 'discount'>('discount');
  const result = recoverOriginalValue(Number(finalValue), Number(rate), change);
  return <Panel title="Porcentagem reversa" description="Descubra o valor original antes de um acréscimo ou desconto percentual."><div className="electronics-fields"><NumberField label="Valor final" value={finalValue} onChange={setFinalValue} unit="R$"/><NumberField label="Percentual aplicado" value={rate} onChange={setRate} unit="%"/></div><label className="text-field"><span>O valor final veio de</span><select className="select-control" value={change} onChange={(event) => setChange(event.target.value as typeof change)}><option value="discount">Um desconto</option><option value="increase">Um acréscimo</option></select></label>{finalValue.trim() === '' || rate.trim() === '' || !result ? <ErrorMessage>Informe valores válidos. O desconto precisa ser menor que 100%.</ErrorMessage> : <div className="electronics-results"><div className="electronics-result"><span>Valor original estimado</span><strong>R$ {result.original.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div><div className="electronics-result"><span>Diferença aplicada</span><strong>R$ {result.difference.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div></div>}<p className="electronics-note">Exemplo: se R$ 85 já inclui 15% de desconto, o valor original era R$ 100.</p></Panel>;
}

function TimestampTool() {
  const [mode, setMode] = useState<'to-date' | 'to-timestamp'>('to-date'); const [unit, setUnit] = useState<'seconds' | 'milliseconds'>('seconds'); const [value, setValue] = useState('');
  const date = mode === 'to-date' && value.trim() ? timestampToDate(Number(value), unit) : null;
  const timestamp = mode === 'to-timestamp' ? dateToTimestamp(value, unit) : null;
  return <Panel title="Conversor de timestamp Unix" description="Converta timestamps em segundos ou milissegundos e datas locais. Os resultados de data incluem UTC e horário do seu dispositivo."><div className="file-tabs"><button className={mode === 'to-date' ? 'selected' : ''} onClick={() => { setMode('to-date'); setValue(''); }}>Timestamp → data</button><button className={mode === 'to-timestamp' ? 'selected' : ''} onClick={() => { setMode('to-timestamp'); setValue(''); }}>Data → timestamp</button></div><label className="text-field"><span>Unidade do timestamp</span><select className="select-control" value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)}><option value="seconds">Segundos</option><option value="milliseconds">Milissegundos</option></select></label>{mode === 'to-date' ? <label className="text-field"><span>Timestamp Unix</span><input inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} placeholder={unit === 'seconds' ? 'Ex.: 1735689600' : 'Ex.: 1735689600000'}/></label> : <label className="text-field"><span>Data e hora local</span><input type="datetime-local" value={value} onChange={(event) => setValue(event.target.value)}/></label>}{value.trim() && (mode === 'to-date' ? date ? <div className="electronics-results"><div className="electronics-result"><span>Data e hora local</span><strong>{date.toLocaleString('pt-BR')}</strong></div><div className="electronics-result"><span>UTC ISO 8601</span><strong>{date.toISOString()}</strong></div></div> : <ErrorMessage>Timestamp inválido ou fora do intervalo aceito por datas do JavaScript.</ErrorMessage> : timestamp === null ? <ErrorMessage>Escolha uma data e hora válida.</ErrorMessage> : <div className="electronics-result"><span>Timestamp ({unit === 'seconds' ? 'segundos' : 'milissegundos'})</span><strong>{timestamp}</strong></div>)}</Panel>;
}

function BrazilianDocumentTool() { const [kind, setKind] = useState<BrazilianDocumentKind>('CPF'); const [value, setValue] = useState(''); const [generated, setGenerated] = useState(''); const valid = value.trim() ? isValidBrazilianDocument(value, kind) : null; const generate = () => { try { setGenerated(generateBrazilianDocument(kind)); } catch { setGenerated(''); } }; return <Panel title="Gerador e validador de CPF/CNPJ" description="Valide os dígitos verificadores ou gere números aleatórios sintaticamente válidos para testes. Não identifica nem consulta pessoas/empresas."><label className="text-field"><span>Documento</span><select className="select-control" value={kind} onChange={(event) => { setKind(event.target.value as BrazilianDocumentKind); setValue(''); setGenerated(''); }}><option>CPF</option><option>CNPJ</option></select></label><label className="text-field"><span>{kind} para validar</span><input value={value} onChange={(event) => setValue(event.target.value)} placeholder={kind === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'} inputMode="numeric"/></label>{valid !== null && <p className={valid ? 'file-message' : 'validation-message'} role={valid ? 'status' : 'alert'}>{valid ? `${kind} válido pelos dígitos verificadores.` : `${kind} inválido.`}</p>}<div className="dev-actions"><button className="primary-button" onClick={generate}>Gerar número de teste</button><button className="text-button" onClick={() => { setValue(''); setGenerated(''); }}>Limpar</button></div>{generated && <div className="dev-output"><pre>{generated}</pre><p className="electronics-note">Número aleatório de teste, não associado a um cadastro conhecido. Não use para se passar por outra pessoa.</p></div>}</Panel>; }

function RuleOfThreeTool() {
  const [values, setValues] = useState(['2', '10', '5']); const result = solveRuleOfThree(...values.map(Number) as [number, number, number]);
  return <Panel title="Regra de três simples" description="Para a proporção A está para B assim como C está para X, calcule X = B × C ÷ A."><div className="electronics-fields">{values.map((value, i) => <NumberField key={i} label={['A', 'B', 'C'][i]} value={value} onChange={(next) => setValues((current) => current.map((item, index) => index === i ? next : item))}/>)}</div>{values.some((v) => !v.trim()) || result === null ? <ErrorMessage>Preencha valores válidos e use A diferente de zero.</ErrorMessage> : <Result>{Number(result.toPrecision(8)).toLocaleString('pt-BR')}</Result>}<p className="electronics-note">Esta calculadora assume proporcionalidade direta.</p></Panel>;
}

function BmiTool() {
  const [weight, setWeight] = useState('70'); const [height, setHeight] = useState('170'); const result = calculateBmi(Number(weight), Number(height));
  const classification = result === null ? '' : result < 18.5 ? 'Abaixo da faixa de referência' : result < 25 ? 'Faixa de referência usual' : result < 30 ? 'Acima da faixa de referência' : 'Bem acima da faixa de referência';
  return <Panel title="Calculadora de IMC" description="Calcule o índice usando peso em quilogramas e altura em centímetros."><div className="electronics-fields"><NumberField label="Peso" value={weight} onChange={setWeight} unit="kg"/><NumberField label="Altura" value={height} onChange={setHeight} unit="cm"/></div>{weight.trim() === '' || height.trim() === '' || result === null ? <ErrorMessage>Informe peso e altura maiores que zero.</ErrorMessage> : <div className="electronics-results"><div className="electronics-result"><span>IMC estimado</span><strong>{result.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</strong></div><div className="electronics-result"><span>Referência geral para adultos</span><strong>{classification}</strong></div></div>}<p className="electronics-note">O IMC é uma estimativa geral e não substitui avaliação de um profissional de saúde. As faixas variam por idade e contexto.</p></Panel>;
}

const unitOptions: Record<UnitKind, string[]> = { comprimento: ['mm', 'cm', 'm', 'km', 'in', 'ft'], massa: ['mg', 'g', 'kg', 'lb'], volume: ['ml', 'l', 'm3', 'cup'], temperatura: ['°C', '°F', 'K'] };
function UnitTool() {
  const [kind, setKind] = useState<UnitKind>('comprimento'); const [value, setValue] = useState('1'); const [from, setFrom] = useState('m'); const [to, setTo] = useState('cm');
  const options = unitOptions[kind]; const source = options.includes(from) ? from : options[0]; const target = options.includes(to) ? to : options[1] ?? options[0];
  const result = convertMeasurement(Number(value), kind, source, target);
  const changeKind = (next: UnitKind) => { setKind(next); setFrom(unitOptions[next][0]); setTo(unitOptions[next][1]); };
  return <Panel title="Conversor de unidades" description="Converta medidas de comprimento, massa, volume e temperatura localmente."><label className="text-field"><span>Categoria</span><select className="select-control" value={kind} onChange={(event) => changeKind(event.target.value as UnitKind)}><option value="comprimento">Comprimento</option><option value="massa">Massa</option><option value="volume">Volume</option><option value="temperatura">Temperatura</option></select></label><div className="electronics-fields"><NumberField label="Valor" value={value} onChange={setValue}/><label className="text-field"><span>De</span><select className="select-control" value={source} onChange={(event) => setFrom(event.target.value)}>{options.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label className="text-field"><span>Para</span><select className="select-control" value={target} onChange={(event) => setTo(event.target.value)}>{options.map((unit) => <option key={unit}>{unit}</option>)}</select></label></div>{value.trim() === '' || result === null ? <ErrorMessage>Informe um valor numérico válido.</ErrorMessage> : <Result>{Number(result.toPrecision(10)).toLocaleString('pt-BR')} {target}</Result>}</Panel>;
}

function AverageTool() {
  const [input, setInput] = useState('7, 8.5, 9, 6.5');
  const parts = input.split(/[\s,;]+/).filter(Boolean); const values = parts.map(Number);
  const result = parts.length && values.every(Number.isFinite) ? summarizeNumbers(values) : null;
  return <Panel title="Calculadora de média" description="Informe valores separados por vírgula, espaço ou ponto e vírgula."><label className="text-field"><span>Valores</span><textarea rows={4} value={input} onChange={(event) => setInput(event.target.value)} aria-label="Valores para calcular"/></label>{!result ? <ErrorMessage>Digite ao menos um número válido. Para decimais, use ponto ou vírgula como separador de lista (decimal com ponto).</ErrorMessage> : <div className="electronics-results">{[['Média', result.mean], ['Mediana', result.median], ['Amplitude', result.range], ['Quantidade', result.count]].map(([label, number]) => <div className="electronics-result" key={label as string}><span>{label}</span><strong>{Number(number).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</strong></div>)}</div>}</Panel>;
}

function BillTool() {
  const [amount, setAmount] = useState('120'); const [tip, setTip] = useState('10'); const [people, setPeople] = useState('3');
  const result = splitBill(Number(amount), Number(tip), Number(people)); const empty = [amount, tip, people].some((v) => !v.trim());
  return <Panel title="Divisor de conta" description="Some uma gorjeta percentual e divida o total igualmente entre as pessoas."><div className="electronics-fields"><NumberField label="Valor da conta" value={amount} onChange={setAmount} unit="R$"/><NumberField label="Gorjeta" value={tip} onChange={setTip} unit="%"/><NumberField label="Pessoas" value={people} onChange={setPeople} unit="pessoas"/></div>{empty || result === null ? <ErrorMessage>Use valores não negativos e uma quantidade inteira de pessoas maior que zero.</ErrorMessage> : <div className="electronics-results">{[['Gorjeta', result.tip], ['Total com gorjeta', result.total], ['Por pessoa', result.each]].map(([label, number]) => <div className="electronics-result" key={label as string}><span>{label}</span><strong>R$ {Number(number).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>)}</div>}<p className="electronics-note">A divisão pode gerar frações de centavo; o valor exibido por pessoa é arredondado para centavos.</p></Panel>;
}

function DateTool() {
  const today = new Date(); const localIso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const [start, setStart] = useState(localIso); const [end, setEnd] = useState(localIso); const result = daysBetweenDates(start, end);
  return <Panel title="Calculadora de datas" description="Conte os dias corridos entre duas datas, sem depender do fuso horário do dispositivo."><div className="electronics-fields"><label className="text-field"><span>Data inicial</span><input type="date" value={start} onChange={(event) => setStart(event.target.value)}/></label><label className="text-field"><span>Data final</span><input type="date" value={end} onChange={(event) => setEnd(event.target.value)}/></label></div>{result === null ? <ErrorMessage>Escolha duas datas válidas.</ErrorMessage> : <Result>{result.toLocaleString('pt-BR')} {result === 1 ? 'dia' : 'dias'}</Result>}<p className="electronics-note">O cálculo usa dias corridos e conta a distância entre as datas; não inclui ambos os dias como uma contagem inclusiva.</p></Panel>;
}

function SubnetTool() {
  const [ip, setIp] = useState('192.168.1.10'); const [prefix, setPrefix] = useState('24');
  const result = calculateIpv4Subnet(ip, Number(prefix));
  return <Panel title="Calculadora de sub-redes IPv4" description="Informe um endereço IPv4 e o prefixo CIDR para ver a rede correspondente."><div className="electronics-fields"><label className="text-field"><span>Endereço IPv4</span><input value={ip} onChange={(event) => setIp(event.target.value)} placeholder="192.168.1.10" inputMode="decimal"/></label><label className="text-field"><span>Prefixo CIDR (0–32)</span><SharedNumberField label="Prefixo CIDR" value={prefix} onChange={setPrefix} min="0" max="32" step="1"/></label></div>{!result ? <ErrorMessage>Informe quatro octetos de 0 a 255 e um prefixo inteiro entre 0 e 32.</ErrorMessage> : <div className="conversion-grid">{[['Endereço de rede', result.network], ['Máscara', result.mask], ['Broadcast', result.broadcast], ['Primeiro endereço utilizável', result.firstHost], ['Último endereço utilizável', result.lastHost], ['Endereços totais', result.totalAddresses.toLocaleString('pt-BR')], ['Hosts utilizáveis¹', result.usableHosts.toLocaleString('pt-BR')]].map(([label, value]) => <div className="format-row" key={label as string}><span>{label}</span><code>{value}</code></div>)}</div>}<p className="electronics-note">¹ Para /31 e /32 são usadas regras de enlaces ponto a ponto e endereços individuais; confirme a convenção da sua rede.</p></Panel>;
}
function formatDuration(seconds: number) { if (seconds < 60) return `${seconds.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`; const mins = seconds / 60; if (mins < 60) return `${mins.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} min`; return `${(mins / 60).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} h`; }
function TransferTool() {
  const [size, setSize] = useState('1000'); const [speed, setSpeed] = useState('100'); const seconds = calculateTransferSeconds(Number(size), Number(speed));
  return <Panel title="Calculadora de transferência" description="Estime o tempo teórico para transferir um arquivo com a velocidade informada."><div className="electronics-fields"><NumberField label="Tamanho do arquivo" value={size} onChange={setSize} unit="MB decimais"/><NumberField label="Velocidade efetiva" value={speed} onChange={setSpeed} unit="Mbps"/></div>{size.trim() === '' || speed.trim() === '' || seconds === null ? <ErrorMessage>Use valores positivos de tamanho e velocidade.</ErrorMessage> : <div className="electronics-results"><div className="electronics-result"><span>Tempo teórico</span><strong>{formatDuration(seconds)}</strong></div></div>}<p className="electronics-note">Estimativa ideal: protocolos, congestionamento, Wi‑Fi e variações da conexão podem aumentar o tempo real. Mbps (megabits/s) não é MB/s (megabytes/s).</p></Panel>;
}
function VideoStorageTool() {
  const [minutes, setMinutes] = useState('10'); const [video, setVideo] = useState('8'); const [audio, setAudio] = useState('192');
  const result = calculateVideoStorage(Number(minutes) * 60, Number(video), Number(audio));
  return <Panel title="Calculadora de espaço para vídeo" description="Estime o tamanho de uma gravação pela duração e pelos bitrates de vídeo e áudio."><div className="electronics-fields"><NumberField label="Duração" value={minutes} onChange={setMinutes} unit="minutos"/><NumberField label="Bitrate do vídeo" value={video} onChange={setVideo} unit="Mbps"/><NumberField label="Bitrate do áudio" value={audio} onChange={setAudio} unit="kbps"/></div>{minutes.trim() === '' || video.trim() === '' || audio.trim() === '' || !result ? <ErrorMessage>Informe duração maior que zero e bitrates válidos (pelo menos um maior que zero).</ErrorMessage> : <div className="electronics-results"><div className="electronics-result"><span>Tamanho estimado</span><strong>{result.gb >= 1 ? `${result.gb.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GB` : `${result.mb.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`}</strong></div></div>}<p className="electronics-note">Estimativa decimal baseada no bitrate constante; contêiner, bitrate variável e metadados podem alterar o tamanho final.</p></Panel>;
}

export function UtilitiesTool({ slug }: { slug: string }) {
  switch (slug) {
    case 'calculadora-porcentagem': return <PercentageTool/>;
    case 'porcentagem-reversa': return <ReversePercentageTool/>;
    case 'timestamp-converter': return <TimestampTool/>;
    case 'cpf-cnpj': return <BrazilianDocumentTool/>;
    case 'regra-de-tres': return <RuleOfThreeTool/>;
    case 'imc': return <BmiTool/>;
    case 'conversor-unidades': return <UnitTool/>;
    case 'media-numerica': return <AverageTool/>;
    case 'divisor-conta': return <BillTool/>;
    case 'diferenca-datas': return <DateTool/>;
    case 'calculadora-subredes': return <SubnetTool/>;
    case 'tempo-transferencia': return <TransferTool/>;
    case 'armazenamento-video': return <VideoStorageTool/>;
    default: return null;
  }
}
