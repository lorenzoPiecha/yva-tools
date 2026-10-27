import { describe, expect, it } from "vitest";
import { calculateQuickExpression } from "./quickCalc";

describe("calculadora rápida da busca", () => {
  it("avalia operações com precedência e unidades SI", () => {
    expect(calculateQuickExpression("5V / 220")?.value).toBeCloseTo(5 / 220);
    expect(calculateQuickExpression("(2 + 3) * 4")?.value).toBe(20);
  });

  it("calcula resistência equivalente paralela com notação de engenharia", () => {
    const result = calculateQuickExpression("10k || 4k7");
    expect(result?.unit).toBe("Ω");
    expect(result?.value).toBeCloseTo((10_000 * 4_700) / 14_700);
  });

  it("recusa expressão inválida, divisão por zero e entradas grandes", () => {
    expect(calculateQuickExpression("5 / 0")).toBeNull();
    expect(calculateQuickExpression("alert(1)")).toBeNull();
    expect(calculateQuickExpression("9".repeat(130))).toBeNull();
  });
});
