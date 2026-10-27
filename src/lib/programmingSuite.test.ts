import { describe, expect, it } from "vitest";
import {
  calculateChecksums, calculateUartTime, convertCase, convertCurl, cronNextRuns,
  dateFormatSamples, generateJsonCode, inspectFloat32, jsonToYaml, parseCurl,
  transformString, yamlToJson,
} from "./programmingSuite";

describe("ferramentas de programação", () => {
  it("gera código a partir de objetos JSON e recusa raízes incompatíveis", () => {
    expect(generateJsonCode('{"name":"Ana","age":20}', "java-record", "User")).toContain("public record User");
    expect(generateJsonCode('{"active":true}', "python-dataclass", "User")).toContain("active: bool");
    expect(() => generateJsonCode("[]", "javascript")).toThrow(/raiz/);
  });

  it("converte cURL comum para fetch e faz fail early em opções não suportadas", () => {
    const command = `curl -X POST https://example.test/api -H 'Content-Type: application/json' -d '{"ok":true}'`;
    expect(parseCurl(command)).toMatchObject({ method: "POST", url: "https://example.test/api", body: '{"ok":true}' });
    expect(convertCurl(command, "fetch")).toContain("await fetch");
    expect(() => parseCurl("curl --cert secret.pem https://example.test")).toThrow(/não suportada/);
  });

  it("normaliza case, escapa strings e gera os modelos de data", () => {
    expect(convertCase("Título do componente").slug).toBe("titulo-do-componente");
    expect(transformString("a\nb", "json", "escape")).toBe('"a\\nb"');
    expect(transformString("&lt;b&gt;", "html", "unescape")).toBe("<b>");
    expect(dateFormatSamples(new Date(2025, 0, 2, 3, 4, 5)).preview).toBe("2025-01-02 03:04:05");
  });

  it("faz round-trip JSON e YAML no subconjunto suportado", () => {
    const value = { name: "YVA Tools", enabled: true, items: [1, "a", { nested: null }] };
    expect(yamlToJson(jsonToYaml(value))).toEqual(value);
  });

  it("calcula checksums conhecidos, float32 e tempo UART", () => {
    expect(calculateChecksums("123456789")).toMatchObject({ sum8: "DD", crc8: "F4", crc16Modbus: "4B37", crc32: "CBF43926" });
    expect(inspectFloat32(1.5)).toMatchObject({ hex: "3FC00000", sign: "0", exponent: "01111111" });
    expect(calculateUartTime(1, 9600, 8, false, 1)?.seconds).toBeCloseTo(10 / 9600);
  });

  it("explica cron e calcula próximas execuções no calendário", () => {
    const now = new Date(2025, 0, 1, 10, 0, 0);
    expect(cronNextRuns("*/15 * * * *", now, 2).map((date) => date.getMinutes())).toEqual([15, 30]);
  });
});
