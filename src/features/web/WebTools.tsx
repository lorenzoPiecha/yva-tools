import { useEffect, useState } from "react";
import { Dice5 } from "lucide-react";
import { CopyResultButton } from '../../components/CopyResultButton';

type WebToolSlug = "paleta-cores" | "gradientes" | "sombras-css";
const randomHex = () =>
  `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`;
const initialColors = ["#5EE7F7", "#4788F5", "#8567F5", "#E274C4", "#F2A65A"];

export default function WebTool({ slug }: { slug: WebToolSlug }) {
  if (slug === "paleta-cores") return <PaletteTool />;
  if (slug === "gradientes") return <GradientTool />;
  return <ShadowTool />;
}

function CopyButton({ value }: { value: string; label?: string }) { return <CopyResultButton value={value}/>; }

function WebPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="web-tool-panel">
      <div className="web-panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PaletteTool() {
  const [colors, setColors] = useState(initialColors);
  const [locked, setLocked] = useState<number[]>([]);
  const generate = () =>
    setColors((previous) =>
      previous.map((color, index) =>
        locked.includes(index) ? color : randomHex(),
      ),
    );
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        event.repeat ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLButtonElement
      )
        return;
      event.preventDefault();
      generate();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [locked]);
  const lock = (index: number) =>
    setLocked((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index],
    );
  return (
    <WebPanel
      title="Sua paleta"
      description="Gere uma combinação nova ou ajuste cada cor. Clique no código para copiar."
    >
      <div className="palette-toolbar">
        <span>
          {colors.length} CORES · {locked.length} FIXADAS
        </span>
        <button className="web-copy" onClick={generate}>
          <Dice5 size={14} /> Gerar paleta
        </button>
      </div>
      <div className="palette-strip">
        {colors.map((color, index) => (
          <div
            className="palette-swatch"
            key={index}
            style={{ backgroundColor: color }}
          >
            <CopyResultButton value={color} className="swatch-hex" />
            <button
              className={`swatch-lock ${locked.includes(index) ? "locked" : ""}`}
              onClick={() => lock(index)}
              aria-label={
                locked.includes(index) ? "Desafixar cor" : "Fixar cor"
              }
            >
              {locked.includes(index) ? "FIXA" : "FIXAR"}
            </button>
            <input
              aria-label={`Escolher cor ${index + 1}`}
              type="color"
              value={color}
              onChange={(event) =>
                setColors((prev) =>
                  prev.map((item, i) =>
                    i === index ? event.target.value.toUpperCase() : item,
                  ),
                )
              }
            />
          </div>
        ))}
      </div>
      <div className="web-hint">
        <span>ESPAÇO</span> também gera uma nova paleta · fixe as cores que
        deseja manter
      </div>
    </WebPanel>
  );
}

function GradientTool() {
  const [first, setFirst] = useState("#19C5D8");
  const [second, setSecond] = useState("#6B72F5");
  const [angle, setAngle] = useState(135);
  const css = `background: linear-gradient(${angle}deg, ${first}, ${second});`;
  return (
    <WebPanel
      title="Construtor de gradiente"
      description="Escolha duas cores e o ângulo. O resultado e o CSS atualizam em tempo real."
    >
      <div
        className="gradient-preview"
        style={{
          background: `linear-gradient(${angle}deg, ${first}, ${second})`,
        }}
      />
      <div className="web-controls">
        <ColorControl label="Cor inicial" value={first} onChange={setFirst} />
        <ColorControl label="Cor final" value={second} onChange={setSecond} />
        <label className="range-control">
          <span>
            Ângulo <strong>{angle}°</strong>
          </span>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(event) => setAngle(Number(event.target.value))}
          />
        </label>
      </div>
      <CodeOutput value={css} />
    </WebPanel>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="color-control">
      <span>{label}</span>
      <div>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <code>{value}</code>
      </div>
    </label>
  );
}

function ShadowTool() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(16);
  const [blur, setBlur] = useState(32);
  const [spread, setSpread] = useState(0);
  const [opacity, setOpacity] = useState(22);
  const [inset, setInset] = useState(false);
  const [color, setColor] = useState("#5EE7F7");
  const rgb = color.match(/[0-9a-f]{2}/gi)?.map((part) => Number.parseInt(part, 16)) ?? [94, 231, 247];
  const css = `box-shadow: ${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Number(opacity / 100).toFixed(2)});`;
  const controls = [
    { label: "Deslocamento X", value: x, setter: setX, min: -40, max: 40 },
    { label: "Deslocamento Y", value: y, setter: setY, min: -40, max: 60 },
    { label: "Desfoque", value: blur, setter: setBlur, min: 0, max: 80 },
    {
      label: "Espalhamento",
      value: spread,
      setter: setSpread,
      min: -20,
      max: 30,
    },
    {
      label: "Opacidade",
      value: opacity,
      setter: setOpacity,
      min: 0,
      max: 100,
    },
  ];
  return (
    <WebPanel
      title="Construtor de sombras"
      description="Ajuste os controles e visualize a sombra no cartão."
    >
      <div className="shadow-stage">
        <div
          className="shadow-sample"
          style={{ boxShadow: css.slice("box-shadow: ".length, -1) }}
        >
          <span>YVA</span>
          <small>PREVIEW</small>
        </div>
      </div>
      <div className="shadow-controls">
        <ColorControl label="Cor da sombra" value={color} onChange={setColor} />
        {controls.map(({ label, value, setter, min, max }) => (
          <label className="range-control" key={label}>
            <span>
              {label}
              <strong>
                {value}
                {label === "Opacidade" ? "%" : "px"}
              </strong>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={(event) => setter(Number(event.target.value))}
            />
          </label>
        ))}
      </div>
      <div className="shadow-bottom">
        <label className="inset-toggle">
          <input
            type="checkbox"
            checked={inset}
            onChange={(event) => setInset(event.target.checked)}
          />{" "}
          Sombra interna
        </label>
        <CodeOutput value={css} />
      </div>
    </WebPanel>
  );
}

function CodeOutput({ value }: { value: string }) {
  return (
    <div className="code-output">
      <code>{value}</code>
      <CopyButton value={value} />
    </div>
  );
}
