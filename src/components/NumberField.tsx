import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, type PointerEvent } from "react";

const prefixScale: Record<string, number> = {
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  µ: 1e-6,
  μ: 1e-6,
  m: 1e-3,
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  "": 1,
};

export function parseEngineeringNumber(raw: string, unit = ""): number | null {
  const input = raw.trim().replace(/,/g, ".");
  if (!input) return null;
  const match = input.match(
    /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))([pnumkMGTµ]?)(\d*)$/,
  );
  if (!match) return null;
  const [, leading, prefix, trailing] = match;
  const mantissa = trailing ? `${leading}.${trailing}` : leading;
  const unitPrefix =
    unit.match(/^(p|n|u|µ|μ|m|k|M|G|T)(?=[A-Za-zΩ%])/u)?.[1] ?? "";
  const result =
    Number(mantissa) *
    (prefix ? prefixScale[prefix] / prefixScale[unitPrefix] : 1);
  return Number.isFinite(result) ? result : null;
}

type NumberFieldProps = {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  unit?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  className = "",
  id,
}: NumberFieldProps) {
  const repeatTimer = useRef<number | undefined>(undefined);
  const repeatStarted = useRef(0);
  const latest = useRef({ value, min, max, step, unit, onChange });
  latest.current = { value, min, max, step, unit, onChange };

  const adjust = useCallback((direction: -1 | 1, multiplier = 1) => {
    const current = latest.current;
    const parsed =
      typeof current.value === "number"
        ? current.value
        : parseEngineeringNumber(current.value, current.unit);
    const increment = current.step === "any" ? 1 : Number(current.step ?? 1);
    const minimum = current.min === undefined ? -Infinity : Number(current.min);
    const maximum = current.max === undefined ? Infinity : Number(current.max);
    const next = Math.min(
      maximum,
      Math.max(minimum, (parsed ?? 0) + direction * increment * multiplier),
    );
    const precision = Math.min(
      12,
      Math.max(0, (String(increment).split(".")[1] ?? "").length) + (String(multiplier).split(".")[1] ?? "").length,
    );
    current.onChange(String(Number(next.toFixed(precision))));
  }, []);

  const stopRepeat = useCallback(() => {
    if (repeatTimer.current !== undefined)
      window.clearInterval(repeatTimer.current);
    repeatTimer.current = undefined;
  }, []);

  useEffect(() => stopRepeat, [stopRepeat]);

  const startRepeat =
    (direction: -1 | 1) => (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled || event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      adjust(direction);
      repeatStarted.current = Date.now();
      repeatTimer.current = window.setInterval(() => {
        const heldSeconds = (Date.now() - repeatStarted.current) / 1000;
        adjust(
          direction,
          heldSeconds > 4
            ? 10
            : heldSeconds > 2
              ? 5
              : heldSeconds > 0.8
                ? 2
                : 1,
        );
      }, 130);
    };

  return (
    <div className={`number-field ${className}`}>
      <input
        id={id}
        aria-label={label}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        const parsed = parseEngineeringNumber(String(value), unit);
        if (parsed === null) return;
        const minimum = min === undefined ? -Infinity : Number(min);
        const maximum = max === undefined ? Infinity : Number(max);
        const bounded = Math.min(maximum, Math.max(minimum, parsed));
        if (bounded !== parsed) onChange(String(bounded));
      }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          const multiplier = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
          adjust(event.key === "ArrowUp" ? 1 : -1, multiplier);
        }}
      />
      {unit && (
        <span className="number-field-unit" aria-hidden="true">
          {unit}
        </span>
      )}
      <div className="number-field-controls">
        <button
          type="button"
          aria-label={label ? `Diminuir ${label}` : "Diminuir valor"}
          disabled={disabled}
          onPointerDown={startRepeat(-1)}
          onPointerUp={stopRepeat}
          onPointerCancel={stopRepeat}
          onLostPointerCapture={stopRepeat}
          onContextMenu={(event) => event.preventDefault()}
        >
          <Minus size={15} />
        </button>
        <button
          type="button"
          aria-label={label ? `Aumentar ${label}` : "Aumentar valor"}
          disabled={disabled}
          onPointerDown={startRepeat(1)}
          onPointerUp={stopRepeat}
          onPointerCancel={stopRepeat}
          onLostPointerCapture={stopRepeat}
          onContextMenu={(event) => event.preventDefault()}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
