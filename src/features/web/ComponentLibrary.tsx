import { useMemo, useState } from 'react';
import { CopyResultButton } from '../../components/CopyResultButton';

type Kind = 'button' | 'card' | 'badge' | 'alert' | 'input' | 'select' | 'textarea' | 'checkbox' | 'switch' | 'progress';
type VisualStyle = 'solid' | 'gradient' | 'glass' | 'raised' | 'tilted' | 'transparent' | 'neon';
const labels: Record<Kind, string> = { button: 'Botão', card: 'Card', badge: 'Selo', alert: 'Aviso', input: 'Campo de texto', select: 'Seletor', textarea: 'Área de texto', checkbox: 'Checkbox', switch: 'Switch', progress: 'Barra de progresso' };

export function ComponentLibrary() {
  const [kind, setKind] = useState<Kind>('card');
  const [title, setTitle] = useState('Componente personalizado');
  const [description, setDescription] = useState('Edite as opções e veja a prévia e o código atualizarem juntos.');
  const [accent, setAccent] = useState('#19C5D8');
  const [surface, setSurface] = useState('#10232D');
  const [radius, setRadius] = useState(14);
  const [padding, setPadding] = useState(20);
  const [shadow, setShadow] = useState(true);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('solid');
  const [gradientColor, setGradientColor] = useState('#725CFF');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [opacity, setOpacity] = useState(55);
  const [shadowColor, setShadowColor] = useState('#19C5D8');
  const [shadowBlur, setShadowBlur] = useState(24);
  const [shadowDepth, setShadowDepth] = useState(12);
  const [tilt, setTilt] = useState(8);
  const decoration = visualStyle === 'gradient'
    ? `background: linear-gradient(${gradientAngle}deg, ${accent}, ${gradientColor});`
    : visualStyle === 'glass'
      ? `background: color-mix(in srgb, ${surface} ${opacity}%, transparent); backdrop-filter: blur(${Math.max(4, Math.round(shadowBlur / 3))}px); -webkit-backdrop-filter: blur(${Math.max(4, Math.round(shadowBlur / 3))}px); border: 1px solid color-mix(in srgb, ${accent} 50%, transparent);`
      : visualStyle === 'raised'
        ? `background: linear-gradient(160deg, color-mix(in srgb, ${accent} 30%, ${surface}), ${surface}); transform: translateY(-${Math.round(shadowDepth / 3)}px);`
        : visualStyle === 'tilted'
          ? `background: linear-gradient(135deg, ${accent}, ${surface}); transform: perspective(700px) rotateX(${tilt}deg) rotateY(${-tilt}deg);`
          : visualStyle === 'transparent'
            ? `background: color-mix(in srgb, ${surface} ${opacity}%, transparent); border: 1px solid color-mix(in srgb, ${accent} 65%, transparent);`
            : visualStyle === 'neon'
              ? `background: color-mix(in srgb, ${surface} 88%, #000); border: 1px solid ${accent}; color: ${accent};`
              : kind === 'button' ? `background: ${accent}; color: #071219;` : kind === 'badge' ? `background: color-mix(in srgb, ${accent} 18%, ${surface}); color: ${accent};` : `background: ${surface};`;
  const shadowCss = shadow ? visualStyle === 'raised'
    ? `box-shadow: 0 ${shadowDepth}px 0 color-mix(in srgb, ${shadowColor} 70%, #071219), 0 ${shadowDepth * 2}px ${shadowBlur}px color-mix(in srgb, ${shadowColor} 35%, transparent);`
    : visualStyle === 'neon'
      ? `box-shadow: 0 0 ${shadowBlur + shadowDepth * 2}px color-mix(in srgb, ${shadowColor} 70%, transparent), inset 0 0 ${Math.round(shadowBlur / 2)}px color-mix(in srgb, ${shadowColor} 24%, transparent); text-shadow: 0 0 ${Math.round(shadowBlur / 3)}px ${accent};`
      : `box-shadow: 0 8px ${shadowBlur}px color-mix(in srgb, ${shadowColor} 28%, transparent);`
    : 'box-shadow: none;';
  const transformCss = visualStyle === 'tilted' ? `transform: perspective(700px) rotateX(${tilt}deg) rotateY(${-tilt}deg);` : visualStyle === 'raised' ? `transform: translateY(-${Math.round(shadowDepth / 3)}px);` : '';
  const componentPadding = kind === 'badge' ? `${Math.max(4, padding / 3)}px ${Math.max(8, padding / 2)}px` : kind === 'progress' ? '0' : `${padding}px`;
  const css = useMemo(() => `.yva-component {\n  box-sizing: border-box;\n  color: ${visualStyle === 'neon' || kind === 'badge' ? accent : '#F2FAFC'};\n  font: 500 15px/1.5 system-ui, sans-serif;\n  border-radius: ${radius}px;\n  padding: ${componentPadding};\n  ${kind === 'button' ? 'border: 0; cursor: pointer;' : ['input', 'select', 'textarea'].includes(kind) ? `width: 100%; display: block; border: 1px solid ${accent}; outline-color: ${accent};` : kind === 'checkbox' || kind === 'switch' ? `display: inline-flex; align-items: center; gap: 10px; cursor: pointer; accent-color: ${accent};` : kind === 'progress' ? `width: 100%; height: 14px; padding: 0; overflow: hidden; border: 1px solid ${accent};` : `border: 1px solid color-mix(in srgb, ${accent} 45%, transparent);`}\n  ${decoration}\n  ${shadowCss}\n  ${transformCss}\n  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;\n}\n.yva-component h3 { margin: 0 0 8px; font-size: 1.1rem; }\n.yva-component p { margin: 0; color: #B6CAD2; }\n.yva-component:focus-visible { outline: 3px solid ${accent}; outline-offset: 3px; }\n.yva-component-progress { width: 68%; height: 100%; display: block; background: linear-gradient(90deg, ${accent}, ${gradientColor}); }\n.yva-component-switch input { appearance: none; width: 38px; height: 22px; border-radius: 20px; background: #52636b; position: relative; cursor: pointer; }\n.yva-component-switch input:checked { background: ${accent}; }\n.yva-component-switch input::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: white; transition: transform 150ms ease; }\n.yva-component-switch input:checked::after { transform: translateX(16px); }`, [accent, gradientColor, radius, componentPadding, kind, visualStyle, decoration, shadowCss, transformCss]);
  const html = useMemo(() => {
    const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    if (kind === 'button') return `<button class="yva-component" type="button">${safeTitle}</button>`;
    if (kind === 'badge') return `<span class="yva-component">${safeTitle}</span>`;
    if (kind === 'input') return `<label class="yva-component">${safeTitle}<input type="text" placeholder="${safeDescription}" /></label>`;
    if (kind === 'select') return `<label class="yva-component">${safeTitle}<select><option>${safeDescription || 'Escolha uma opção'}</option><option>Outra opção</option></select></label>`;
    if (kind === 'textarea') return `<label class="yva-component">${safeTitle}<textarea rows="4" placeholder="${safeDescription}"></textarea></label>`;
    if (kind === 'checkbox') return `<label class="yva-component"><input type="checkbox" checked /> ${safeTitle}</label>`;
    if (kind === 'switch') return `<label class="yva-component yva-component-switch"><input type="checkbox" role="switch" checked /> ${safeTitle}</label>`;
    if (kind === 'progress') return `<div class="yva-component" role="progressbar" aria-label="${safeTitle}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="68"><span class="yva-component-progress"></span></div>`;
    return `<section class="yva-component" role="${kind === 'alert' ? 'status' : 'group'}">\n  <h3>${safeTitle}</h3>\n  <p>${safeDescription}</p>\n</section>`;
  }, [kind, title, description]);
  const previewBackground = visualStyle === 'gradient' ? `linear-gradient(${gradientAngle}deg, ${accent}, ${gradientColor})` : visualStyle === 'glass' ? `color-mix(in srgb, ${surface} ${opacity}%, transparent)` : visualStyle === 'transparent' ? `color-mix(in srgb, ${surface} ${opacity}%, transparent)` : visualStyle === 'raised' ? `linear-gradient(160deg, color-mix(in srgb, ${accent} 30%, ${surface}), ${surface})` : visualStyle === 'tilted' ? `linear-gradient(135deg, ${accent}, ${surface})` : visualStyle === 'neon' ? `color-mix(in srgb, ${surface} 88%, #000)` : kind === 'button' ? accent : kind === 'badge' ? `color-mix(in srgb, ${accent} 18%, ${surface})` : surface;
  const previewShadow = !shadow ? undefined : visualStyle === 'raised' ? `0 ${shadowDepth}px 0 color-mix(in srgb, ${shadowColor} 70%, #071219), 0 ${shadowDepth * 2}px ${shadowBlur}px color-mix(in srgb, ${shadowColor} 35%, transparent)` : visualStyle === 'neon' ? `0 0 ${shadowBlur + shadowDepth * 2}px color-mix(in srgb, ${shadowColor} 70%, transparent), inset 0 0 ${Math.round(shadowBlur / 2)}px color-mix(in srgb, ${shadowColor} 24%, transparent)` : `0 8px ${shadowBlur}px color-mix(in srgb, ${shadowColor} 28%, transparent)`;
  const previewTransform = visualStyle === 'tilted' ? `perspective(700px) rotateX(${tilt}deg) rotateY(${-tilt}deg)` : visualStyle === 'raised' ? `translateY(-${Math.round(shadowDepth / 3)}px)` : undefined;
  const previewStyle = { background: previewBackground, backdropFilter: visualStyle === 'glass' ? `blur(${Math.max(4, Math.round(shadowBlur / 3))}px)` : undefined, WebkitBackdropFilter: visualStyle === 'glass' ? `blur(${Math.max(4, Math.round(shadowBlur / 3))}px)` : undefined, color: visualStyle === 'neon' || kind === 'badge' ? accent : kind === 'button' ? '#071219' : '#F2FAFC', borderRadius: radius, padding: componentPadding, border: `1px solid ${accent}`, boxShadow: previewShadow, transform: previewTransform, width: ['input', 'select', 'textarea', 'progress'].includes(kind) ? '100%' : 'auto', transition: 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease' } as const;
  return <section className="web-tool-panel component-library">
    <header className="web-panel-heading"><h2>Biblioteca de componentes</h2><p>Personalize elementos comuns e copie HTML e CSS para usar em outro projeto. A prévia não executa código externo.</p></header>
    <div className="component-library-layout">
      <div className="component-controls">
        <label className="text-field"><span>Componente</span><select className="select-control" aria-label="Tipo de componente" value={kind} onChange={e => setKind(e.target.value as Kind)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-field"><span>Título ou texto</span><input aria-label="Título do componente" value={title} maxLength={80} onChange={e => setTitle(e.target.value)}/></label>
        {kind !== 'button' && kind !== 'badge' && <label className="text-field"><span>Descrição ou placeholder</span><input aria-label="Descrição do componente" value={description} maxLength={140} onChange={e => setDescription(e.target.value)}/></label>}
        <label className="color-control"><span>Cor de destaque</span><div><input aria-label="Cor de destaque do componente" type="color" value={accent} onChange={e => setAccent(e.target.value.toUpperCase())}/><code>{accent}</code></div></label>
        <label className="color-control"><span>Cor de fundo</span><div><input aria-label="Cor de fundo do componente" type="color" value={surface} onChange={e => setSurface(e.target.value.toUpperCase())}/><code>{surface}</code></div></label>
        <label className="text-field"><span>Estilo visual</span><select className="select-control" aria-label="Estilo visual do componente" value={visualStyle} onChange={e => setVisualStyle(e.target.value as VisualStyle)}><option value="solid">Sólido</option><option value="gradient">Gradiente</option><option value="glass">Vidro fosco</option><option value="raised">3D elevado</option><option value="tilted">3D inclinado</option><option value="transparent">Transparente</option><option value="neon">Neon</option></select></label>
        {visualStyle === 'gradient' && <><label className="color-control"><span>Segunda cor do gradiente</span><div><input aria-label="Segunda cor do gradiente" type="color" value={gradientColor} onChange={e => setGradientColor(e.target.value.toUpperCase())}/><code>{gradientColor}</code></div></label><label className="range-control"><span>Direção do gradiente <strong>{gradientAngle}°</strong></span><input aria-label="Direção do gradiente" type="range" min="0" max="360" value={gradientAngle} onChange={e => setGradientAngle(Number(e.target.value))}/></label></>}
        {(visualStyle === 'glass' || visualStyle === 'transparent') && <label className="range-control"><span>Opacidade <strong>{opacity}%</strong></span><input aria-label="Opacidade do componente" type="range" min="10" max="95" value={opacity} onChange={e => setOpacity(Number(e.target.value))}/></label>}
        {visualStyle === 'tilted' && <label className="range-control"><span>Inclinação 3D <strong>{tilt}°</strong></span><input aria-label="Inclinação 3D" type="range" min="0" max="24" value={tilt} onChange={e => setTilt(Number(e.target.value))}/></label>}
        <label className="range-control"><span>Arredondamento <strong>{radius}px</strong></span><input aria-label="Arredondamento do componente" type="range" min="0" max="32" value={radius} onChange={e => setRadius(Number(e.target.value))}/></label>
        <label className="range-control"><span>Espaçamento <strong>{padding}px</strong></span><input aria-label="Espaçamento do componente" type="range" min="6" max="36" value={padding} onChange={e => setPadding(Number(e.target.value))}/></label>
        <label className="color-control"><span>Cor da sombra</span><div><input aria-label="Cor da sombra" type="color" value={shadowColor} onChange={e => setShadowColor(e.target.value.toUpperCase())}/><code>{shadowColor}</code></div></label>
        <label className="range-control"><span>Desfoque da sombra <strong>{shadowBlur}px</strong></span><input aria-label="Desfoque da sombra" type="range" min="0" max="48" value={shadowBlur} onChange={e => setShadowBlur(Number(e.target.value))}/></label>
        {(visualStyle === 'raised' || visualStyle === 'neon') && <label className="range-control"><span>{visualStyle === 'raised' ? 'Profundidade 3D' : 'Intensidade do brilho'} <strong>{shadowDepth}px</strong></span><input aria-label="Profundidade ou brilho" type="range" min="0" max="28" value={shadowDepth} onChange={e => setShadowDepth(Number(e.target.value))}/></label>}
        <label className="button-disabled-toggle"><input type="checkbox" checked={shadow} onChange={e => setShadow(e.target.checked)}/><span>Ativar sombra ou brilho</span></label>
      </div>
      <div className="component-preview-column"><div className="component-preview-stage" aria-label={`Prévia de ${labels[kind]}`}>
        {kind === 'button' ? <button className="yva-component-preview" style={previewStyle}>{title}</button> : kind === 'badge' ? <span className="yva-component-preview" style={previewStyle}>{title}</span> : kind === 'input' ? <label className="yva-component-preview" style={previewStyle}>{title}<input placeholder={description} /></label> : kind === 'select' ? <label className="yva-component-preview component-preview-label" style={previewStyle}>{title}<select><option>{description || 'Escolha uma opção'}</option><option>Outra opção</option></select></label> : kind === 'textarea' ? <label className="yva-component-preview component-preview-label" style={previewStyle}>{title}<textarea rows={3} placeholder={description}/></label> : kind === 'checkbox' ? <label className="yva-component-preview component-preview-inline" style={previewStyle}><input type="checkbox" defaultChecked/> {title}</label> : kind === 'switch' ? <label className="yva-component-preview component-preview-inline" style={previewStyle}><input type="checkbox" role="switch" defaultChecked/> {title}</label> : kind === 'progress' ? <div className="yva-component-preview component-preview-progress" style={previewStyle} role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={68}><span/></div> : <section className="yva-component-preview" style={previewStyle} role={kind === 'alert' ? 'status' : 'group'}><h3>{title}</h3><p>{description}</p></section>}
      </div><div className="component-code-block"><strong>HTML</strong><pre><code>{html}</code></pre><CopyResultButton value={html}/></div><div className="component-code-block"><strong>CSS</strong><pre><code>{css}</code></pre><CopyResultButton value={css}/></div><div className="component-code-block"><strong>HTML + CSS</strong><CopyResultButton value={`${html}\n\n<style>\n${css}\n</style>`}/></div></div>
    </div>
  </section>;
}
