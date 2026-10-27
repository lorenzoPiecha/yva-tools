import { useEffect, useRef, useState } from 'react';
import { Archive, Download, FileText, FileUp, Images, LoaderCircle, Scissors, X } from 'lucide-react';
import { unzipSync, zipSync } from 'fflate';
import { PDFDocument, degrees } from 'pdf-lib';
import { NumberField } from '../../components/NumberField';
import { CopyResultButton } from '../../components/CopyResultButton';
import { PhotoEditor } from './PhotoEditor';
import './files.css';

const MAX_FILE = 25 * 1024 * 1024;
const MAX_ZIP_TOTAL = 100 * 1024 * 1024;
const MAX_ZIP_ITEMS = 200;

export function formatBytes(size: number) {
  if (!Number.isFinite(size) || size < 0) return '—';
  if (size < 1024) return `${size} B`;
  const units = ['KB', 'MB', 'GB']; let value = size / 1024; let index = 0;
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; }
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${units[index]}`;
}

export function compareTextLines(before: string, after: string) {
  const original = before.split(/\r?\n/); const revised = after.split(/\r?\n/);
  return { removed: original.filter((line) => line && !revised.includes(line)), added: revised.filter((line) => line && !original.includes(line)) };
}

export function safeArchiveName(name: string) {
  const normalized = name.replace(/\\/g, '/').replace(/\/$/, '');
  return normalized.length > 0 && !normalized.startsWith('/') && !/^[a-z]:/i.test(normalized) && !normalized.split('/').some((part) => part === '..' || part === '') && !normalized.includes('\0');
}

export async function createZip(files: File[]): Promise<Uint8Array> {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (!files.length || files.length > MAX_ZIP_ITEMS || files.some((file) => file.size > MAX_FILE) || total > MAX_ZIP_TOTAL) throw new Error('Limite: 1–200 arquivos, 25 MB por arquivo e 100 MB no total.');
  const entries: Record<string, Uint8Array> = {};
  for (const [index, file] of files.entries()) { let name = (file.webkitRelativePath || file.name).replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.+/, '') || `arquivo-${index + 1}`; if (!safeArchiveName(name)) throw new Error('Um dos nomes de arquivo contém um caminho inválido.'); const ext = name.lastIndexOf('.'); const stem = ext > 0 ? name.slice(0, ext) : name; const suffix = ext > 0 ? name.slice(ext) : ''; let candidate = name; let duplicate = 2; while (candidate in entries) candidate = `${stem} (${duplicate++})${suffix}`; entries[candidate] = new Uint8Array(await file.arrayBuffer()); }
  return zipSync(entries, { level: 6 });
}

export function extractZip(data: Uint8Array): Array<{ name: string; data: Uint8Array }> {
  let blocked = false; let total = 0; let count = 0;
  const entries = unzipSync(data, { filter: (info) => { if (info.name.endsWith('/')) return safeArchiveName(info.name); count++; const valid = safeArchiveName(info.name) && info.originalSize <= MAX_FILE && total + info.originalSize <= MAX_ZIP_TOTAL && count <= MAX_ZIP_ITEMS; if (!valid) blocked = true; else total += info.originalSize; return valid; } });
  if (blocked) throw new Error('O ZIP excede os limites de segurança ou contém um caminho inválido. Nenhum arquivo foi extraído.');
  const names = Object.keys(entries).filter((name) => !name.endsWith('/'));
  if (!names.length) throw new Error('O ZIP não contém arquivos compatíveis.');
  return names.map((name) => ({ name, data: entries[name] }));
}

export function repackageExtracted(entries: Array<{ name: string; data: Uint8Array }>) {
  if (!entries.length || entries.length > MAX_ZIP_ITEMS || entries.some(({ name, data }) => !safeArchiveName(name) || data.byteLength > MAX_FILE) || entries.reduce((sum, entry) => sum + entry.data.byteLength, 0) > MAX_ZIP_TOTAL) throw new Error('Os arquivos extraídos excedem os limites permitidos.');
  return zipSync(Object.fromEntries(entries.map(({ name, data }) => [name, data])), { level: 0 });
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  if (!files.length || files.length > 30 || files.some((file) => !file.type.startsWith('image/') || file.size > MAX_FILE) || files.reduce((sum, file) => sum + file.size, 0) > MAX_ZIP_TOTAL) throw new Error('Selecione de 1 a 30 imagens, até 25 MB cada e 100 MB no total.');
  const output = await PDFDocument.create();
  for (const file of files) {
    const bitmap = await createImageBitmap(file);
    try {
      if (bitmap.width * bitmap.height > 40_000_000) throw new Error(`${file.name}: limite de 40 megapixels.`);
      let image;
      if (file.type === 'image/jpeg') image = await output.embedJpg(new Uint8Array(await file.arrayBuffer()));
      else if (file.type === 'image/png') image = await output.embedPng(new Uint8Array(await file.arrayBuffer()));
      else {
        const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
        const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas 2D indisponível para converter esta imagem.');
        context.drawImage(bitmap, 0, 0);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error(`Falha ao preparar ${file.name} para PDF.`)), 'image/png'));
        image = await output.embedPng(new Uint8Array(await blob.arrayBuffer()));
      }
      const landscape = image.width > image.height; const pageWidth = landscape ? 842 : 595; const pageHeight = landscape ? 595 : 842; const margin = 24; const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height); const width = image.width * scale; const height = image.height * scale;
      const page = output.addPage([pageWidth, pageHeight]); page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
    } finally { bitmap.close(); }
  }
  return output.save();
}

export function parseCsv(input: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const character = input[i];
    if (character === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[i + 1] === '\n') i++;
      row.push(cell); if (row.some((value) => value !== '')) rows.push(row);
      row = []; cell = '';
    } else cell += character;
  }
  if (quoted) throw new Error('CSV inválido: há uma aspa sem fechamento.');
  row.push(cell); if (row.some((value) => value !== '') || rows.length === 0) rows.push(row);
  return rows;
}

export function csvToJson(input: string): Record<string, string>[] {
  const [header = [], ...rows] = parseCsv(input);
  if (header.length < 1) throw new Error('Informe um CSV com cabeçalho e ao menos uma coluna.');
  const names = header.map((name, index) => name.trim() || `coluna_${index + 1}`);
  return rows.map((row) => Object.fromEntries(names.map((name, index) => [name, row[index] ?? ''])));
}

export function jsonToCsv(input: unknown): string {
  if (!Array.isArray(input) || input.length === 0 || input.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('O JSON deve ser uma lista não vazia de objetos.');
  const columns = [...new Set(input.flatMap((row) => Object.keys(row)))];
  const escape = (value: unknown) => { const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
  return [columns, ...input.map((row) => columns.map((column) => (row as Record<string, unknown>)[column]))].map((row) => row.map(escape).join(',')).join('\r\n');
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="web-tool-panel"><header className="web-panel-heading"><h2>{title}</h2><p>{description}</p></header>{children}</section>; }
function DropInput({ label, accept, multiple = false, onFiles, directory = false }: { label: string; accept?: string; multiple?: boolean; onFiles: (files: File[]) => void; directory?: boolean }) {
  const [dragging, setDragging] = useState(false); const input = useRef<HTMLInputElement>(null);
  return <div className={`file-drop ${dragging ? 'file-drop-active' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); onFiles(Array.from(event.dataTransfer.files)); }}>
    <FileUp size={22}/><strong>{label}</strong><span>Arraste os arquivos até aqui ou escolha no dispositivo</span><button className="text-button" type="button" onClick={() => input.current?.click()}>Selecionar arquivos</button>
    <input ref={input} type="file" accept={accept} multiple={multiple} onChange={(event) => { onFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} aria-label={label} {...(directory ? { webkitdirectory: '', directory: '' } as Record<string, string> : {})}/>
  </div>;
}
function FileList({ files, remove }: { files: File[]; remove: (index: number) => void }) { return <ul className="file-list">{files.map((file, index) => <li key={`${file.name}-${index}`}><span><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></span><button className="icon-button" aria-label={`Remover ${file.name}`} onClick={() => remove(index)}><X size={15}/></button></li>)}</ul>; }

function ArchiveTool() {
  const [mode, setMode] = useState<'create' | 'extract'>('create'); const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const clear = () => { setFiles([]); setMessage(''); };
  const run = async () => {
    if (!files.length) { setMessage('Selecione pelo menos um arquivo.'); return; }
    setBusy(true); setMessage('');
    try {
      if (mode === 'create') {
        const zipped = await createZip(files); downloadBlob(new Blob([zipped], { type: 'application/zip' }), 'yva-arquivos.zip'); setMessage(`ZIP criado com ${files.length} arquivo(s).`);
      } else {
        if (files.length !== 1) throw new Error('Selecione apenas um arquivo ZIP por vez.');
        const archive = files[0]; if (archive.size > MAX_FILE) throw new Error('Por segurança, o ZIP precisa ter até 25 MB.');
        const extracted = extractZip(new Uint8Array(await archive.arrayBuffer()));
        const restored = repackageExtracted(extracted);
        downloadBlob(new Blob([restored], { type: 'application/zip' }), `${archive.name.replace(/\.zip$/i, '')}-extraido.zip`);
        setMessage(`${extracted.length} arquivo(s) extraído(s) em um novo ZIP que preserva as pastas internas.`);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível processar os arquivos.'); }
    finally { setBusy(false); }
  };
  return <Panel title="ZIP e arquivos compactados" description="Crie ZIPs ou extraia arquivos no navegador. Os arquivos não são enviados a um servidor."><div className="file-tabs"><button className={mode === 'create' ? 'selected' : ''} onClick={() => { setMode('create'); clear(); }}><Archive size={15}/> Criar ZIP</button><button className={mode === 'extract' ? 'selected' : ''} onClick={() => { setMode('extract'); clear(); }}><Download size={15}/> Extrair ZIP</button></div><DropInput label={mode === 'create' ? 'Arquivos para compactar' : 'Arquivo ZIP para extrair'} accept={mode === 'extract' ? '.zip,application/zip' : undefined} multiple={mode === 'create'} directory={mode === 'create'} onFiles={(incoming) => { setFiles((prev) => mode === 'create' ? [...prev, ...incoming] : incoming.slice(0, 1)); setMessage(''); }}/>{files.length > 0 && <FileList files={files} remove={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))}/>}<div className="file-actions"><button className="primary-button" disabled={busy || !files.length} onClick={() => void run()}>{busy ? <LoaderCircle className="spin" size={15}/> : mode === 'create' ? <Archive size={15}/> : <Download size={15}/>} {busy ? 'Processando…' : mode === 'create' ? 'Criar arquivo ZIP' : 'Extrair e baixar ZIP'}</button><button className="text-button" onClick={clear}>Limpar</button></div>{message && <p role={message.startsWith('ZIP criado') || message.includes('novo ZIP') ? 'status' : 'alert'} className={message.startsWith('ZIP criado') || message.includes('novo ZIP') ? 'file-message' : 'validation-message'}>{message}</p>}<p className="electronics-note">Limites: 25 MB por arquivo ZIP, 100 MB descompactados e 200 entradas. A extração gera outro ZIP para download, mantendo os caminhos internos e sem gravar arquivos diretamente no dispositivo.</p></Panel>;
}

function ImageTool({ purpose = 'convert' }: { purpose?: 'convert' | 'crop' | 'metadata' }) {
  const [file, setFile] = useState<File | null>(null); const [format, setFormat] = useState('image/webp'); const [width, setWidth] = useState(''); const [height, setHeight] = useState(''); const [quality, setQuality] = useState(82); const [rotation, setRotation] = useState(0); const [crop, setCrop] = useState('original'); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [stats, setStats] = useState<{ before: number; after: number } | null>(null);
  const process = async () => {
    if (!file || !file.type.startsWith('image/')) { setMessage('Escolha um arquivo de imagem válido.'); return; }
    if (file.size > 25 * 1024 * 1024) { setMessage('A imagem precisa ter até 25 MB.'); return; }
    setBusy(true); setMessage('');
    try {
      const bitmap = await createImageBitmap(file); let sx = 0; let sy = 0; let sw = bitmap.width; let sh = bitmap.height;
      if (crop !== 'original') { const [rw, rh] = crop.split(':').map(Number); const ratio = rw! / rh!; if (sw / sh > ratio) { const next = sh * ratio; sx = (sw - next) / 2; sw = next; } else { const next = sw / ratio; sy = (sh - next) / 2; sh = next; } }
      const w = Math.round(Number(width) || sw); const h = Math.round(Number(height) || sh);
      if (w < 1 || h < 1 || w * h > 40_000_000) throw new Error('Dimensões inválidas: limite de 40 megapixels.');
      const swapped = rotation % 180 !== 0; const canvas = document.createElement('canvas'); canvas.width = swapped ? h : w; canvas.height = swapped ? w : h;
      const context = canvas.getContext('2d'); if (!context) throw new Error('Este navegador não disponibilizou o Canvas 2D.');
      if (format === 'image/jpeg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); }
      context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180); context.drawImage(bitmap, sx, sy, sw, sh, -w / 2, -h / 2, w, h); bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Este formato não é suportado para exportação neste navegador.')), format, quality / 100));
      if (blob.type !== format) throw new Error(`O navegador não oferece suporte à exportação neste formato (retornou ${blob.type || 'tipo desconhecido'}).`);
      const ext = format.split('/')[1] === 'jpeg' ? 'jpg' : format.split('/')[1]; const stem = file.name.replace(/\.[^.]+$/, ''); downloadBlob(blob, `${stem}-yva.${ext}`); setStats({ before: file.size, after: blob.size }); setMessage('Imagem processada e download iniciado.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao processar a imagem.'); }
    finally { setBusy(false); }
  };
  const heading = purpose === 'crop' ? 'Recortar imagem' : purpose === 'metadata' ? 'Remover metadados EXIF' : 'Conversor e compressor de imagens';
  const description = purpose === 'crop' ? 'Recorte central pela proporção escolhida e ajuste tamanho e orientação. O processamento é local.' : purpose === 'metadata' ? 'Regrave uma imagem pelo Canvas para descartar metadados EXIF e outros metadados não visuais.' : 'Converta, recorte pela proporção, redimensione, gire e ajuste a qualidade localmente. AVIF depende do suporte do navegador.';
  return <Panel title={heading} description={description}><DropInput label="Selecionar imagem" accept="image/*" onFiles={(incoming) => { setFile(incoming[0] ?? null); setStats(null); setMessage(''); }}/>{file && <div className="selected-file"><Images size={16}/><span>{file.name} · {formatBytes(file.size)}</span><button className="icon-button" aria-label="Remover imagem" onClick={() => { setFile(null); setStats(null); }}><X size={15}/></button></div>}<div className="electronics-fields"><label className="text-field"><span>Formato de saída</span><select className="select-control" value={format} onChange={(event) => setFormat(event.target.value)}><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/avif">AVIF (se suportado)</option></select></label><label className="text-field"><span>Recorte central</span><select className="select-control" value={crop} onChange={(event) => setCrop(event.target.value)}><option value="original">Imagem inteira</option><option value="1:1">Quadrado · 1:1</option><option value="4:3">Paisagem · 4:3</option><option value="16:9">Widescreen · 16:9</option><option value="3:4">Retrato · 3:4</option></select></label><label className="text-field"><span>Giro</span><select className="select-control" value={rotation} onChange={(event) => setRotation(Number(event.target.value))}><option value={0}>0°</option><option value={90}>90°</option><option value={180}>180°</option><option value={270}>270°</option></select></label><label className="text-field"><span>Largura (px, vazio mantém original)</span><NumberField label="Largura em pixels" value={width} onChange={setWidth} min="1" step="1"/></label><label className="text-field"><span>Altura (px, vazio mantém original)</span><NumberField label="Altura em pixels" value={height} onChange={setHeight} min="1" step="1"/></label></div><label className="range-control image-quality"><span>Qualidade<strong>{quality}%</strong></span><input type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))}/></label><div className="file-actions"><button className="primary-button" disabled={busy || !file} onClick={() => void process()}>{busy ? 'Processando…' : purpose === 'metadata' ? 'Remover metadados e baixar' : purpose === 'crop' ? 'Recortar e baixar' : 'Converter e baixar'}</button><button className="text-button" onClick={() => { setFile(null); setStats(null); setMessage(''); }}>Limpar</button></div>{stats && <div className="conversion-grid"><div className="format-row"><span>ANTES</span><code>{formatBytes(stats.before)}</code></div><div className="format-row"><span>DEPOIS</span><code>{formatBytes(stats.after)} ({stats.after <= stats.before ? 'redução' : 'aumento'} de {Math.abs((1 - stats.after / stats.before) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)</code></div></div>}{message && <p role={message.startsWith('Imagem processada') ? 'status' : 'alert'} className={message.startsWith('Imagem processada') ? 'file-message' : 'validation-message'}>{message}</p>}<p className="electronics-note">A renderização em Canvas remove metadados EXIF embutidos; outros metadados também não são preservados. Ajustar largura e altura pode alterar a proporção. Formatos suportados dependem do navegador.</p></Panel>;
}

function PdfPreview({ file }: { file: File }) { const [url, setUrl] = useState(""); useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]); return url ? <div className="pdf-preview"><h3 className="preview-title">Prévia do primeiro PDF</h3><iframe title="Prévia do PDF selecionado" src={url} /></div> : null; }
function PdfTool() {
  const [files, setFiles] = useState<File[]>([]); const [pageOrder, setPageOrder] = useState(''); const [rotation, setRotation] = useState('0'); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const run = async () => {
    if (!files.length) { setMessage('Selecione ao menos um PDF.'); return; }
    if (files.length > 10 || files.some((file) => file.size > 20 * 1024 * 1024) || files.reduce((sum, file) => sum + file.size, 0) > 40 * 1024 * 1024) { setMessage('Limite: até 10 PDFs, 20 MB cada e 40 MB no total.'); return; }
    setBusy(true); setMessage('');
    try {
      const sources: PDFDocument[] = [];
      for (const file of files) { const bytes = new Uint8Array(await file.arrayBuffer()); if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error(`${file.name} não parece ser um PDF válido.`); sources.push(await PDFDocument.load(bytes)); }
      const output = await PDFDocument.create(); const all: Array<{ source: PDFDocument; page: number }> = [];
      for (const source of sources) for (let page = 0; page < source.getPageCount(); page++) all.push({ source, page });
      let chosen = all;
      if (pageOrder.trim()) {
        const indexes = pageOrder.split(',').map((part) => Number(part.trim()));
        if (!indexes.length || indexes.some((index) => !Number.isInteger(index) || index < 1 || index > all.length) || new Set(indexes).size !== indexes.length) throw new Error(`Informe páginas únicas entre 1 e ${all.length}, separadas por vírgula.`);
        chosen = indexes.map((index) => all[index - 1]);
      }
      for (const item of chosen) { const [page] = await output.copyPages(item.source, [item.page]); if (Number(rotation)) page.setRotation(degrees((page.getRotation().angle + Number(rotation)) % 360)); output.addPage(page); }
      const bytes = await output.save(); downloadBlob(new Blob([bytes], { type: 'application/pdf' }), files.length > 1 ? 'yva-pdf-unido.pdf' : 'yva-pdf-paginas.pdf'); setMessage(`${chosen.length} página(s) processada(s); download iniciado.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível processar o PDF.'); }
    finally { setBusy(false); }
  };
  return <Panel title="Ferramentas de PDF" description="Una PDFs ou selecione/reordene páginas e aplique rotação. O processamento ocorre neste dispositivo."><DropInput label="Selecionar PDF(s)" accept="application/pdf,.pdf" multiple onFiles={(incoming) => { setFiles(incoming); setMessage(''); }}/>{files.length > 0 && <><FileList files={files} remove={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))}/><p className="electronics-note">A ordem dos PDFs selecionados será preservada na união.</p><PdfPreview file={files[0]!}/></>}<label className="text-field pdf-pages"><span>Páginas de saída em ordem (opcional; ex.: 3,1,2)</span><input value={pageOrder} onChange={(event) => setPageOrder(event.target.value)} placeholder="Vazio mantém todas na ordem original"/></label><label className="text-field pdf-pages"><span>Rotação adicional</span><select className="select-control" value={rotation} onChange={(event) => setRotation(event.target.value)}><option value="0">Sem rotação</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label><div className="file-actions"><button className="primary-button" disabled={busy || !files.length} onClick={() => void run()}>{busy ? 'Processando…' : files.length > 1 ? 'Unir / processar PDFs' : 'Processar páginas'}</button><button className="text-button" onClick={() => { setFiles([]); setPageOrder(''); setMessage(''); }}>Limpar</button></div>{message && <p role={message.includes('download iniciado') ? 'status' : 'alert'} className={message.includes('download iniciado') ? 'file-message' : 'validation-message'}>{message}</p>}<p className="electronics-note"><Scissors size={14}/> PDF protegido por senha ou com estruturas incompatíveis pode falhar. Este módulo não faz OCR nem converte páginas em documentos editáveis.</p></Panel>;
}

function ImageToPdfTool() {
  const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const run = async () => { setBusy(true); setMessage(''); try { const bytes = await imagesToPdf(files); downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'yva-imagens.pdf'); setMessage(`PDF criado com ${files.length} página(s). O download foi iniciado.`); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar o PDF.'); } finally { setBusy(false); } };
  return <Panel title="Converter imagens para PDF" description="Transforme uma ou várias imagens em um PDF, uma imagem por página. A conversão ocorre neste dispositivo."><DropInput label="Selecionar imagens na ordem das páginas" accept="image/*" multiple onFiles={(incoming) => { setFiles(incoming.slice(0, 30)); setMessage(incoming.length > 30 ? 'Foram mantidas somente as primeiras 30 imagens.' : ''); }}/>{files.length > 0 && <><FileList files={files} remove={(index) => setFiles((all) => all.filter((_, i) => i !== index))}/><p className="electronics-note">A ordem selecionada será a ordem das páginas. As imagens são ajustadas à página A4 em orientação retrato ou paisagem.</p></>}<div className="file-actions"><button className="primary-button" disabled={busy || !files.length} onClick={() => void run()}>{busy ? 'Criando PDF…' : 'Converter e baixar PDF'}</button><button className="text-button" onClick={() => { setFiles([]); setMessage(''); }}>Limpar</button></div>{message && <p role={message.includes('PDF criado') ? 'status' : 'alert'} className={message.includes('PDF criado') ? 'file-message' : 'validation-message'}>{message}</p>}<p className="electronics-note">Até 30 imagens, 25 MB por arquivo, 100 MB no total e 40 megapixels por imagem. PNG/JPEG são incorporados diretamente; outros formatos precisam ser abertos e exportados pelo navegador para entrar no PDF. Metadados não são preservados nesses casos.</p></Panel>;
}

export async function convertImageBatch(files: File[], format: 'image/webp' | 'image/jpeg' | 'image/png', quality: number, maxWidth = 0): Promise<Uint8Array> {
  if (!files.length || files.length > 20 || files.some((file) => !file.type.startsWith('image/') || file.size > MAX_FILE) || files.reduce((sum, file) => sum + file.size, 0) > MAX_ZIP_TOTAL || quality < 10 || quality > 100 || maxWidth < 0) throw new Error('Selecione de 1 a 20 imagens, até 25 MB cada e 100 MB no total; confira também qualidade e largura.');
  const entries: Record<string, Uint8Array> = {};
  for (const file of files) {
    const bitmap = await createImageBitmap(file);
    try {
      if (bitmap.width * bitmap.height > 40_000_000) throw new Error(`${file.name}: limite de 40 megapixels.`);
      const scale = maxWidth > 0 ? Math.min(1, maxWidth / bitmap.width) : 1; const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale)); const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas 2D indisponível.');
      if (format === 'image/jpeg') { context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); } context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error(`Não foi possível converter ${file.name}.`)), format, quality / 100));
      if (blob.type !== format) throw new Error(`Formato ${format} não suportado neste navegador.`);
      if (blob.size > MAX_FILE || Object.values(entries).reduce((sum, bytes) => sum + bytes.byteLength, 0) + blob.size > MAX_ZIP_TOTAL) throw new Error('Os resultados convertidos excedem 25 MB por imagem ou 100 MB no total. Reduza a largura ou escolha outro formato.');
      const ext = format === 'image/jpeg' ? 'jpg' : format.slice(6); let name = `${file.name.replace(/\.[^.]+$/, '')}.${ext}`; let count = 2; while (name in entries) name = `${file.name.replace(/\.[^.]+$/, '')} (${count++}).${ext}`; entries[name] = new Uint8Array(await blob.arrayBuffer());
    } finally { bitmap.close(); }
  }
  return zipSync(entries, { level: 0 });
}

function ImageBatchTool() {
  const [files, setFiles] = useState<File[]>([]); const [format, setFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp'); const [quality, setQuality] = useState(82); const [width, setWidth] = useState('1600'); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const run = async () => { setBusy(true); setMessage(''); try { const zip = await convertImageBatch(files, format, quality, Number(width) || 0); downloadBlob(new Blob([zip], { type: 'application/zip' }), 'yva-imagens-convertidas.zip'); setMessage(`${files.length} imagem(ns) convertida(s). O download ZIP foi iniciado.`); } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha na conversão.'); } finally { setBusy(false); } };
  return <Panel title="Conversor de imagens em lote" description="Converta, comprima e limite a largura de várias imagens no navegador. Os resultados são baixados juntos em ZIP."><DropInput label="Selecionar várias imagens" accept="image/*" multiple onFiles={(incoming) => { setFiles(incoming.slice(0, 20)); setMessage(incoming.length > 20 ? 'Foram mantidas somente as primeiras 20 imagens.' : ''); }}/>{files.length > 0 && <FileList files={files} remove={(index) => setFiles((all) => all.filter((_, i) => i !== index))}/>}<div className="electronics-fields"><label className="text-field"><span>Formato</span><select className="select-control" value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label><label className="text-field"><span>Largura máxima (px; 0 mantém)</span><NumberField label="Largura máxima em pixels" value={width} onChange={setWidth} min="0" step="1"/></label></div><label className="range-control image-quality"><span>Qualidade<strong>{quality}%</strong></span><input type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))}/></label><div className="file-actions"><button className="primary-button" disabled={busy || !files.length} onClick={() => void run()}>{busy ? 'Convertendo…' : 'Converter e baixar ZIP'}</button><button className="text-button" onClick={() => { setFiles([]); setMessage(''); }}>Limpar</button></div>{message && <p role={message.includes('convertida') ? 'status' : 'alert'} className={message.includes('convertida') ? 'file-message' : 'validation-message'}>{message}</p>}<p className="electronics-note">Até 20 arquivos, 25 MB cada, 100 MB no total e 40 megapixels por imagem. Metadados são removidos pela renderização no Canvas. Formatos disponíveis dependem do navegador.</p></Panel>;
}

export async function optimizePdfStructure(file: File): Promise<Uint8Array> {
  if (file.size > 40 * 1024 * 1024) throw new Error('O PDF precisa ter até 40 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer()); if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error('O arquivo não parece ser um PDF válido.');
  const source = await PDFDocument.load(bytes); return source.save({ useObjectStreams: true, addDefaultPage: false });
}
function PdfCompressorTool() { const [file, setFile] = useState<File | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [sizes, setSizes] = useState<{ before: number; after: number } | null>(null); const run = async () => { if (!file) return; setBusy(true); setMessage(''); setSizes(null); try { const result = await optimizePdfStructure(file); downloadBlob(new Blob([result], { type: 'application/pdf' }), `${file.name.replace(/\.pdf$/i, '')}-otimizado.pdf`); setSizes({ before: file.size, after: result.byteLength }); setMessage('PDF regravado e download iniciado. O tamanho pode aumentar ou permanecer igual.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao otimizar o PDF.'); } finally { setBusy(false); } }; return <Panel title="Otimizar PDF" description="Regrave o PDF com estrutura de objetos otimizada, localmente. Isso não rasteriza páginas nem garante redução de tamanho."><DropInput label="Selecionar um PDF" accept="application/pdf,.pdf" onFiles={(incoming) => { setFile(incoming[0] ?? null); setSizes(null); setMessage(''); }}/>{file && <div className="selected-file"><FileText size={16}/><span>{file.name} · {formatBytes(file.size)}</span><button className="icon-button" aria-label="Remover PDF" onClick={() => { setFile(null); setSizes(null); }}><X size={15}/></button></div>}<div className="file-actions"><button className="primary-button" disabled={!file || busy} onClick={() => void run()}>{busy ? 'Otimizando…' : 'Otimizar e baixar'}</button><button className="text-button" onClick={() => { setFile(null); setMessage(''); setSizes(null); }}>Limpar</button></div>{sizes && <div className="conversion-grid"><div className="format-row"><span>ANTES</span><code>{formatBytes(sizes.before)}</code></div><div className="format-row"><span>DEPOIS</span><code>{formatBytes(sizes.after)} · {sizes.after <= sizes.before ? 'reduziu' : 'aumentou'} {formatBytes(Math.abs(sizes.before - sizes.after))}</code></div></div>}{message && <p role="status" className="file-message">{message}</p>}<p className="electronics-note">PDFs protegidos por senha, formulários ou arquivos incompatíveis podem não ser aceitos. A ferramenta não reduz resolução de imagens; para PDFs escaneados, a redução pode ser pequena ou inexistente.</p></Panel>; }

export function FilesTool({ slug }: { slug: string }) {
  if (slug === 'editor-imagens') return <PhotoEditor />;
  if (slug === 'compressor') return <ArchiveTool />;
  if (slug === 'conversor-imagens') return <ImageTool />;
  if (slug === 'recortar-imagem') return <ImageTool purpose="crop" />;
  if (slug === 'remover-metadados') return <ImageTool purpose="metadata" />;
  if (slug === 'compressor-pdf') return <PdfCompressorTool />;
  if (slug === 'conversor-imagens-lote') return <ImageBatchTool />;
  if (slug === 'pdf-tools') return <PdfTool />;
  if (slug === 'imagens-para-pdf') return <ImageToPdfTool />;
  if (slug === 'csv-json') return <CsvJsonTool />;
  if (slug === 'conversores') return <QuickConverters />;
  if (slug === 'comparador-textos') return <TextCompareTool />;
  if (slug === 'identificador-arquivos') return <FileIdentifierTool />;
  if (slug === 'tamanho-arquivos') return <FileSizeTool />;
  return null;
}

function CsvPreview({ value }: { value: string }) { let rows: string[][] = []; let error = false; try { rows = parseCsv(value); } catch { error = true; } if (error || !rows.length) return null; return <div className="fake-table-wrap"><table className="fake-table"><thead><tr>{rows[0]!.map((cell, index) => <th key={index}>{cell || `Coluna ${index + 1}`}</th>)}</tr></thead><tbody>{rows.slice(1, 101).map((row, index) => <tr key={index}>{rows[0]!.map((_, column) => <td key={column}>{row[column] ?? ""}</td>)}</tr>)}</tbody></table>{rows.length > 101 && <p className="electronics-note">Prévia limitada às primeiras 100 linhas de dados.</p>}</div>; }
function CsvJsonTool() {
  const [mode, setMode] = useState<'csv-json' | 'json-csv'>('csv-json'); const [input, setInput] = useState('nome,idade\nAna,22\nJoão,31'); const [output, setOutput] = useState(''); const [error, setError] = useState('');
  const convert = () => { try { const result = mode === 'csv-json' ? JSON.stringify(csvToJson(input), null, 2) : jsonToCsv(JSON.parse(input)); setOutput(result); setError(''); } catch (err) { setOutput(''); setError(err instanceof Error ? err.message : 'Não foi possível converter.'); } };
  return <Panel title="Conversor CSV · JSON" description="Converta tabelas delimitadas por vírgulas e listas JSON de objetos. Processamento local."><div className="file-tabs"><button className={mode === 'csv-json' ? 'selected' : ''} onClick={() => { setMode('csv-json'); setInput('nome,idade\nAna,22\nJoão,31'); setOutput(''); }}>CSV → JSON</button><button className={mode === 'json-csv' ? 'selected' : ''} onClick={() => { setMode('json-csv'); setInput('[\n  {"nome":"Ana","idade":22},\n  {"nome":"João","idade":31}\n]'); setOutput(''); }}>JSON → CSV</button></div><label className="text-field code-field"><span>{mode === 'csv-json' ? 'CSV de entrada' : 'JSON de entrada'}</span><textarea aria-label="Conteúdo de entrada" value={input} onChange={(event) => setInput(event.target.value)}/></label><div className="file-actions"><button className="primary-button" onClick={convert}>Converter</button><button className="text-button" onClick={() => { setInput(''); setOutput(''); setError(''); }}>Limpar</button></div>{error && <p role="alert" className="validation-message">{error}</p>}{output && <div className="dev-output"><pre>{output}</pre>{mode === "csv-json" && <CsvPreview value={input}/>}<button className="text-button" onClick={() => downloadBlob(new Blob([output], { type: mode === 'csv-json' ? 'application/json' : 'text/csv' }), mode === 'csv-json' ? 'dados.json' : 'dados.csv')}>Baixar resultado</button><CopyResultButton value={output}/></div>}</Panel>;
}

function QuickConverters() {
  const [mode, setMode] = useState('text'); const [input, setInput] = useState('YVA Tools'); const [base, setBase] = useState('10'); const [from, setFrom] = useState('m'); const [to, setTo] = useState('ft');
  const [textAction, setTextAction] = useState('upper');
  const units: Record<string, { factor: number; dimension: string }> = { m: { factor: 1, dimension: 'comprimento' }, km: { factor: 1000, dimension: 'comprimento' }, cm: { factor: .01, dimension: 'comprimento' }, mm: { factor: .001, dimension: 'comprimento' }, ft: { factor: .3048, dimension: 'comprimento' }, in: { factor: .0254, dimension: 'comprimento' }, kg: { factor: 1, dimension: 'massa' }, g: { factor: .001, dimension: 'massa' }, lb: { factor: .45359237, dimension: 'massa' }, L: { factor: 1, dimension: 'volume' }, mL: { factor: .001, dimension: 'volume' } };
  const parseIntegerBase = (value: string, radix: number) => { const text = value.trim().toLowerCase(); const negative = text.startsWith('-'); const digits = negative ? text.slice(1) : text; if (!digits || ![2, 8, 10, 16].includes(radix)) throw new Error(); let parsed = 0n; for (const char of digits) { const digit = parseInt(char, 36); if (!Number.isInteger(digit) || digit >= radix) throw new Error(); parsed = parsed * BigInt(radix) + BigInt(digit); } return negative ? -parsed : parsed; };
  let result = '';
  try {
    if (mode === 'text') result = textAction === 'upper' ? input.toUpperCase() : textAction === 'lower' ? input.toLocaleLowerCase('pt-BR') : textAction === 'title' ? input.toLocaleLowerCase('pt-BR').replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase('pt-BR')) : textAction === 'reverse' ? Array.from(input).reverse().join('') : input.trim();
    if (mode === 'base') { const n = parseIntegerBase(input, Number(base)); result = `Binário: ${n.toString(2)} · Decimal: ${n.toString(10)} · Hex: ${n.toString(16).toUpperCase()} · Octal: ${n.toString(8)}`; }
    if (mode === 'unit') { const value = Number(input); result = !input.trim() || !Number.isFinite(value) ? 'Digite um número válido.' : units[from].dimension !== units[to].dimension ? 'Selecione unidades da mesma grandeza.' : `${value} ${from} = ${(value * units[from].factor / units[to].factor).toLocaleString('pt-BR', { maximumFractionDigits: 8 })} ${to}`; }
  } catch { result = mode === 'base' ? 'Digite um inteiro válido para converter as bases.' : 'Não foi possível converter esse valor.'; }
  return <Panel title="Conversores rápidos" description="Conversão de texto, bases inteiras e unidades comuns, sem enviar dados para fora do navegador."><div className="file-tabs"><button className={mode === 'text' ? 'selected' : ''} onClick={() => setMode('text')}>Texto</button><button className={mode === 'base' ? 'selected' : ''} onClick={() => setMode('base')}>Bases</button><button className={mode === 'unit' ? 'selected' : ''} onClick={() => setMode('unit')}>Unidades</button></div>{mode === 'text' && <label className="text-field converter-subfield"><span>Operação</span><select className="select-control" value={textAction} onChange={(event) => setTextAction(event.target.value)}><option value="upper">MAIÚSCULAS</option><option value="lower">minúsculas</option><option value="title">Iniciais maiúsculas</option><option value="reverse">Inverter texto</option><option value="trim">Remover espaços nas pontas</option></select></label>}<label className="text-field"><span>{mode === 'text' ? 'Texto' : mode === 'base' ? 'Inteiro na base escolhida' : 'Valor'}</span><input value={input} onChange={(event) => setInput(event.target.value)}/></label>{mode === 'base' && <label className="text-field converter-subfield"><span>Base da entrada (2, 8, 10 ou 16)</span><select className="select-control" value={base} onChange={(event) => setBase(event.target.value)}><option value="10">Decimal</option><option value="2">Binária</option><option value="8">Octal</option><option value="16">Hexadecimal</option></select></label>}{mode === 'unit' && <div className="unit-controls converter-subfield"><label className="text-field"><span>De</span><select className="select-control" value={from} onChange={(event) => setFrom(event.target.value)}>{Object.keys(units).map((unit) => <option key={unit}>{unit}</option>)}</select></label><label className="text-field"><span>Para</span><select className="select-control" value={to} onChange={(event) => setTo(event.target.value)}>{Object.keys(units).map((unit) => <option key={unit}>{unit}</option>)}</select></label></div>}<div className="dev-output"><pre>{result}</pre><CopyResultButton value={result}/></div><p className="electronics-note">A conversão de unidades nesta versão cobre comprimento, massa e volume; temperatura e outras grandezas serão adicionadas em etapas posteriores.</p></Panel>;
}

function FileSizeTool() {
  const [files, setFiles] = useState<File[]>([]); const total = files.reduce((sum, file) => sum + file.size, 0);
  return <Panel title="Calculadora de tamanho de arquivos" description="Selecione arquivos para somar o espaço ocupado. O conteúdo é lido apenas pelo navegador local."><DropInput label="Selecionar arquivo(s)" multiple onFiles={(incoming) => setFiles((current) => [...current, ...incoming])}/>{files.length > 0 && <><FileList files={files} remove={(index) => setFiles((current) => current.filter((_, i) => i !== index))}/><div className="conversion-grid"><div className="format-row"><span>ITENS</span><code>{files.length}</code></div><div className="format-row"><span>TOTAL</span><code>{formatBytes(total)} · {total.toLocaleString('pt-BR')} bytes</code></div></div></>}<div className="file-actions"><button className="text-button" onClick={() => setFiles([])}>Limpar</button></div></Panel>;
}

function TextCompareTool() {
  const [left, setLeft] = useState('Versão anterior\nLinha mantida\nLinha removida'); const [right, setRight] = useState('Versão atual\nLinha mantida\nLinha adicionada');
  const { removed, added } = compareTextLines(left, right);
  return <Panel title="Comparador de textos" description="Veja linhas que aparecem apenas em cada versão. Comparação simples, sem envio de conteúdo."><div className="unit-controls"><label className="text-field"><span>Texto A</span><textarea aria-label="Texto A" value={left} onChange={(event) => setLeft(event.target.value)}/></label><label className="text-field"><span>Texto B</span><textarea aria-label="Texto B" value={right} onChange={(event) => setRight(event.target.value)}/></label></div><div className="file-actions"><button className="text-button" onClick={() => { setLeft(''); setRight(''); }}>Limpar os dois textos</button></div><div className="diff-results"><div><strong>− Removidas ({removed.length})</strong>{removed.length ? removed.map((line, i) => <code key={`${i}-${line}`}>{line}</code>) : <span>Nenhuma</span>}</div><div><strong>+ Adicionadas ({added.length})</strong>{added.length ? added.map((line, i) => <code key={`${i}-${line}`}>{line}</code>) : <span>Nenhuma</span>}</div></div></Panel>;
}

function FileIdentifierTool() {
  const [file, setFile] = useState<File | null>(null); const [result, setResult] = useState('');
  const identify = async (selected?: File) => { setFile(selected ?? null); setResult(''); if (!selected) return; const bytes = new Uint8Array(await selected.slice(0, 16).arrayBuffer()); const hex = Array.from(bytes).map((v) => v.toString(16).padStart(2, '0')).join(''); let type = selected.type || 'desconhecido'; if (hex.startsWith('89504e470d0a1a0a')) type = 'PNG'; else if (hex.startsWith('ffd8ff')) type = 'JPEG'; else if (new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-') type = 'PDF'; else if (new TextDecoder().decode(bytes.slice(0, 4)) === 'PK\u0003\u0004') type = 'ZIP'; else if (selected.type === 'image/webp') type = 'WebP'; setResult(type); };
  return <Panel title="Identificador de arquivos" description="Inspecione alguns bytes iniciais e metadados básicos do arquivo, sem fazer upload."><DropInput label="Selecionar arquivo" onFiles={(incoming) => void identify(incoming[0])}/>{file && <><div className="conversion-grid"><div className="format-row"><span>Nome</span><code>{file.name}</code></div><div className="format-row"><span>Tamanho</span><code>{formatBytes(file.size)}</code></div><div className="format-row"><span>Tipo estimado</span><code>{result || 'Analisando…'}</code></div></div><div className="file-actions"><button className="text-button" onClick={() => void identify(undefined)}>Limpar arquivo</button></div></>}<p className="electronics-note">A identificação é apenas indicativa e reconhece assinaturas comuns; não verifica segurança ou integridade completa do arquivo.</p></Panel>;
}
