import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NumberField, parseEngineeringNumber } from "./NumberField";
import { CopyResultButton } from "./CopyResultButton";

describe("NumberField", () => {
  it("interpreta notação de engenharia e vírgula decimal na unidade exibida", () => {
    expect(parseEngineeringNumber("4k7", "Ω")).toBe(4700);
    expect(parseEngineeringNumber("10u", "µF")).toBe(10);
    expect(parseEngineeringNumber("2,2M", "Ω")).toBe(2_200_000);
    expect(parseEngineeringNumber("100u", "mA")).toBeCloseTo(0.1);
    expect(parseEngineeringNumber("inválido", "V")).toBeNull();
  });

  it("usa setas, Shift e Alt para ajustar o valor", () => {
    const onChange = vi.fn();
    render(<NumberField label="Resistência" value="10" onChange={onChange} step="0.5"/>);
    const input = screen.getByRole("textbox", { name: "Resistência" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowUp", shiftKey: true });
    fireEvent.keyDown(input, { key: "ArrowDown", altKey: true });
    expect(onChange.mock.calls.map(([value]) => value)).toEqual(["10.5", "15", "9.95"]);
  });

  it("expõe controles grandes e acessíveis para toque", () => {
    render(<NumberField label="Tensão" value="5" onChange={() => undefined} min="0" max="12"/>);
    expect(screen.getByRole("button", { name: "Diminuir Tensão" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aumentar Tensão" })).toBeTruthy();
  });

  it("usa o rótulo padronizado de cópia", () => {
    render(<CopyResultButton value="resultado"/>);
    expect(screen.getByRole("button", { name: "Copiar resultado" })).toBeTruthy();
  });
});
