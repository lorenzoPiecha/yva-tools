import { parseEngineeringNumber } from "../components/NumberField";

export type CodeTarget = "java-pojo" | "java-record" | "python-dataclass" | "python-pydantic" | "javascript";

function safeIdentifier(value: string) {
  const name = value.replace(/[^\p{L}\p{N}_$]/gu, "_").replace(/^[^\p{L}_$]+/u, "_") || "Generated";
  return /^[a-z]/.test(name) ? name[0]!.toUpperCase() + name.slice(1) : name;
}

export function generateJsonCode(input: string, target: CodeTarget, requestedName = "GeneratedModel"): string {
  const parsed: unknown = JSON.parse(input);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("A raiz do JSON precisa ser um objeto.");
  const name = safeIdentifier(requestedName);
  const fields = Object.entries(parsed as Record<string, unknown>);
  const javaType = (value: unknown) => value === null ? "Object" : typeof value === "string" ? "String" : typeof value === "boolean" ? "boolean" : typeof value === "number" ? Number.isInteger(value) ? "long" : "double" : Array.isArray(value) ? "List<Object>" : "Map<String, Object>";
  const pyType = (value: unknown) => value === null ? "Any" : typeof value === "string" ? "str" : typeof value === "boolean" ? "bool" : typeof value === "number" ? Number.isInteger(value) ? "int" : "float" : Array.isArray(value) ? "list[Any]" : "dict[str, Any]";
  const jsValue = JSON.stringify(parsed, null, 2);
  if (target === "java-pojo") return `import java.util.List;\nimport java.util.Map;\n\npublic class ${name} {\n${fields.map(([key, value]) => `  private ${javaType(value)} ${key};`).join("\n")}\n\n${fields.map(([key, value]) => `  public ${javaType(value)} get${safeIdentifier(key)}() { return ${key}; }\n  public void set${safeIdentifier(key)}(${javaType(value)} ${key}) { this.${key} = ${key}; }`).join("\n\n")}\n}`;
  if (target === "java-record") return `import java.util.List;\nimport java.util.Map;\n\npublic record ${name}(\n${fields.map(([key, value], index) => `  ${javaType(value)} ${key}${index < fields.length - 1 ? "," : ""}`).join("\n")}\n) {}`;
  if (target === "python-dataclass") return `from dataclasses import dataclass\nfrom typing import Any\n\n@dataclass\nclass ${name}:\n${fields.map(([key, value]) => `    ${key}: ${pyType(value)}`).join("\n") || "    pass"}`;
  if (target === "python-pydantic") return `from pydantic import BaseModel\nfrom typing import Any\n\nclass ${name}(BaseModel):\n${fields.map(([key, value]) => `    ${key}: ${pyType(value)}`).join("\n") || "    pass"}`;
  return `/** @typedef {Object} ${name}\n${fields.map(([key, value]) => ` * @property {${typeof value === "number" ? "number" : typeof value}} ${key}`).join("\n")}\n */\nconst ${name[0]!.toLowerCase()}${name.slice(1)} = ${jsValue};`;
}

function shellTokens(command: string): string[] {
  const tokens: string[] = []; let current = ""; let quote = ""; let escaped = false;
  for (const char of command.trim()) {
    if (escaped) { current += char; escaped = false; continue; }
    if (char === "\\" && quote !== "'") { escaped = true; continue; }
    if (quote) { if (char === quote) quote = ""; else current += char; continue; }
    if (char === "'" || char === '"') { quote = char; continue; }
    if (/\s/.test(char)) { if (current) tokens.push(current); current = ""; } else current += char;
  }
  if (escaped || quote) throw new Error("O comando cURL tem aspas ou escape sem fechamento.");
  if (current) tokens.push(current);
  return tokens;
}

export type CurlRequest = { method: string; url: string; headers: Record<string, string>; body?: string };
export function parseCurl(command: string): CurlRequest {
  const tokens = shellTokens(command);
  if (tokens.shift()?.toLowerCase() !== "curl") throw new Error("Comece o comando com curl.");
  const request: CurlRequest = { method: "GET", url: "", headers: {} };
  let explicitMethod = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token === "-X" || token === "--request") { request.method = tokens[++i]?.toUpperCase() ?? ""; explicitMethod = true; }
    else if (["-H", "--header"].includes(token)) { const header = tokens[++i] ?? ""; const separator = header.indexOf(":"); if (separator <= 0) throw new Error("Cabeçalho cURL inválido."); request.headers[header.slice(0, separator).trim()] = header.slice(separator + 1).trim(); }
    else if (["-d", "--data", "--data-raw", "--data-binary"].includes(token)) { request.body = tokens[++i] ?? ""; if (!explicitMethod) request.method = "POST"; }
    else if (token === "--url") request.url = tokens[++i] ?? "";
    else if (["-L", "--location", "--compressed", "-s", "--silent", "-S", "--show-error", "-i", "--include"].includes(token)) continue;
    else if (token.startsWith("-") && token !== "-") throw new Error(`Opção ainda não suportada: ${token}`);
    else if (!request.url) request.url = token;
  }
  if (!request.url || !/^https?:\/\//i.test(request.url)) throw new Error("Informe uma URL HTTP ou HTTPS completa.");
  if (!request.method) throw new Error("Método HTTP inválido.");
  return request;
}

export function convertCurl(command: string, target: "fetch" | "axios" | "python" | "java") {
  const request = parseCurl(command);
  const url = JSON.stringify(request.url); const headers = JSON.stringify(request.headers, null, 2); const body = request.body === undefined ? undefined : JSON.stringify(request.body);
  if (target === "fetch") return `const response = await fetch(${url}, {\n  method: ${JSON.stringify(request.method)},\n  headers: ${headers}${body === undefined ? "" : `,\n  body: ${body}`}\n});\nconst data = await response.text();`;
  if (target === "axios") return `const response = await axios({\n  url: ${url},\n  method: ${JSON.stringify(request.method)},\n  headers: ${headers}${body === undefined ? "" : `,\n  data: ${body}`}\n});`;
  if (target === "python") return `import requests\n\nresponse = requests.request(\n    ${JSON.stringify(request.method)}, ${JSON.stringify(request.url)},\n    headers=${JSON.stringify(request.headers)}${request.body === undefined ? "" : `,\n    data=${JSON.stringify(request.body)}`}\n)\nprint(response.text)`;
  return `import java.net.URI;\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\n\nvar client = HttpClient.newHttpClient();\nvar builder = HttpRequest.newBuilder(URI.create(${url}));\n${Object.entries(request.headers).map(([key, value]) => `builder.header(${JSON.stringify(key)}, ${JSON.stringify(value)});`).join("\n")}\nvar request = builder.method(${JSON.stringify(request.method)}, ${request.body === undefined ? "HttpRequest.BodyPublishers.noBody()" : `HttpRequest.BodyPublishers.ofString(${body})`}).build();\nvar response = client.send(request, HttpResponse.BodyHandlers.ofString());`;
}

export function convertCase(input: string) {
  const words = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").match(/[\p{L}\p{N}]+/gu)?.map((word) => word.toLocaleLowerCase("en-US")) ?? [];
  const cap = (word: string) => word ? word[0]!.toLocaleUpperCase("en-US") + word.slice(1) : "";
  return { camelCase: words.map((word, index) => index ? cap(word) : word).join(""), PascalCase: words.map(cap).join(""), snake_case: words.join("_"), "kebab-case": words.join("-"), CONSTANT_CASE: words.join("_").toLocaleUpperCase("en-US"), slug: words.join("-") };
}

function htmlEscape(input: string) { return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function htmlUnescape(input: string) { const textarea = document.createElement("textarea"); textarea.innerHTML = input; return textarea.value; }
export function transformString(input: string, language: "javascript" | "java" | "python" | "json" | "html" | "regex", mode: "escape" | "unescape") {
  if (language === "html") return mode === "escape" ? htmlEscape(input) : htmlUnescape(input);
  if (language === "regex") return mode === "escape" ? input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : input.replace(/\\([.*+?^${}()|[\]\\])/g, "$1");
  if (mode === "escape") {
    if (language === "python") return `"${input.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`;
    return JSON.stringify(input);
  }
  try { return JSON.parse(input.startsWith('"') ? input : `"${input}"`) as string; }
  catch { return input.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t").replace(/\\\\/g, "\\").replace(/\\"/g, '"').replace(/\\'/g, "'"); }
}

export function dateFormatSamples(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  const yyyy = String(date.getFullYear()); const MM = pad(date.getMonth() + 1); const dd = pad(date.getDate()); const HH = pad(date.getHours()); const mm = pad(date.getMinutes()); const ss = pad(date.getSeconds());
  return { preview: `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`, java: "yyyy-MM-dd HH:mm:ss", python: "%Y-%m-%d %H:%M:%S", javascript: `new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(date)`, pythonStrftime: "date.strftime('%Y-%m-%d %H:%M:%S')" };
}

function yamlScalar(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return /^[\w./-]+$/u.test(value) && !/^(true|false|null|~|[-+]?\d+(?:\.\d+)?)$/iu.test(value) ? value : JSON.stringify(value);
  return String(value);
}
export function jsonToYaml(value: unknown, depth = 0): string {
  const pad = "  ".repeat(depth);
  if (Array.isArray(value)) return value.length ? value.map((item) => item && typeof item === "object" ? `${pad}-\n${jsonToYaml(item, depth + 1)}` : `${pad}- ${yamlScalar(item)}`).join("\n") : `${pad}[]`;
  if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => item && typeof item === "object" ? `${pad}${yamlScalar(key)}:\n${jsonToYaml(item, depth + 1)}` : `${pad}${yamlScalar(key)}: ${yamlScalar(item)}`).join("\n") || `${pad}{}`;
  return `${pad}${yamlScalar(value)}`;
}
function yamlValue(value: string): unknown {
  const text = value.trim();
  if (!text) return "";
  if (text === "null" || text === "~") return null;
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(text)) return Number(text);
  if (text.startsWith('"') && text.endsWith('"')) { try { return JSON.parse(text); } catch { throw new Error("Texto YAML entre aspas inválido."); } }
  if (text.startsWith("[") || text.startsWith("{")) { try { return JSON.parse(text); } catch { throw new Error("Coleções inline devem usar sintaxe JSON válida."); } }
  return text;
}
export function yamlToJson(source: string): unknown {
  const lines = source.split(/\r?\n/).map((raw) => ({ indent: raw.match(/^ */)![0].length, text: raw.trim() })).filter(({ text }) => text && !text.startsWith("#"));
  if (!lines.length) return {};
  const parseBlock = (start: number, indent: number): [unknown, number] => {
    const isArray = lines[start]?.text.startsWith("- ") || lines[start]?.text === "-";
    const out: unknown[] | Record<string, unknown> = isArray ? [] : {};
    let i = start;
    while (i < lines.length && lines[i]!.indent === indent) {
      const { text } = lines[i]!;
      if (isArray) {
        if (!text.startsWith("-")) throw new Error("Mistura de lista e objeto no mesmo nível YAML.");
        const content = text.replace(/^-\s?/, "");
        if (!content) {
          if (lines[i + 1] && lines[i + 1]!.indent > indent) { const [nested, next] = parseBlock(i + 1, lines[i + 1]!.indent); (out as unknown[]).push(nested); i = next; }
          else { (out as unknown[]).push(null); i++; }
        } else { (out as unknown[]).push(yamlValue(content)); i++; }
      } else {
        const separator = text.indexOf(":");
        if (separator < 1) throw new Error(`Linha YAML inválida: ${text}`);
        const keyValue = yamlValue(text.slice(0, separator));
        if (typeof keyValue !== "string") throw new Error("Chaves YAML devem ser texto.");
        const valueText = text.slice(separator + 1).trim();
        if (valueText) { (out as Record<string, unknown>)[keyValue] = yamlValue(valueText); i++; }
        else if (lines[i + 1] && lines[i + 1]!.indent > indent) { const [nested, next] = parseBlock(i + 1, lines[i + 1]!.indent); (out as Record<string, unknown>)[keyValue] = nested; i = next; }
        else { (out as Record<string, unknown>)[keyValue] = null; i++; }
      }
    }
    return [out, i];
  };
  const [result, cursor] = parseBlock(0, lines[0]!.indent);
  if (cursor !== lines.length) throw new Error("A indentação YAML está inconsistente.");
  return result;
}

export function formatSql(source: string) {
  return source.trim().replace(/\s+/g, " ").replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ON|VALUES|SET|RETURNING|UNION)\b/gi, "\n$1").replace(/,\s*/g, ",\n  ").replace(/\s+AND\s+/gi, "\n  AND ").replace(/\s+OR\s+/gi, "\n  OR ").trim();
}

const cronFields: Array<[number, number]> = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
function cronFieldMatches(field: string, value: number, min: number, max: number) {
  if (field === "*") return true;
  return field.split(",").some((part) => {
    const stepParts = part.split("/"); const step = stepParts[1] ? Number(stepParts[1]) : 1; const range = stepParts[0]!;
    if (!Number.isInteger(step) || step < 1) return false;
    if (range === "*") return (value - min) % step === 0;
    const bounds = range.split("-").map(Number); const start = bounds.length === 1 ? bounds[0]! : bounds[0]!; const end = bounds.length === 1 ? start : bounds[1]!;
    return start >= min && end <= max && value >= start && value <= end && (value - start) % step === 0;
  });
}
export function cronNextRuns(expression: string, after = new Date(), limit = 5) {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error("Use cinco campos cron: minuto hora dia mês dia-da-semana.");
  const runs: Date[] = []; const cursor = new Date(after); cursor.setSeconds(0, 0); cursor.setMinutes(cursor.getMinutes() + 1);
  const end = cursor.getTime() + 366 * 24 * 60 * 60 * 1000;
  while (cursor.getTime() < end && runs.length < limit) {
    const values = [cursor.getMinutes(), cursor.getHours(), cursor.getDate(), cursor.getMonth() + 1, cursor.getDay()];
    if (fields.every((field, index) => cronFieldMatches(field, values[index]!, ...cronFields[index]!))) runs.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return runs;
}
export function explainCron(expression: string) {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error("Uma expressão cron válida tem cinco campos.");
  const labels = ["minuto", "hora", "dia do mês", "mês", "dia da semana"];
  return fields.map((field, index) => `${labels[index]}: ${field === "*" ? "a cada valor" : field.startsWith("*/") ? `a cada ${field.slice(2)} unidade(s)` : `no(s) valor(es) ${field}`}`).join("; ");
}

export function generateGitignore(kind: string) {
  const blocks: Record<string, string> = {
    node: "node_modules/\ndist/\n.env\n.env.*\n!.env.example\n",
    java: "target/\n*.class\n.idea/\n*.iml\n.env\n",
    python: "__pycache__/\n*.py[cod]\n.venv/\nvenv/\n.env\n",
    "python-data": ".ipynb_checkpoints/\n.venv/\n__pycache__/\n*.parquet\n*.csv\n",
  };
  return blocks[kind] ?? blocks.node!;
}
export function codeTemplate(kind: string) {
  const templates: Record<string, string> = {
    "package.json": `{"name":"my-app","version":"1.0.0","private":true,"scripts":{"dev":"vite","build":"vite build"}}`,
    "pom.xml": `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="http://maven.apache.org/POM/4.0.0">\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.example</groupId><artifactId>app</artifactId><version>1.0.0</version>\n</project>`,
    "requirements.txt": "requests>=2.32\npython-dotenv>=1.0\n",
    Dockerfile: "FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nCMD [\"npm\", \"run\", \"dev\", \"--\", \"--host\", \"0.0.0.0\"]\n",
  };
  return templates[kind] ?? "";
}
export const cheatSheets: Record<string, string> = {
  Java: "Tipos: int, long, double, boolean, String\nColeção: List<T>, Map<K,V>, Set<T>\nControle: if / switch / for / while\nExceções: try { } catch (Exception e) { }\nData/hora: LocalDate, LocalDateTime, DateTimeFormatter",
  JavaScript: "Constantes: const; variável reatribuível: let\nArray: map, filter, reduce\nAssíncrono: async/await, Promise\nMódulos: export / import\nJSON: JSON.parse / JSON.stringify",
  Python: "Coleções: list, tuple, dict, set\nCompreensão: [f(x) for x in values]\nFunção: def nome(arg):\nContexto: with open(...) as file:\nExceções: try / except / finally",
  Git: "git status\ngit add .\ngit commit -m 'mensagem'\ngit log --oneline --graph\ngit switch -c nome\ngit restore arquivo",
  Linux: "pwd · ls -la · cd pasta\ncp origem destino · mv origem destino\ngrep -R 'texto' . · find . -name '*.txt'\nchmod +x arquivo · ps aux\nUse man comando para o manual local.",
};

export function calculateChecksums(input: string, encoding: "text" | "hex" = "text") {
  const clean = input.replace(/[\s:-]/g, "");
  if (encoding === "hex" && (!/^(?:[0-9a-f]{2})*$/i.test(clean))) throw new Error("Hexadecimal precisa conter pares de dígitos.");
  const bytes = encoding === "hex" ? Uint8Array.from(clean.match(/.{2}/g) ?? [], (pair) => parseInt(pair, 16)) : new TextEncoder().encode(input);
  let sum = 0; let crc8 = 0; let crc16 = 0xffff; let crc32 = 0xffffffff;
  for (const byte of bytes) {
    sum = (sum + byte) & 0xff;
    crc8 ^= byte;
    for (let bit = 0; bit < 8; bit++) crc8 = ((crc8 & 0x80) ? ((crc8 << 1) ^ 0x07) : (crc8 << 1)) & 0xff;
    crc16 ^= byte;
    for (let bit = 0; bit < 8; bit++) crc16 = (crc16 & 1) ? ((crc16 >>> 1) ^ 0xa001) : crc16 >>> 1;
    crc32 ^= byte;
    for (let bit = 0; bit < 8; bit++) crc32 = (crc32 & 1) ? ((crc32 >>> 1) ^ 0xedb88320) : crc32 >>> 1;
  }
  return { sum8: sum.toString(16).padStart(2, "0").toUpperCase(), crc8: crc8.toString(16).padStart(2, "0").toUpperCase(), crc16Modbus: crc16.toString(16).padStart(4, "0").toUpperCase(), crc32: ((crc32 ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0").toUpperCase(), bytes: bytes.length };
}

export function inspectFloat32(value: number) {
  if (!Number.isFinite(value)) throw new Error("Informe um valor decimal finito.");
  const buffer = new ArrayBuffer(4); const view = new DataView(buffer); view.setFloat32(0, value, false);
  const bits = view.getUint32(0, false).toString(2).padStart(32, "0");
  return { rounded: view.getFloat32(0, false), hex: view.getUint32(0, false).toString(16).padStart(8, "0").toUpperCase(), bits, sign: bits[0], exponent: bits.slice(1, 9), mantissa: bits.slice(9) };
}

export function calculateUartTime(bytes: number, baud: number, dataBits: number, parity: boolean, stopBits: number) {
  if (![bytes, baud, dataBits, stopBits].every(Number.isFinite) || !Number.isInteger(bytes) || bytes < 0 || bytes > 1_000_000 || baud <= 0 || ![7, 8, 9].includes(dataBits) || ![1, 2].includes(stopBits)) return null;
  const bitsPerCharacter = 1 + dataBits + (parity ? 1 : 0) + stopBits;
  const totalBits = bytes * bitsPerCharacter;
  return { bitsPerCharacter, totalBits, seconds: totalBits / baud };
}

export function parseEngineeringSnippetValue(value: string) { return parseEngineeringNumber(value); }
