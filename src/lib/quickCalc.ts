import { parseEngineeringNumber } from "../components/NumberField";

type Token = number | "+" | "-" | "*" | "/" | "(" | ")";

function tokenize(expression: string): Token[] | null {
  const tokens: Token[] = [];
  const matcher = /\s*(?:(\d+(?:[.,]\d*)?|[.,]\d+)([pnumkMGTµ]?\d*)(?:Ω|ohms?|V|A|F|Hz|W|s)?|([()+\-*/]))/gy;
  let cursor = 0;
  while (cursor < expression.length) {
    matcher.lastIndex = cursor;
    const match = matcher.exec(expression);
    if (!match) return null;
    cursor = matcher.lastIndex;
    if (match[1]) {
      const value = parseEngineeringNumber(`${match[1]}${match[2] ?? ""}`);
      if (value === null) return null;
      tokens.push(value);
    } else if (match[3]) tokens.push(match[3] as Token);
  }
  return tokens.length ? tokens : null;
}

function evaluateArithmetic(expression: string): number | null {
  const tokens = tokenize(expression.trim());
  if (!tokens) return null;
  let cursor = 0;
  const primary = (): number | null => {
    const token = tokens[cursor++];
    if (typeof token === "number") return token;
    if (token === "+" || token === "-") {
      const value = primary();
      return value === null ? null : token === "-" ? -value : value;
    }
    if (token === "(") {
      const value = sum();
      if (tokens[cursor++] !== ")") return null;
      return value;
    }
    return null;
  };
  const product = (): number | null => {
    let value = primary();
    while (value !== null && (tokens[cursor] === "*" || tokens[cursor] === "/")) {
      const operator = tokens[cursor++];
      const right = primary();
      if (right === null || (operator === "/" && right === 0)) return null;
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };
  const sum = (): number | null => {
    let value = product();
    while (value !== null && (tokens[cursor] === "+" || tokens[cursor] === "-")) {
      const operator = tokens[cursor++];
      const right = product();
      if (right === null) return null;
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };
  const result = sum();
  return cursor === tokens.length && result !== null && Number.isFinite(result) ? result : null;
}

export function calculateQuickExpression(expression: string): { value: number; unit: string } | null {
  const input = expression.trim();
  if (!input || input.length > 120) return null;
  const parallel = input.split("||");
  if (parallel.length === 2) {
    const first = evaluateArithmetic(parallel[0]!);
    const second = evaluateArithmetic(parallel[1]!);
    if (first === null || second === null || first <= 0 || second <= 0) return null;
    return { value: (first * second) / (first + second), unit: "Ω" };
  }
  if (parallel.length > 2) return null;
  const value = evaluateArithmetic(input);
  const unit = /V/i.test(input) && /\//.test(input) ? "A" : "";
  return value === null ? null : { value, unit };
}
