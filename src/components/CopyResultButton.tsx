import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyResultButton({ value, className = "" }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
      setFailed(true);
      window.setTimeout(() => setFailed(false), 2200);
    }
  };

  return <span className="copy-result-wrap"><button type="button" className={`web-copy ${className}`} onClick={() => void copy()} disabled={!value.trim()}><span aria-hidden="true">{copied ? <Check size={14}/> : <Copy size={14}/>}</span>{copied ? "Copiado" : "Copiar resultado"}</button>{failed && <span className="copy-result-error" role="status">Não foi possível copiar. Verifique a permissão do navegador.</span>}</span>;
}
