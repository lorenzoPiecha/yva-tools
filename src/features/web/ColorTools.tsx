import { useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { CopyResultButton } from '../../components/CopyResultButton';

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="web-tool-panel"><header className="web-panel-heading"><h2>{title}</h2><p>{description}</p></header>{children}</section>;
}

function CopyValue({ value }: { value: string; label?: string }) { return <CopyResultButton value={value}/>; }

function validHex(hex: string) { return /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim()); }
function normalizeHex(hex: string) { let value = hex.trim().replace(/^#/, '').toUpperCase(); if (value.length === 3) value = [...value].map((digit) => digit + digit).join(''); return `#${value}`; }
function hexRgb(hex: string) {
  let value = hex.trim().replace(/^#/, '');
  if (value.length === 3) value = [...value].map((digit) => digit + digit).join('');
  const number = Number.parseInt(value, 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}
function rgbHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const red = r / 255; const green = g / 255; const blue = b / 255;
  const max = Math.max(red, green, blue); const min = Math.min(red, green, blue);
  const delta = max - min; let hue = 0; let saturation = 0;
  const lightness = (max + min) / 2;
  if (delta) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  return { h: hue, s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}

export function ColorConverter() {
  const [hex, setHex] = useState('#19C5D8');
  const normalized = validHex(hex) ? normalizeHex(hex) : hex;
  const rgb = validHex(hex) ? hexRgb(hex) : null;
  const hsl = rgb ? rgbHsl(rgb) : null;
  return <Panel title="Conversor de cores" description="Edite uma cor em HEX e veja os formatos equivalentes.">
    <label className="color-control conversion-color"><span>Cor de entrada</span><div><input aria-label="Selecionar cor" type="color" value={rgb ? normalized : '#000000'} onChange={(event) => setHex(event.target.value.toUpperCase())}/><input aria-label="Código HEX" className="hex-text-input" value={hex} onChange={(event) => setHex(event.target.value)} spellCheck={false}/></div></label>
    {rgb && hsl ? <div className="conversion-grid"><FormatRow label="HEX" value={normalized}/><FormatRow label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}/><FormatRow label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}/></div> : <p className="validation-message" role="alert">Informe uma cor HEX válida, como #19C5D8.</p>}
  </Panel>;
}
function FormatRow({ label, value }: { label: string; value: string }) { return <div className="format-row"><span>{label}</span><code>{value}</code><CopyValue value={value} label="Copiar"/></div>; }

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const channels = [r, g, b].map((channel) => { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
export function contrastRatio(foreground: string, background: string) {
  if (!validHex(foreground) || !validHex(background)) return null;
  const first = luminance(hexRgb(foreground)); const second = luminance(hexRgb(background));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
export function ContrastChecker() {
  const [foreground, setForeground] = useState('#E8F7FB'); const [background, setBackground] = useState('#071219');
  const ratio = contrastRatio(foreground, background);
  return <Panel title="Verificador de contraste" description="Avalie a legibilidade da combinação segundo os níveis WCAG para texto.">
    <div className="web-controls"><ColorField label="Texto" value={foreground} change={setForeground}/><ColorField label="Fundo" value={background} change={setBackground}/></div>
    <div className="contrast-preview" style={{ color: foreground, backgroundColor: background }}><strong>YVA Tools</strong><span>Texto de exemplo para visualizar o contraste.</span></div>
    <div className="contrast-results"><div className="contrast-ratio"><small>RELAÇÃO DE CONTRASTE</small><strong>{ratio?.toFixed(2) ?? '—'}:1</strong></div><ContrastBadge label="AA texto normal" pass={Boolean(ratio && ratio >= 4.5)}/><ContrastBadge label="AA texto grande" pass={Boolean(ratio && ratio >= 3)}/><ContrastBadge label="AAA texto normal" pass={Boolean(ratio && ratio >= 7)}/></div>
  </Panel>;
}
function ContrastBadge({ label, pass }: { label: string; pass: boolean }) { return <span className={`contrast-badge ${pass ? 'pass' : 'fail'}`}><i/>{label}: {pass ? 'passa' : 'não passa'}</span>; }
function ColorField({ label, value, change }: { label: string; value: string; change: (value: string) => void }) { return <label className="color-control"><span>{label}</span><div><input aria-label={label} type="color" value={value} onChange={(event) => change(event.target.value.toUpperCase())}/><code>{value}</code></div></label>; }

export function ImageColorExtractor() {
  const [colors, setColors] = useState<string[]>([]); const [error, setError] = useState(''); const [filename, setFilename] = useState('');
  const extract = (file?: File) => {
    setColors([]); setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Escolha um arquivo de imagem válido.'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('A imagem precisa ter até 15 MB para ser processada com segurança no navegador.'); return; }
    setFilename(file.name);
    const url = URL.createObjectURL(file); const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas'); const context = canvas.getContext('2d');
        if (!context) throw new Error('Este navegador não conseguiu processar a imagem.');
        canvas.width = 64; canvas.height = 64; context.drawImage(image, 0, 0, 64, 64);
        const pixels = context.getImageData(0, 0, 64, 64).data; const counts = new Map<string, number>();
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index + 3]! < 32) continue;
          const channel = (value: number) => Math.min(255, Math.round(value / 32) * 32);
          const color = `#${[channel(pixels[index]!), channel(pixels[index + 1]!), channel(pixels[index + 2]!)] .map((part) => part.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
          counts.set(color, (counts.get(color) ?? 0) + 1);
        }
        setColors([...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([color]) => color));
        if (!counts.size) setError('Não encontramos pixels visíveis nessa imagem.');
      } catch (caught) { setError(caught instanceof Error ? caught.message : 'Não foi possível analisar a imagem.'); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); setError('Não foi possível abrir essa imagem.'); };
    image.src = url;
  };
  return <Panel title="Extrator de cores" description="Selecione uma imagem; a análise acontece localmente neste navegador.">
    <label className="image-drop"><ImagePlus size={21}/><strong>{filename || 'Escolher imagem'}</strong><span>PNG, JPEG, WebP ou outro formato aceito pelo navegador</span><input type="file" accept="image/*" aria-label="Escolher imagem para extrair cores" onChange={(event) => extract(event.target.files?.[0])}/></label>
    {error && <p className="validation-message" role="alert">{error}</p>}
    {colors.length > 0 && <div className="extracted-colors">{colors.map((color) => <div className="extracted-color" key={color} style={{ backgroundColor: color }}><code>{color}</code><CopyValue value={color}/></div>)}</div>}
  </Panel>;
}
