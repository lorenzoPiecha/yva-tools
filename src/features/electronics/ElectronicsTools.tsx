import { useEffect, useMemo, useState } from 'react';
import { Activity, CircuitBoard, ExternalLink, Lightbulb, Zap } from 'lucide-react';
import { NumberField, parseEngineeringNumber } from '../../components/NumberField';
import { CalculationDetails } from '../../components/CalculationDetails';
import { ComponentFinder, BoardMapTool, DiagnosticGuide, RepairQuoteTool, SmdDecoder } from './ElectronicsExtras';
import { AwgTableTool, Lm317Tool, PinoutReferenceTool, RcFilterTool, SiPrefixTool, Timer555Tool } from './ElectronicsRequested';

type OhmValues = { voltage: number; current: number; resistance: number; power: number };

export function solveOhm(values: Array<number | null>): OhmValues | null {
  const active = values.map((value, index) => value !== null ? index : -1).filter((index) => index >= 0);
  if (active.length !== 2) return null;
  const [i, j] = active;
  const a = values[i] as number; const b = values[j] as number;
  if (![a, b].every((value) => Number.isFinite(value) && value > 0)) return null;
  const keys = ['0-1', '0-2', '0-3', '1-2', '1-3', '2-3'];
  const map: Record<string, OhmValues> = {
    '0-1': { voltage: a, current: b, resistance: a / b, power: a * b },
    '0-2': { voltage: a, current: a / b, resistance: b, power: a * a / b },
    '0-3': { voltage: a, current: b / a, resistance: a * a / b, power: b },
    '1-2': { voltage: a * b, current: a, resistance: b, power: a * a * b },
    '1-3': { voltage: b / a, current: a, resistance: b / (a * a), power: b },
    '2-3': { voltage: Math.sqrt(a * b), current: Math.sqrt(b / a), resistance: a, power: b },
  };
  const result = map[keys.find((key) => key === `${i}-${j}`)!];
  return Object.values(result).every(Number.isFinite) ? result : null;
}

export function equivalentResistance(values: number[], mode: 'series' | 'parallel'): number | null {
  if (values.length < 2 || values.some((value) => !Number.isFinite(value) || value <= 0)) return null;
  const result = mode === 'series' ? values.reduce((sum, value) => sum + value, 0) : 1 / values.reduce((sum, value) => sum + 1 / value, 0);
  return Number.isFinite(result) && result > 0 ? result : null;
}

export function calculateLedResistor(sourceVoltage: number, ledVoltage: number, currentMa: number) {
  if (![sourceVoltage, ledVoltage, currentMa].every(Number.isFinite) || sourceVoltage <= ledVoltage || ledVoltage < 0 || currentMa <= 0) return null;
  const current = currentMa / 1000;
  const resistance = (sourceVoltage - ledVoltage) / current;
  const power = (sourceVoltage - ledVoltage) * current;
  const standard = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82].flatMap((base) => [1, 10, 100, 1000, 10000].map((scale) => base * scale)).sort((a, b) => a - b).find((value) => value >= resistance) ?? resistance;
  return { resistance, standard, power };
}

export function calculateConsumption(powerW: number, hoursPerDay: number, days: number, pricePerKwh: number) {
  if (![powerW, hoursPerDay, days, pricePerKwh].every(Number.isFinite) || powerW < 0 || hoursPerDay < 0 || hoursPerDay > 24 || days < 0 || pricePerKwh < 0) return null;
  const kwh = powerW * hoursPerDay * days / 1000;
  return { kwh, cost: kwh * pricePerKwh };
}

export function calculateVoltageDivider(inputVoltage: number, upperResistance: number, lowerResistance: number) {
  if (![inputVoltage, upperResistance, lowerResistance].every(Number.isFinite) || inputVoltage <= 0 || upperResistance <= 0 || lowerResistance <= 0) return null;
  const total = upperResistance + lowerResistance;
  const current = inputVoltage / total;
  const output = inputVoltage * lowerResistance / total;
  const powerUpper = (inputVoltage - output) ** 2 / upperResistance;
  const powerLower = output ** 2 / lowerResistance;
  return [total, current, output, powerUpper, powerLower].every(Number.isFinite) ? { output, currentMa: current * 1000, powerUpper, powerLower } : null;
}

const resistorDigits = { Preto: 0, Marrom: 1, Vermelho: 2, Laranja: 3, Amarelo: 4, Verde: 5, Azul: 6, Violeta: 7, Cinza: 8, Branco: 9 } as const;
type ResistorDigit = keyof typeof resistorDigits;
const multipliers: Record<string, number> = { ...Object.fromEntries(Object.entries(resistorDigits).map(([color, digit]) => [color, 10 ** digit])), Ouro: 0.1, Prata: 0.01 };
const tolerances: Record<string, number> = { Marrom: 1, Vermelho: 2, Verde: 0.5, Azul: 0.25, Violeta: 0.1, Cinza: 0.05, Ouro: 5, Prata: 10 };
export function calculateResistorBands(bands: string[]) {
  if (![4, 5, 6].includes(bands.length)) return null;
  const significantCount = bands.length === 4 ? 2 : 3;
  const digits = bands.slice(0, significantCount).map((color) => resistorDigits[color as ResistorDigit]);
  const multiplier = multipliers[bands[significantCount]!]; const tolerance = tolerances[bands[significantCount + 1]!];
  if (digits.some((digit) => digit === undefined) || multiplier === undefined || tolerance === undefined) return null;
  const significant = Number(digits.join(''));
  if (significant === 0 && bands[0] === 'Preto') return null;
  const resistance = significant * multiplier;
  if (!Number.isFinite(resistance)) return null;
  const ppm = bands.length === 6 ? ({ Marrom: 100, Vermelho: 50, Laranja: 15, Amarelo: 25, Azul: 10, Violeta: 5 } as Record<string, number>)[bands[5]!] : undefined;
  if (bands.length === 6 && ppm === undefined) return null;
  return { resistance, tolerance, ppm };
}

export function equivalentCapacitance(values: number[], mode: 'series' | 'parallel') {
  if (values.length < 2 || values.some((value) => !Number.isFinite(value) || value <= 0)) return null;
  const result = mode === 'parallel' ? values.reduce((sum, value) => sum + value, 0) : 1 / values.reduce((sum, value) => sum + 1 / value, 0);
  return Number.isFinite(result) && result > 0 ? result : null;
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="web-tool-panel"><header className="web-panel-heading"><h2>{title}</h2><p>{description}</p></header>{children}</section>; }
function Field({ label, value, onChange, unit, min = '0', step = 'any', max }: { label: string; value: string; onChange: (value: string) => void; unit: string; min?: string; max?: string; step?: string }) { return <label className="text-field"><span>{label}</span><NumberField label={label} value={value} onChange={onChange} unit={unit} min={min} max={max} step={step}/></label>; }
export function formatEngineeringResult(value: number, unit: string) {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  let factor = 1;
  let prefix = '';
  if (magnitude >= 1e9) { factor = 1e9; prefix = 'G'; }
  else if (magnitude >= 1e6) { factor = 1e6; prefix = 'M'; }
  else if (magnitude >= 1e3) { factor = 1e3; prefix = 'k'; }
  else if (magnitude > 0 && magnitude < 1e-9) { factor = 1e-12; prefix = 'p'; }
  else if (magnitude > 0 && magnitude < 1e-6) { factor = 1e-9; prefix = 'n'; }
  else if (magnitude > 0 && magnitude < 1e-3) { factor = 1e-6; prefix = 'µ'; }
  else if (magnitude > 0 && magnitude < 1 && ['A', 'V', 'W', 'F'].includes(unit)) { factor = 1e-3; prefix = 'm'; }
  const scaled = Number((value / factor).toPrecision(6));
  return `${scaled.toLocaleString('pt-BR')} ${prefix}${unit}`;
}
function Result({ label, value, unit }: { label: string; value: number; unit: string }) { return <div className="electronics-result"><span>{label}</span><strong>{formatEngineeringResult(value, unit)}</strong></div>; }
function Invalid({ children = 'Confira os valores: use números positivos e unidades compatíveis.' }: { children?: string }) { return <p className="validation-message" role="alert">{children}</p>; }

const chipManufacturers = [
  ['Texas Instruments', 'ti.com'], ['STMicroelectronics', 'st.com'],
  ['Microchip', 'microchip.com'], ['onsemi', 'onsemi.com'],
  ['NXP', 'nxp.com'], ['Renesas', 'renesas.com'], ['Infineon', 'infineon.com'],
] as const;
export function buildDatasheetSearch(code: string, domain?: string) {
  const part = code.trim();
  if (!part) return '';
  const query = `${part} datasheet pinout ${domain ? `site:${domain}` : ''}`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
export function buildSchematicSearch(fields: { manufacturer: string; model: string; board: string; chip: string }, officialOnly = false) {
  const terms = [fields.manufacturer, fields.model, fields.board, fields.chip, 'esquema elétrico manual de serviço service manual'].map((value) => value.trim()).filter(Boolean);
  if (terms.length === 0) return '';
  if (officialOnly && fields.manufacturer.trim()) terms.push('site oficial suporte documentação');
  return `https://www.google.com/search?q=${encodeURIComponent(terms.join(' '))}`;
}

function ResearchLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="text-button research-link" href={href} target="_blank" rel="noopener noreferrer">{children}<ExternalLink size={13}/></a>;
}
function IcResearchTool() {
  const [code, setCode] = useState('');
  const valid = code.trim().length > 0;
  return <Panel title="Pesquisador de circuitos integrados" description="Encontre datasheets e documentação técnica a partir do código marcado no componente."><label className="text-field"><span>Código do CI</span><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ex.: UC3842, LM358, NE555" autoCapitalize="characters" /></label><p className="electronics-note">As buscas abrem páginas externas em uma nova aba. Confirme fabricante, sufixo, encapsulamento e revisão no datasheet. Não inferimos pinagem nem equivalência automaticamente.</p>{valid && <div className="research-results"><h3>Buscar documentação do fabricante</h3><div className="research-links">{chipManufacturers.map(([name, domain]) => <ResearchLink key={domain} href={buildDatasheetSearch(code, domain)}>{name}</ResearchLink>)}<ResearchLink href={buildDatasheetSearch(code)}>Busca geral</ResearchLink></div></div>}<p className="electronics-note">Exemplo conferido na documentação: <a href="https://www.ti.com/product/UC3842" target="_blank" rel="noopener noreferrer">TI UC3842</a>. A página oficial disponibiliza o datasheet da família UCx84x; confirme sempre a variante exata antes de aplicar dados ao circuito.</p></Panel>;
}
function SchematicSearchTool() {
  const [fields, setFields] = useState({ manufacturer: '', model: '', board: '', chip: '' });
  const set = (key: keyof typeof fields) => (value: string) => setFields((prev) => ({ ...prev, [key]: value }));
  const populated = Object.values(fields).some((value) => value.trim());
  const names: Array<[keyof typeof fields, string, string]> = [['manufacturer', 'Fabricante', 'Ex.: Samsung'], ['model', 'Modelo do aparelho', 'Ex.: UN32...'], ['board', 'Código da placa ou fonte', 'Ex.: BN44-...'], ['chip', 'CI principal (opcional)', 'Ex.: UC3842']];
  return <Panel title="Buscador de esquemas e manuais" description="Monte consultas com os identificadores do equipamento para localizar diagramas e documentação técnica."><div className="electronics-fields">{names.map(([key, label, placeholder]) => <label className="text-field" key={key}><span>{label}</span><input value={fields[key]} onChange={(event) => set(key)(event.target.value)} placeholder={placeholder}/></label>)}</div>{populated && <div className="research-results"><h3>Pesquisar documentação</h3><div className="research-links"><ResearchLink href={buildSchematicSearch(fields)}>Busca ampla</ResearchLink><ResearchLink href={buildSchematicSearch(fields, true)}>Busca no domínio informado</ResearchLink></div></div>}<p className="electronics-note">Compare modelo completo, código da placa e revisão antes de usar qualquer esquema. Resultados da web podem estar incompletos, desatualizados ou não corresponder à variante.</p><p className="research-safety">Atenção: fontes e equipamentos podem manter tensões perigosas após serem desligados. Use procedimentos de segurança e documentação compatíveis com sua qualificação.</p></Panel>;
}

type BenchRecord = { id: string; createdAt: string; equipment: string; board: string; symptom: string; readings: string; findings: string };
const BENCH_KEY = 'yva-tools:bench-records';
function readBenchRecords(): BenchRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(BENCH_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is BenchRecord => item && typeof item.id === 'string' && typeof item.equipment === 'string' && typeof item.symptom === 'string') : [];
  } catch { return []; }
}
export function RepairNotebook() {
  const [records, setRecords] = useState(readBenchRecords);
  const [form, setForm] = useState({ equipment: '', board: '', symptom: '', readings: '', findings: '' });
  useEffect(() => { try { localStorage.setItem(BENCH_KEY, JSON.stringify(records)); } catch { /* Quota or private browsing: keep this session usable. */ } }, [records]);
  const set = (key: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const add = (event: React.FormEvent) => { event.preventDefault(); if (!form.equipment.trim() || !form.symptom.trim()) return; setRecords((current) => [{ ...form, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString() }, ...current].slice(0, 200)); setForm({ equipment: '', board: '', symptom: '', readings: '', findings: '' }); };
  const exportRecords = () => { const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'yva-registros-de-bancada.json'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const exportRepairPdf = async () => { const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib'); const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); for (const record of records) { const page = pdf.addPage([595, 842]); let y = 790; page.drawText('YVA TOOLS · FICHA DE REPARO', { x: 42, y, size: 16, font, color: rgb(0.02, 0.55, 0.62) }); y -= 34; const lines = [`Data: ${new Date(record.createdAt).toLocaleString('pt-BR')}`, `Equipamento: ${record.equipment}`, `Placa/fonte: ${record.board || 'Não informado'}`, `Sintoma: ${record.symptom}`, `Medições: ${record.readings || 'Não informado'}`, `Inspeção, hipóteses e resultado: ${record.findings || 'Não informado'}`]; for (const line of lines) { const chunks = line.match(/.{1,78}(?:\s|$)/g) ?? [line]; for (const part of chunks) { if (y < 65) break; page.drawText(part.trim(), { x: 42, y, size: 10, font, maxWidth: 510, lineHeight: 15 }); y -= 18; } y -= 10; } page.drawText('Registro informativo; hipóteses não representam diagnóstico confirmado.', { x: 42, y: 35, size: 8, font, color: rgb(0.35, 0.35, 0.35) }); } const bytes = await pdf.save(); const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); const link = document.createElement('a'); link.href = url; link.download = 'yva-fichas-de-reparo.pdf'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <Panel title="Histórico de bancada" description="Organize os dados relatados e medidos durante cada manutenção. Tudo fica salvo neste navegador."><form className="bench-form" onSubmit={add}><label className="text-field"><span>Equipamento e modelo *</span><input required value={form.equipment} onChange={(event) => set('equipment')(event.target.value)} placeholder="Ex.: monitor modelo..."/></label><label className="text-field"><span>Código da placa/fonte</span><input value={form.board} onChange={(event) => set('board')(event.target.value)} placeholder="Identificação impressa na placa"/></label><label className="text-field"><span>Sintoma informado *</span><textarea required rows={3} value={form.symptom} onChange={(event) => set('symptom')(event.target.value)} placeholder="O que o equipamento apresenta?"/></label><label className="text-field"><span>Medições e condições do teste</span><textarea rows={3} value={form.readings} onChange={(event) => set('readings')(event.target.value)} placeholder="Valor, unidade, ponto de medição e condição (ligado/desligado)"/></label><label className="text-field"><span>Inspeção, hipóteses e resultado</span><textarea rows={3} value={form.findings} onChange={(event) => set('findings')(event.target.value)} placeholder="Separe o observado do que ainda é hipótese"/></label><div className="file-actions"><button className="primary-button" type="submit">Salvar registro</button>{records.length > 0 && <button className="text-button" type="button" onClick={() => { exportRecords(); void exportRepairPdf(); }}>Exportar backup JSON + ficha PDF ({records.length})</button>}</div></form><p className="research-safety">Este caderno apenas registra informações que você fornecer. Ele não confirma defeitos nem recomenda medições energizadas. Fontes ligadas à rede podem manter tensões perigosas após desligadas.</p>{records.length > 0 ? <div className="bench-record-list">{records.map((record) => <article className="bench-record" key={record.id}><header><div><small>{new Date(record.createdAt).toLocaleString('pt-BR')}</small><h3>{record.equipment}</h3></div><button className="icon-button" type="button" aria-label={`Remover registro de ${record.equipment}`} onClick={() => { if (window.confirm('Remover este registro local?')) setRecords((current) => current.filter((item) => item.id !== record.id)); }}>×</button></header>{record.board && <p><b>Placa:</b> {record.board}</p>}<p><b>Sintoma:</b> {record.symptom}</p>{record.readings && <p><b>Medições:</b> {record.readings}</p>}{record.findings && <p><b>Inspeção e resultado:</b> {record.findings}</p>}</article>)}</div> : <p className="empty-state"><span>Sem registros ainda</span> As fichas ficam no armazenamento local deste navegador.</p>}</Panel>;
}

function OhmTool() {
  const labels = [{ key: 'Tensão', unit: 'V' }, { key: 'Corrente', unit: 'A' }, { key: 'Resistência', unit: 'Ω' }, { key: 'Potência', unit: 'W' }] as const;
  const [raw, setRaw] = useState(['12', '0.02', '', '']);
  const values = raw.map((value, index) => value.trim() === '' ? null : parseEngineeringNumber(value, ['V', 'A', 'Ω', 'W'][index]));
  const activeCount = values.filter((value) => value !== null).length;
  const result = useMemo(() => solveOhm(values), [raw]);
  return <Panel title="Resultados da Lei de Ohm" description="Informe exatamente dois valores para calcular tensão, corrente, resistência e potência. Use unidades SI."><div className="electronics-fields">{labels.map((item, index) => <Field key={item.key} label={item.key} unit={item.unit} value={raw[index]} onChange={(value) => setRaw((current) => current.map((entry, i) => i === index ? value : entry))} />)}</div>{activeCount !== 2 ? <Invalid>Preencha exatamente dois valores para resolver o circuito.</Invalid> : !result ? <Invalid>Use valores numéricos maiores que zero; confira também a escala das unidades.</Invalid> : <div className="electronics-results"><Result label="Tensão" value={result.voltage} unit="V"/><Result label="Corrente" value={result.current} unit="A"/><Result label="Resistência" value={result.resistance} unit="Ω"/><Result label="Potência" value={result.power} unit="W"/></div>}<CalculationDetails formula="V = R × I; P = V × I" steps={["Identifique as duas grandezas conhecidas.", "Isole algebricamente a grandeza desejada.", "Confira as unidades e substitua os valores para calcular o resultado."]}/><p className="electronics-note"><Activity size={14}/> Relações usadas: V = R × I e P = V × I.</p></Panel>;
}

function ResistorTool() {
  const [mode, setMode] = useState<'series' | 'parallel'>('series'); const [raw, setRaw] = useState(['220', '330', '']);
  const values = raw.filter((value) => value.trim() !== '').map((value) => parseEngineeringNumber(value, 'Ω') ?? NaN); const invalid = raw.some((value) => value.trim() !== '' && (!Number.isFinite(parseEngineeringNumber(value, 'Ω')) || (parseEngineeringNumber(value, 'Ω') ?? 0) <= 0));
  const result = equivalentResistance(values, mode);
  return <Panel title="Resistores em série e paralelo" description="Informe ao menos duas resistências em ohms para obter o equivalente."><label className="text-field electronics-mode"><span>Associação</span><select className="select-control" value={mode} onChange={(event) => setMode(event.target.value as 'series' | 'parallel')}><option value="series">Série</option><option value="parallel">Paralelo</option></select></label><div className="electronics-fields">{raw.map((value, index) => <Field key={index} label={`Resistor ${index + 1}`} unit="Ω" value={value} onChange={(next) => setRaw((current) => current.map((entry, i) => i === index ? next : entry))}/>)}</div><button className="text-button" type="button" onClick={() => setRaw((current) => [...current, ''])}>Adicionar resistor</button>{invalid ? <Invalid>As resistências precisam ser números positivos.</Invalid> : result === null ? <Invalid>Informe pelo menos duas resistências válidas.</Invalid> : <div className="electronics-results"><Result label="Resistência equivalente" value={result} unit="Ω"/></div>}<CalculationDetails formula={mode === "series" ? "Req = R1 + R2 + …" : "1/Req = 1/R1 + 1/R2 + …"} steps={["Confirme se os resistores estão ligados em série ou paralelo.", "Some diretamente em série ou some os inversos em paralelo.", "Inverta a soma dos inversos para obter o equivalente em paralelo."]}/><p className="electronics-note"><CircuitBoard size={14}/> Série soma resistências; paralelo soma os inversos.</p></Panel>;
}

function LedTool() {
  const [source, setSource] = useState('5'); const [led, setLed] = useState('2'); const [current, setCurrent] = useState('20');
  const result = calculateLedResistor(parseEngineeringNumber(source, 'V') ?? NaN, parseEngineeringNumber(led, 'V') ?? NaN, parseEngineeringNumber(current, 'mA') ?? NaN);
  const invalidInput = [source, led, current].some((value) => value.trim() === '');
  return <Panel title="Resistor para LED" description="Estime a resistência limitadora e a potência dissipada. Corrente em mA; tensões em volts."><div className="electronics-fields"><Field label="Tensão da fonte" unit="V" value={source} onChange={setSource}/><Field label="Queda de tensão do LED" unit="V" value={led} onChange={setLed}/><Field label="Corrente desejada" unit="mA" value={current} onChange={setCurrent}/></div>{invalidInput || !result ? <Invalid>A fonte deve superar a tensão do LED, e a corrente deve ser maior que zero.</Invalid> : <div className="electronics-results"><Result label="Resistência calculada" value={result.resistance} unit="Ω"/><Result label="Valor padrão sugerido (E12)" value={result.standard} unit="Ω"/><Result label="Potência dissipada" value={result.power} unit="W"/></div>}<CalculationDetails formula="R = (Vs − Vf) ÷ (If/1000); P = (Vs − Vf) × (If/1000)" steps={["Subtraia a queda do LED da tensão da fonte.", "Converta a corrente de mA para A.", "Divida a tensão restante pela corrente para estimar R e confira a potência."]}/><p className="electronics-note"><Lightbulb size={14}/> Verifique a tensão e a corrente máximas indicadas pelo fabricante do LED.</p></Panel>;
}

function ConsumptionTool() {
  const [power, setPower] = useState('100'); const [hours, setHours] = useState('8'); const [days, setDays] = useState('30'); const [price, setPrice] = useState('0.9');
  const result = calculateConsumption(parseEngineeringNumber(power, 'W') ?? NaN, parseEngineeringNumber(hours, 'h') ?? NaN, parseEngineeringNumber(days, 'd') ?? NaN, parseEngineeringNumber(price, 'R$') ?? NaN); const empty = [power, hours, days, price].some((value) => value.trim() === '');
  return <Panel title="Potência e consumo" description="Estime o consumo mensal e o custo pelo tempo de uso e pela tarifa informada."><div className="electronics-fields"><Field label="Potência do aparelho" unit="W" value={power} onChange={setPower}/><Field label="Uso por dia" unit="h/dia" value={hours} onChange={setHours} max="24"/><Field label="Dias de uso" unit="dias" value={days} onChange={setDays}/><Field label="Tarifa de energia" unit="R$/kWh" value={price} onChange={setPrice}/></div>{empty || !result ? <Invalid>Use valores válidos; horas por dia devem ficar entre 0 e 24.</Invalid> : <div className="electronics-results"><Result label="Energia estimada" value={result.kwh} unit="kWh"/><Result label="Custo estimado" value={result.cost} unit="R$"/></div>}<CalculationDetails formula="kWh = (W ÷ 1000) × horas/dia × dias; custo = kWh × tarifa" steps={["Converta potência de watts para quilowatts.", "Multiplique pelo tempo diário e pelos dias de uso.", "Multiplique o consumo estimado pela tarifa informada."]}/><p className="electronics-note"><Zap size={14}/> Estimativa simplificada; impostos, bandeiras e tarifas adicionais podem alterar a conta.</p></Panel>;
}

function ResistorBandsTool() {
  const [count, setCount] = useState(4); const [bands, setBands] = useState(['Amarelo', 'Violeta', 'Vermelho', 'Ouro', 'Marrom', 'Marrom']); const result = calculateResistorBands(bands.slice(0, count));
  const digits = Object.keys(resistorDigits); const toleranceColors = Object.keys(tolerances); const multiplierColors = Object.keys(multipliers);
  const formatted = result ? result.resistance >= 1_000_000 ? `${result.resistance / 1_000_000} MΩ` : result.resistance >= 1000 ? `${result.resistance / 1000} kΩ` : `${result.resistance} Ω` : '';
  const update = (index: number, color: string) => setBands((current) => current.map((item, i) => i === index ? color : item));
  return <Panel title="Código de cores de resistores" description="Selecione as faixas na ordem: dígitos, multiplicador, tolerância e, em resistores de 6 faixas, coeficiente térmico."><label className="text-field"><span>Quantidade de faixas</span><select className="select-control" value={count} onChange={(event) => setCount(Number(event.target.value))}><option value={4}>4 faixas</option><option value={5}>5 faixas</option><option value={6}>6 faixas</option></select></label><div className="electronics-fields">{Array.from({ length: count }, (_, index) => { const isDigit = index < (count === 4 ? 2 : 3); const isMultiplier = index === (count === 4 ? 2 : 3); const options = isDigit ? digits : isMultiplier ? multiplierColors : index === count - 1 && count === 6 ? ['Marrom', 'Vermelho', 'Laranja', 'Amarelo', 'Azul', 'Violeta'] : toleranceColors; const label = isDigit ? `Dígito ${index + 1}` : isMultiplier ? 'Multiplicador' : index === count - 1 && count === 6 ? 'Coeficiente térmico' : 'Tolerância'; return <label className="text-field" key={`${count}-${index}`}><span>{label}</span><select className="select-control" value={bands[index]} onChange={(event) => update(index, event.target.value)}>{options.map((color) => <option key={color}>{color}</option>)}</select></label>; })}</div>{result ? <div className="electronics-results"><div className="electronics-result"><span>Resistência nominal</span><strong>{formatted}</strong></div><div className="electronics-result"><span>Tolerância</span><strong>±{result.tolerance}%</strong></div>{result.ppm !== undefined && <div className="electronics-result"><span>Coeficiente térmico</span><strong>{result.ppm} ppm/°C</strong></div>}</div> : <Invalid>Essa combinação de faixas não é válida; confira se a primeira faixa representa um dígito significativo.</Invalid>}<p className="electronics-note">Confirme o código no componente ou datasheet: a sequência visual pode variar e não informa a potência nominal do resistor.</p></Panel>;
}

function CapacitorTool() {
  const [mode, setMode] = useState<'series' | 'parallel'>('parallel'); const [values, setValues] = useState(['10', '22', '']); const validValues = values.filter((value) => value.trim()).map((value) => (parseEngineeringNumber(value, 'µF') ?? NaN) * 1e-6); const invalid = values.some((value) => value.trim() && (!Number.isFinite(parseEngineeringNumber(value, 'µF')) || (parseEngineeringNumber(value, 'µF') ?? 0) <= 0)); const result = invalid ? null : equivalentCapacitance(validValues, mode);
  const format = (farads: number) => farads >= 1 ? `${farads.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} F` : farads >= 1e-3 ? `${(farads * 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} mF` : farads >= 1e-6 ? `${(farads * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} µF` : `${(farads * 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} nF`;
  return <Panel title="Capacitores em série e paralelo" description="Calcule a capacitância equivalente. Informe os valores em microfarads (µF)."><label className="text-field"><span>Associação</span><select className="select-control" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="parallel">Paralelo</option><option value="series">Série</option></select></label><div className="electronics-fields">{values.map((value, index) => <Field key={index} label={`Capacitor ${index + 1}`} value={value} onChange={(next: string) => setValues((current) => current.map((item, i) => i === index ? next : item))} unit="µF"/>)}</div><button className="text-button" onClick={() => setValues((current) => [...current, ''])}>Adicionar capacitor</button>{invalid || validValues.length < 2 || !result ? <Invalid>Informe pelo menos dois valores positivos em µF.</Invalid> : <div className="electronics-result"><span>Capacitância equivalente</span><strong>{format(result)}</strong></div>}<CalculationDetails formula={mode === "parallel" ? "Ceq = C1 + C2 + …" : "1/Ceq = 1/C1 + 1/C2 + …"} steps={["Converta cada valor informado de µF para F.", "Some capacitâncias em paralelo ou os inversos em série.", "Na associação em série, inverta a soma obtida."]}/><p className="electronics-note">No paralelo, as capacitâncias se somam; em série, somam-se os inversos. A tensão nominal do conjunto depende dos componentes e da distribuição real de tensão.</p></Panel>;
}

function VoltageDividerTool() {
  const [input, setInput] = useState('12'); const [upper, setUpper] = useState('10000'); const [lower, setLower] = useState('10000');
  const result = calculateVoltageDivider(parseEngineeringNumber(input, 'V') ?? NaN, parseEngineeringNumber(upper, 'Ω') ?? NaN, parseEngineeringNumber(lower, 'Ω') ?? NaN); const empty = [input, upper, lower].some((value) => !value.trim());
  return <Panel title="Divisor de tensão" description="Estime a tensão de saída e a corrente de um divisor com dois resistores. Valores em volts e ohms."><div className="electronics-fields"><Field label="Tensão de entrada" unit="V" value={input} onChange={setInput}/><Field label="Resistor superior (R1)" unit="Ω" value={upper} onChange={setUpper}/><Field label="Resistor inferior (R2)" unit="Ω" value={lower} onChange={setLower}/></div>{empty || !result ? <Invalid>Use tensão e resistências positivas e finitas.</Invalid> : <div className="electronics-results"><Result label="Tensão de saída ideal" value={result.output} unit="V"/><Result label="Corrente no divisor" value={result.currentMa} unit="mA"/><Result label="Dissipação em R1" value={result.powerUpper} unit="W"/><Result label="Dissipação em R2" value={result.powerLower} unit="W"/></div>}<p className="electronics-note">Cálculo ideal sem carga conectada. Uma carga em paralelo com R2 altera a tensão; confira potência nominal, tolerância e tensão máxima dos resistores.</p></Panel>;
}

export function ElectronicsTool({ slug }: { slug: string }) {
  switch (slug) {
    case 'lei-de-ohm': return <OhmTool />;
    case 'resistores': return <ResistorTool />;
    case 'resistor-led': return <LedTool />;
    case 'potencia-consumo': return <ConsumptionTool />;
    case 'divisor-tensao': return <VoltageDividerTool />;
    case 'codigo-cores-resistor': return <ResistorBandsTool />;
    case 'capacitores-equivalentes': return <CapacitorTool />;
    case 'filtro-rc': return <RcFilterTool />;
    case 'timer-555': return <Timer555Tool />;
    case 'regulador-lm317': return <Lm317Tool />;
    case 'tabela-awg': return <AwgTableTool />;
    case 'pinouts': return <PinoutReferenceTool />;
    case 'prefixos-si': return <SiPrefixTool />;
    case 'pesquisador-cis': return <IcResearchTool />;
    case 'buscador-esquemas': return <SchematicSearchTool />;
    case 'registro-bancada': return <RepairNotebook />;
    case 'pesquisador-componentes': return <ComponentFinder />;
    case 'calculadora-smd': return <SmdDecoder />;
    case 'mapa-placa': return <BoardMapTool />;
    case 'diagnostico-guiado': return <DiagnosticGuide />;
    case 'orcamento-reparo': return <RepairQuoteTool />;
    default: return null;
  }
}
