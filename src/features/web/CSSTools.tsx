import { useState } from 'react';
import { NumberField } from '../../components/NumberField';
import { CopyResultButton } from '../../components/CopyResultButton';

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="web-tool-panel"><header className="web-panel-heading"><h2>{title}</h2><p>{description}</p></header>{children}</section>; }
function CopyCode({ value }: { value: string }) { return <div className="code-output"><code>{value}</code><CopyResultButton value={value}/></div>; }
function NumberControl({ label, value, setValue, min = 0, max = 100, unit = "px" }: { label: string; value: number; setValue: (value: number) => void; min?: number; max?: number; unit?: string }) { return <label className="range-control"><span>{label}<strong>{value}{unit}</strong></span><input type="range" aria-label={label} min={min} max={max} value={value} onChange={(event) => setValue(Number(event.target.value))}/></label>; }

export function ButtonGenerator() {
  const [background, setBackground] = useState('#19C5D8');
  const [foreground, setForeground] = useState('#071219');
  const [shadowColor, setShadowColor] = useState('#19C5D8');
  const [radius, setRadius] = useState(10);
  const [vertical, setVertical] = useState(12);
  const [horizontal, setHorizontal] = useState(22);
  const [depth, setDepth] = useState(12);
  const [tilt, setTilt] = useState(10);
  const [label, setLabel] = useState('Seu botão');
  const [style, setStyle] = useState<'solid' | 'gradient' | 'raised' | 'tilted' | 'outline' | 'glass' | 'neon'>('gradient');
  const [hover, setHover] = useState<'lift' | 'scale' | 'tilt' | 'glow' | 'none'>('lift');
  const [disabled, setDisabled] = useState(false);

  const tiltedTransform = `perspective(700px) rotateX(${tilt}deg) rotateY(${-tilt}deg) rotateZ(-1deg)`;
  const tiltedHover = `perspective(700px) rotateX(${Math.max(-18, tilt - 4)}deg) rotateY(${Math.min(18, tilt + 5)}deg) rotateZ(-1deg)`;
  const baseStyle: Record<typeof style, string> = {
    solid: `background: ${background}; border: 1px solid transparent;`,
    gradient: `background: linear-gradient(135deg, color-mix(in srgb, ${background} 72%, white), ${background} 54%, color-mix(in srgb, ${background} 72%, #06131a)); border: 1px solid color-mix(in srgb, ${background} 70%, white);`,
    raised: `background: linear-gradient(180deg, color-mix(in srgb, ${background} 76%, white), ${background}); border: 1px solid color-mix(in srgb, ${background} 70%, white); box-shadow: 0 ${Math.max(2, Math.round(depth * 0.55))}px 0 color-mix(in srgb, ${shadowColor} 65%, #061017), 0 ${depth}px ${depth * 2}px color-mix(in srgb, ${shadowColor} 32%, transparent);`,
    tilted: `background: linear-gradient(135deg, color-mix(in srgb, ${background} 72%, white), ${background} 58%, color-mix(in srgb, ${background} 65%, #06131a)); border: 1px solid color-mix(in srgb, ${background} 70%, white); transform: ${tiltedTransform};`,
    outline: `background: transparent; color: ${background}; border: 2px solid ${background}; box-shadow: 0 0 ${Math.round(depth / 2)}px color-mix(in srgb, ${shadowColor} 25%, transparent);`,
    glass: `background: color-mix(in srgb, ${background} 18%, transparent); border: 1px solid color-mix(in srgb, ${background} 58%, white); backdrop-filter: blur(12px); box-shadow: inset 0 1px 0 #ffffff45, 0 ${Math.round(depth / 2)}px ${depth * 2}px #0003;`,
    neon: `background: color-mix(in srgb, ${background} 12%, #061017); color: ${background}; border: 1px solid ${background}; text-shadow: 0 0 10px color-mix(in srgb, ${background} 70%, transparent); box-shadow: 0 0 ${depth}px color-mix(in srgb, ${shadowColor} 55%, transparent), inset 0 0 ${Math.round(depth / 2)}px color-mix(in srgb, ${shadowColor} 18%, transparent);`,
  };
  const hoverTransform: Record<typeof hover, string> = {
    lift: style === 'tilted' ? `${tiltedTransform} translateY(-3px)` : 'translateY(-3px)',
    scale: style === 'tilted' ? `${tiltedTransform} translateY(-1px) scale(1.05)` : 'translateY(-1px) scale(1.05)',
    tilt: style === 'tilted' ? `${tiltedHover} translateY(-2px)` : `${tiltedHover} translateY(-2px)`,
    glow: style === 'tilted' ? `${tiltedTransform} scale(1.025)` : 'scale(1.025)',
    none: style === 'tilted' ? tiltedTransform : 'none',
  };
  const hoverShadow = style === 'neon'
    ? `0 0 ${depth * 1.8}px color-mix(in srgb, ${shadowColor} 78%, transparent), inset 0 0 ${Math.round(depth / 2)}px color-mix(in srgb, ${shadowColor} 26%, transparent)`
    : style === 'raised'
      ? `0 ${Math.max(1, Math.round(depth * 0.7))}px 0 color-mix(in srgb, ${shadowColor} 65%, #061017), 0 ${depth * 1.5}px ${depth * 2}px color-mix(in srgb, ${shadowColor} 38%, transparent)`
      : `0 ${Math.round(depth / 2)}px ${depth * 1.4}px color-mix(in srgb, ${shadowColor} 38%, transparent)`;
  const css = `.yva-button {\n  --button-bg: ${background};\n  --button-text: ${foreground};\n  --button-shadow: ${shadowColor};\n  appearance: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: ${radius}px;\n  padding: ${vertical}px ${horizontal}px;\n  color: ${style === 'outline' || style === 'neon' ? background : foreground};\n  font: 600 14px/1.2 system-ui, sans-serif;\n  cursor: pointer;\n  transform-style: preserve-3d;\n  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease, background-color 180ms ease;\n  ${baseStyle[style]}\n}\n.yva-button:hover:not(:disabled) {\n  transform: ${hoverTransform[hover]};\n  filter: brightness(1.1) saturate(1.08);\n  box-shadow: ${hoverShadow};\n}\n.yva-button:active:not(:disabled) {\n  transform: translateY(1px) scale(.98);\n  filter: brightness(.96);\n}\n.yva-button:focus-visible {\n  outline: 3px solid color-mix(in srgb, ${background} 55%, white);\n  outline-offset: 4px;\n}\n.yva-button:disabled {\n  opacity: .52;\n  cursor: not-allowed;\n  filter: grayscale(.35);\n  transform: none;\n  box-shadow: none;\n}\n@media (prefers-reduced-motion: reduce) {\n  .yva-button { transition: none; }\n}`;

  return <Panel title="Gerador de botões" description="Crie estilos planos, gradientes, 3D, vidro ou neon. Ajuste a interação e copie o CSS completo com hover, foco e estado desabilitado.">
    <style>{css}</style>
    <div className={`button-preview-stage button-preview-stage-${style}`}><button type="button" className="button-preview yva-button" disabled={disabled}>{label || 'Seu botão'}</button></div>
    <div className="button-generator-controls">
      <label className="text-field"><span>Texto do botão</span><input aria-label="Texto do botão" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={48} placeholder="Ex.: Saiba mais" /></label>
      <label className="text-field"><span>Estilo visual</span><select aria-label="Estilo visual do botão" className="select-control" value={style} onChange={(event) => setStyle(event.target.value as typeof style)}><option value="solid">Sólido</option><option value="gradient">Gradiente</option><option value="raised">3D elevado</option><option value="tilted">3D inclinado</option><option value="outline">Contorno</option><option value="glass">Vidro fosco</option><option value="neon">Neon</option></select></label>
      <label className="text-field"><span>Efeito ao passar o mouse</span><select aria-label="Efeito ao passar o mouse" className="select-control" value={hover} onChange={(event) => setHover(event.target.value as typeof hover)}><option value="lift">Elevar</option><option value="scale">Ampliar</option><option value="tilt">Inclinar</option><option value="glow">Brilho suave</option><option value="none">Sem movimento</option></select></label>
      <div className="web-controls">
        <label className="color-control"><span>Fundo / destaque</span><div><input aria-label="Cor do fundo do botão" type="color" value={background} onChange={(event) => setBackground(event.target.value.toUpperCase())}/><code>{background}</code></div></label>
        <label className="color-control"><span>Texto</span><div><input aria-label="Cor do texto do botão" type="color" value={foreground} onChange={(event) => setForeground(event.target.value.toUpperCase())}/><code>{foreground}</code></div></label>
        <label className="color-control"><span>Sombra / brilho</span><div><input aria-label="Cor da sombra do botão" type="color" value={shadowColor} onChange={(event) => setShadowColor(event.target.value.toUpperCase())}/><code>{shadowColor}</code></div></label>
        <NumberControl label="Raio" value={radius} setValue={setRadius} max={40}/>
        <NumberControl label="Espaço vertical" value={vertical} setValue={setVertical} max={32}/>
        <NumberControl label="Espaço horizontal" value={horizontal} setValue={setHorizontal} max={60}/>
        <NumberControl label="Profundidade / brilho" value={depth} setValue={setDepth} max={32}/>
        {style === 'tilted' && <NumberControl label="Inclinação 3D" value={tilt} setValue={setTilt} min={0} max={18} unit="°"/>}
      </div>
      <label className="button-disabled-toggle"><input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)}/><span>Pré-visualizar e gerar estado desabilitado</span></label>
    </div>
    <CopyCode value={css}/>
  </Panel>;
}

export function BorderGenerator() {
  const [color, setColor] = useState('#5EE7F7'); const [width, setWidth] = useState(2); const [radius, setRadius] = useState({ topLeft: 18, topRight: 18, bottomRight: 18, bottomLeft: 18 }); const [linked, setLinked] = useState(true); const [style, setStyle] = useState('solid');
  const setCorner = (corner: keyof typeof radius, value: number) => setRadius((current) => linked ? { topLeft: value, topRight: value, bottomRight: value, bottomLeft: value } : { ...current, [corner]: value });
  const radiusValue = `${radius.topLeft}px ${radius.topRight}px ${radius.bottomRight}px ${radius.bottomLeft}px`;
  const css = `border: ${width}px ${style} ${color};\nborder-radius: ${radiusValue};`;
  return <Panel title="Bordas e cantos" description="Ajuste cada canto, escolha o estilo da borda e copie o CSS gerado."><div className="border-preview-stage"><div className="border-preview" style={{ border: `${width}px ${style} ${color}`, borderRadius: radiusValue }}><span>Prévia</span></div></div><div className="web-controls"><label className="color-control"><span>Cor da borda</span><div><input aria-label="Cor da borda" type="color" value={color} onChange={(event) => setColor(event.target.value.toUpperCase())}/><code>{color}</code></div></label><NumberControl label="Espessura" value={width} setValue={setWidth} max={16}/><label className="button-disabled-toggle corner-link-toggle"><input type="checkbox" checked={linked} onChange={(event) => setLinked(event.target.checked)}/><span>Manter os quatro cantos iguais</span></label><div className="corner-radius-controls">{([['topLeft', 'Superior esquerdo'], ['topRight', 'Superior direito'], ['bottomRight', 'Inferior direito'], ['bottomLeft', 'Inferior esquerdo']] as const).map(([corner, label]) => <NumberControl key={corner} label={label} value={radius[corner]} setValue={(value) => setCorner(corner, value)} max={100}/>)}</div><label className="color-control"><span>Estilo</span><select className="select-control" value={style} onChange={(event) => setStyle(event.target.value)}><option value="solid">Sólida</option><option value="dashed">Tracejada</option><option value="dotted">Pontilhada</option><option value="double">Dupla</option></select></label></div><CopyCode value={css}/></Panel>;
}

export function CssUnitConverter() {
  const [value, setValue] = useState('16'); const [base, setBase] = useState('16');
  const parsed = Number(value); const parsedBase = Number(base); const valid = value.trim() !== '' && base.trim() !== '' && Number.isFinite(parsed) && Number.isFinite(parsedBase) && parsedBase > 0;
  const px = valid ? parsed : 0; const rem = valid ? parsed / parsedBase : 0;
  return <Panel title="Conversor de unidades CSS" description="Converta px e rem com o tamanho base do documento configurável."><div className="unit-controls"><label className="text-field"><span>Valor em px</span><NumberField label="Valor em pixels" value={value} onChange={setValue} min="0" step="1" unit="px"/></label><label className="text-field"><span>Tamanho base (px)</span><NumberField label="Tamanho base em pixels" value={base} onChange={setBase} min="1" step="1" unit="px"/></label></div>{valid ? <div className="conversion-grid"><div className="format-row"><span>REM</span><code>{Number(rem.toFixed(4))}rem</code></div><div className="format-row"><span>PX</span><code>{px}px</code></div></div> : <p className="validation-message" role="alert">Digite valores numéricos e uma base maior que zero.</p>}</Panel>;
}
