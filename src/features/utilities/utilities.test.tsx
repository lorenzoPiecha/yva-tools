import { describe, expect, it } from 'vitest';
import { calculateBmi, calculateIpv4Subnet, calculatePercentage, calculateTransferSeconds, calculateVideoStorage, convertMeasurement, daysBetweenDates, generateBrazilianDocument, isValidBrazilianDocument, solveRuleOfThree, splitBill, summarizeNumbers } from './UtilitiesTools';

describe('Parte 7: calculadoras e utilidades', () => {
  it('valida CPF/CNPJ e gera números de teste com dígitos verificadores consistentes', () => {
    expect(isValidBrazilianDocument('529.982.247-25', 'CPF')).toBe(true);
    expect(isValidBrazilianDocument('11.222.333/0001-81', 'CNPJ')).toBe(true);
    expect(isValidBrazilianDocument('111.111.111-11', 'CPF')).toBe(false);
    const cpf = generateBrazilianDocument('CPF'); const cnpj = generateBrazilianDocument('CNPJ');
    expect(isValidBrazilianDocument(cpf, 'CPF')).toBe(true);
    expect(isValidBrazilianDocument(cnpj, 'CNPJ')).toBe(true);
  });
  it('calcula percentuais, desconto e acréscimo e rejeita entradas não finitas', () => {
    expect(calculatePercentage(200, 15)).toEqual({ amount: 30, increased: 230, discounted: 170 });
    expect(calculatePercentage(Infinity, 10)).toBeNull();
  });
  it('resolve regra de três e protege divisão por zero/overflow', () => {
    expect(solveRuleOfThree(2, 10, 5)).toBe(25);
    expect(solveRuleOfThree(0, 10, 2)).toBeNull();
    expect(solveRuleOfThree(1e-308, 1e308, 1e308)).toBeNull();
  });
  it('calcula IMC e rejeita peso ou altura inválidos', () => {
    expect(calculateBmi(70, 175)).toBeCloseTo(22.8571, 3);
    expect(calculateBmi(0, 175)).toBeNull();
  });
  it('converte unidades comuns e temperaturas entre escalas', () => {
    expect(convertMeasurement(1, 'comprimento', 'm', 'cm')).toBe(100);
    expect(convertMeasurement(1, 'massa', 'kg', 'g')).toBe(1000);
    expect(convertMeasurement(1, 'volume', 'l', 'ml')).toBe(1000);
    expect(convertMeasurement(32, 'temperatura', '°F', '°C')).toBeCloseTo(0);
    expect(convertMeasurement(Infinity, 'massa', 'kg', 'g')).toBeNull();
  });
  it('resume listas numéricas com média, mediana, amplitude e proteção contra overflow', () => {
    expect(summarizeNumbers([1, 5, 3])).toEqual({ mean: 3, median: 3, range: 4, count: 3 });
    expect(summarizeNumbers([1, 2, 3, 4])?.median).toBe(2.5);
    expect(summarizeNumbers([])).toBeNull();
  });
  it('divide conta com gorjeta e valida quantidade de pessoas', () => {
    expect(splitBill(120, 10, 3)).toEqual({ tip: 12, total: 132, each: 44 });
    expect(splitBill(10, 5, 1.5)).toBeNull();
  });
  it('calcula dias corridos em UTC e rejeita datas impossíveis', () => {
    expect(daysBetweenDates('2024-02-28', '2024-03-01')).toBe(2);
    expect(daysBetweenDates('2024-03-01', '2024-02-28')).toBe(2);
    expect(daysBetweenDates('2024-02-30', '2024-03-01')).toBeNull();
  });
  it('calcula sub-redes IPv4 e recusa octetos e prefixos inválidos', () => {
    expect(calculateIpv4Subnet('192.168.1.10', 24)).toMatchObject({ network: '192.168.1.0', mask: '255.255.255.0', broadcast: '192.168.1.255', firstHost: '192.168.1.1', lastHost: '192.168.1.254', usableHosts: 254 });
    expect(calculateIpv4Subnet('10.0.0.0', 31)?.usableHosts).toBe(2);
    expect(calculateIpv4Subnet('256.0.0.1', 24)).toBeNull();
    expect(calculateIpv4Subnet('10.0.0.1', 33)).toBeNull();
  });
  it('estima tempo de transferência e espaço de gravação com unidades explícitas', () => {
    expect(calculateTransferSeconds(100, 8)).toBe(100);
    expect(calculateTransferSeconds(10, 0)).toBeNull();
    expect(calculateVideoStorage(60, 8, 0)).toEqual({ mb: 60, gb: 0.06 });
    expect(calculateVideoStorage(0, 8, 192)).toBeNull();
  });
});
