import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Download, FlipHorizontal, FlipVertical, RotateCcw, RotateCw, Scissors, Trash2, Upload } from "lucide-react";
import { NumberField } from "../../components/NumberField";

type Crop = { x: number; y: number; width: number; height: number };
type Adjustments = { brightness: number; contrast: number; saturation: number; grayscale: number; sepia: number; blur: number };
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_SIDE = 4096;

function RangeControl({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) {
  return <label className="photo-range"><span>{label}<strong>{value}{unit}</strong></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

export function PhotoEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [adjust, setAdjust] = useState<Adjustments>({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 });
  const [overlayText, setOverlayText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textSize, setTextSize] = useState("48");
  const [exportWidth, setExportWidth] = useState("0");
  const [exportHeight, setExportHeight] = useState("0");
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState(92);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const resetEdits = () => {
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setCropEnabled(false);
    setCrop(null);
    setAdjust({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 });
    setOverlayText("");
    setTextColor("#FFFFFF");
    setTextSize("48");
    setExportWidth("0");
    setExportHeight("0");
    setError("");
    setNotice("");
  };

  const openImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Escolha um arquivo de imagem."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("A imagem deve ter no máximo 20 MB."); return; }
    setError("");
    const url = URL.createObjectURL(file);
    const next = new Image();
    next.onload = () => {
      URL.revokeObjectURL(url);
      if (!next.naturalWidth || !next.naturalHeight) { setError("Não foi possível ler as dimensões desta imagem."); return; }
      const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(next.naturalWidth, next.naturalHeight));
      setDimensions({ width: Math.max(1, Math.round(next.naturalWidth * scale)), height: Math.max(1, Math.round(next.naturalHeight * scale)) });
      setImage(next);
      setFileName(file.name.replace(/\.[^.]+$/, "") || "imagem");
      resetEdits();
    };
    next.onerror = () => { URL.revokeObjectURL(url); setError("Este formato não foi reconhecido pelo navegador."); };
    next.src = url;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !image) return;
    const width = rotation % 180 === 0 ? dimensions.width : dimensions.height;
    const height = rotation % 180 === 0 ? dimensions.height : dimensions.width;
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.save();
    context.filter = `brightness(${adjust.brightness}%) contrast(${adjust.contrast}%) saturate(${adjust.saturation}%) grayscale(${adjust.grayscale}%) sepia(${adjust.sepia}%) blur(${adjust.blur}px)`;
    context.translate(width / 2, height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    context.drawImage(image, -dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
    context.restore();
    if (overlayText.trim()) {
      const fontSize = Math.max(8, Math.min(300, Number(textSize) || 48));
      context.save();
      context.font = `700 ${fontSize}px system-ui, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineJoin = "round";
      context.strokeStyle = "#000000B8";
      context.lineWidth = Math.max(2, fontSize * 0.12);
      context.strokeText(overlayText.slice(0, 120), width / 2, height / 2, width * 0.88);
      context.fillStyle = textColor;
      context.fillText(overlayText.slice(0, 120), width / 2, height / 2, width * 0.88);
      context.restore();
    }
  }, [image, dimensions, rotation, flipX, flipY, adjust, overlayText, textColor, textSize]);

  const pointerPosition = (event: PointerEvent<SVGSVGElement>) => {
    const canvas = canvasRef.current;
    const bounds = canvas?.getBoundingClientRect();
    if (!canvas || !bounds?.width || !bounds.height) return null;
    return {
      x: Math.max(0, Math.min(canvas.width, ((event.clientX - bounds.left) / bounds.width) * canvas.width)),
      y: Math.max(0, Math.min(canvas.height, ((event.clientY - bounds.top) / bounds.height) * canvas.height)),
    };
  };

  const onCropPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!cropEnabled) return;
    const point = pointerPosition(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = point;
    setCrop({ x: point.x, y: point.y, width: 0, height: 0 });
  };
  const onCropPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!cropEnabled || !dragStart.current) return;
    const point = pointerPosition(event);
    if (!point) return;
    const start = dragStart.current;
    setCrop({ x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), width: Math.abs(point.x - start.x), height: Math.abs(point.y - start.y) });
  };
  const onCropPointerUp = () => { dragStart.current = null; };

  const exportImage = () => {
    const source = canvasRef.current;
    if (!source) return;
    const hasCrop = Boolean(crop && crop.width > 1 && crop.height > 1);
    const sx = hasCrop ? crop!.x : 0;
    const sy = hasCrop ? crop!.y : 0;
    const sw = hasCrop ? crop!.width : source.width;
    const sh = hasCrop ? crop!.height : source.height;
    const width = Math.max(1, Math.min(MAX_IMAGE_SIDE, Math.round(Number(exportWidth) > 0 ? Number(exportWidth) : sw)));
    const height = Math.max(1, Math.min(MAX_IMAGE_SIDE, Math.round(Number(exportHeight) > 0 ? Number(exportHeight) : sh)));
    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const context = output.getContext("2d");
    if (!context) { setError("O navegador não conseguiu preparar a imagem para exportação."); return; }
    if (format === "image/jpeg") { context.fillStyle = "#FFFFFF"; context.fillRect(0, 0, width, height); }
    context.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
    output.toBlob((blob) => {
      if (!blob) { setError("Falha ao gerar o arquivo. Tente outro formato ou reduza a resolução."); return; }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const extension = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";
      anchor.href = url;
      anchor.download = `${fileName || "imagem"}-editada.${extension}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
      setNotice("Imagem exportada. Ela foi processada neste navegador.");
    }, format, quality / 100);
  };

  const updateAdjustment = (key: keyof Adjustments, value: number) => setAdjust((current) => ({ ...current, [key]: value }));
  const canvasWidth = rotation % 180 === 0 ? dimensions.width : dimensions.height;
  const canvasHeight = rotation % 180 === 0 ? dimensions.height : dimensions.width;
  const cropPath = crop && crop.width > 1 && crop.height > 1
    ? `M0 0H${canvasWidth}V${canvasHeight}H0Z M${crop.x} ${crop.y}V${crop.y + crop.height}H${crop.x + crop.width}V${crop.y}Z`
    : "";

  return <section className="web-tool-panel photo-editor-panel">
    <header className="web-panel-heading"><h2>Editor de imagens</h2><p>Faça ajustes rápidos em imagens no próprio navegador: recorte, gire, adicione texto e exporte. Os arquivos não são enviados a um servidor.</p></header>
    <label className="photo-upload"><Upload size={19}/><strong>{image ? "Trocar imagem" : "Abrir uma imagem"}</strong><span>PNG, JPEG, WebP e formatos reconhecidos pelo navegador · até 20 MB</span><input type="file" accept="image/*" aria-label="Abrir imagem para editar" onChange={(event) => openImage(event.target.files?.[0])}/></label>
    {error && <p className="validation-message" role="alert">{error}</p>}
    {image && <>
      <div className="photo-editor-toolbar">
        <button type="button" className="outline-button" onClick={() => setRotation((value) => (value + 270) % 360)} aria-label="Girar para a esquerda"><RotateCcw size={15}/> Girar à esquerda</button>
        <button type="button" className="outline-button" onClick={() => setRotation((value) => (value + 90) % 360)} aria-label="Girar para a direita"><RotateCw size={15}/> Girar à direita</button>
        <button type="button" className="outline-button" onClick={() => setFlipX((value) => !value)}><FlipHorizontal size={15}/> Espelhar horizontal</button>
        <button type="button" className="outline-button" onClick={() => setFlipY((value) => !value)}><FlipVertical size={15}/> Espelhar vertical</button>
        <button type="button" className={`outline-button ${cropEnabled ? "photo-tool-active" : ""}`} onClick={() => { setCropEnabled((value) => !value); setCrop(null); }} aria-pressed={cropEnabled}><Scissors size={15}/> {cropEnabled ? "Arraste para recortar" : "Recortar"}</button>
        {crop && <button type="button" className="outline-button" onClick={() => { setCrop(null); setCropEnabled(false); }}><Trash2 size={15}/> Limpar recorte</button>}
        <button type="button" className="text-button" onClick={resetEdits}>Redefinir ajustes</button>
      </div>
      <div className={`photo-editor-stage ${cropEnabled ? "photo-crop-active" : ""}`}>
        <div className="photo-canvas-shell">
          <canvas ref={canvasRef} aria-label="Prévia editada da imagem" />
          {cropEnabled && <svg className="photo-crop-overlay" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} preserveAspectRatio="none" onPointerDown={onCropPointerDown} onPointerMove={onCropPointerMove} onPointerUp={onCropPointerUp} onPointerCancel={onCropPointerUp} aria-label="Arraste sobre a imagem para selecionar o recorte">
            {cropPath && <path d={cropPath} fill="#00000099" fillRule="evenodd" pointerEvents="none"/>}
            {crop && crop.width > 1 && crop.height > 1 && <rect x={crop.x} y={crop.y} width={crop.width} height={crop.height} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(2, canvasWidth / 700)} strokeDasharray={`${Math.max(5, canvasWidth / 100)} ${Math.max(3, canvasWidth / 180)}`} pointerEvents="none"/>}
          </svg>}
        </div>
      </div>
      <div className="photo-editor-info"><strong>{fileName}</strong><span>{canvasWidth} × {canvasHeight} px {crop && crop.width > 1 && `· recorte ${Math.round(crop.width)} × ${Math.round(crop.height)} px`}</span><span>Prévia limitada a {MAX_IMAGE_SIDE}px no maior lado para manter a edição leve.</span></div>
      <div className="photo-editor-controls">
        <section className="photo-control-section"><h3>Ajustes</h3><div className="photo-adjustment-grid">
          <RangeControl label="Brilho" value={adjust.brightness} min={0} max={200} unit="%" onChange={(value) => updateAdjustment("brightness", value)}/>
          <RangeControl label="Contraste" value={adjust.contrast} min={0} max={200} unit="%" onChange={(value) => updateAdjustment("contrast", value)}/>
          <RangeControl label="Saturação" value={adjust.saturation} min={0} max={200} unit="%" onChange={(value) => updateAdjustment("saturation", value)}/>
          <RangeControl label="Preto e branco" value={adjust.grayscale} min={0} max={100} unit="%" onChange={(value) => updateAdjustment("grayscale", value)}/>
          <RangeControl label="Sépia" value={adjust.sepia} min={0} max={100} unit="%" onChange={(value) => updateAdjustment("sepia", value)}/>
          <RangeControl label="Desfoque" value={adjust.blur} min={0} max={12} unit="px" onChange={(value) => updateAdjustment("blur", value)}/>
        </div></section>
        <section className="photo-control-section"><h3>Texto sobre a imagem</h3><label className="text-field"><span>Texto (opcional)</span><input value={overlayText} maxLength={120} onChange={(event) => setOverlayText(event.target.value)} placeholder="Digite uma legenda"/></label><div className="photo-text-options"><label className="color-control"><span>Cor do texto</span><div><input aria-label="Cor do texto sobre a imagem" type="color" value={textColor} onChange={(event) => setTextColor(event.target.value.toUpperCase())}/><code>{textColor}</code></div></label><label className="text-field"><span>Tamanho do texto</span><NumberField label="Tamanho do texto em pixels" value={textSize} onChange={setTextSize} min="8" max="300" step="1" unit="px"/></label></div></section>
        <section className="photo-control-section"><h3>Exportação</h3><div className="photo-text-options"><label className="text-field"><span>Largura (0 = automático)</span><NumberField label="Largura de exportação" value={exportWidth} onChange={setExportWidth} min="0" max={MAX_IMAGE_SIDE} step="1" unit="px"/></label><label className="text-field"><span>Altura (0 = automático)</span><NumberField label="Altura de exportação" value={exportHeight} onChange={setExportHeight} min="0" max={MAX_IMAGE_SIDE} step="1" unit="px"/></label><label className="text-field"><span>Formato</span><select className="select-control" value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="image/png">PNG · sem perda</option><option value="image/jpeg">JPEG · menor arquivo</option><option value="image/webp">WebP · moderno</option></select></label></div>{format !== "image/png" && <RangeControl label="Qualidade" value={quality} min={10} max={100} unit="%" onChange={setQuality}/>}<button type="button" className="primary-button photo-export-button" onClick={exportImage}><Download size={16}/> Exportar imagem</button>{notice && <p className="photo-export-notice" role="status">{notice}</p>}</section>
      </div>
      <div className="photo-editor-note">O processamento é local. Imagens muito grandes são reduzidas para até {MAX_IMAGE_SIDE}px no maior lado. Se o navegador não reconhecer HEIC/HEIF, converta o arquivo antes de abrir.</div>
    </>}
  </section>;
}
