import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../../app/App';
import { buildDatasheetSearch, buildSchematicSearch, calculateConsumption, calculateLedResistor, calculateResistorBands, equivalentCapacitance, equivalentResistance, formatEngineeringResult, solveOhm } from './ElectronicsTools';
import { calculate555, calculateLm317, calculateRcCutoff, calculateSiPrefix } from './ElectronicsRequested';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('Parte 4: cálculos de eletrônica', () => {
  it('calcula frequência RC, modos astável/monoestável do 555, LM317 e prefixos SI', () => {
    expect(calculateRcCutoff(10_000, 0.1)).toBeCloseTo(159.1549, 3);
    expect(calculateRcCutoff(0, 1)).toBeNull();
    const astable = calculate555('astable', 10_000, 47_000, 10);
    const mono = calculate555('monostable', 100_000, 0, 10);
    expect(astable?.mode).toBe('astable');
    if (astable?.mode === 'astable') expect(astable.frequencyHz).toBeGreaterThan(0);
    expect(mono?.mode).toBe('monostable');
    if (mono?.mode === 'monostable') expect(mono.durationSeconds).toBeCloseTo(1.1);
    expect(calculate555('astable', 10_000, 0, 10)).toBeNull();
    expect(calculateLm317(1.25, 240, 720)).toBeCloseTo(5);
    expect(calculateSiPrefix(1, 'k', '')).toBe(1000);
    expect(calculateSiPrefix(1000, 'µ', 'm')).toBe(1);
  });
  it('resolve Lei de Ohm usando pares diferentes e recusa valores não positivos', () => {
    expect(solveOhm([12, 0.02, null, null])).toMatchObject({ resistance: 600, power: 0.24 });
    const solved = solveOhm([null, 0.02, 600, null]);
    expect(solved?.voltage).toBeCloseTo(12);
    expect(solved?.power).toBeCloseTo(0.24);
    expect(solveOhm([12, null, null, null])).toBeNull();
    expect(solveOhm([0, 0.02, null, null])).toBeNull();
  });

  it('calcula resistência equivalente em série e paralelo', () => {
    expect(equivalentResistance([100, 200, 300], 'series')).toBe(600);
    expect(equivalentResistance([100, 100], 'parallel')).toBe(50);
    expect(equivalentResistance([100], 'series')).toBeNull();
    expect(equivalentResistance([100, 0], 'parallel')).toBeNull();
  });

  it('decodifica faixas de resistores de 4/5/6 bandas e rejeita primeira faixa impossível', () => {
    expect(calculateResistorBands(['Amarelo', 'Violeta', 'Vermelho', 'Ouro'])).toEqual({ resistance: 4700, tolerance: 5, ppm: undefined });
    expect(calculateResistorBands(['Marrom', 'Preto', 'Preto', 'Vermelho', 'Marrom'])).toEqual({ resistance: 10000, tolerance: 1, ppm: undefined });
    expect(calculateResistorBands(['Marrom', 'Preto', 'Preto', 'Vermelho', 'Marrom', 'Azul'])?.ppm).toBe(10);
    expect(calculateResistorBands(['Preto', 'Preto', 'Preto', 'Ouro'])).toBeNull();
  });

  it('calcula capacitância equivalente em paralelo e série', () => {
    expect(equivalentCapacitance([10, 22], 'parallel')).toBe(32);
    expect(equivalentCapacitance([10, 10], 'series')).toBe(5);
    expect(equivalentCapacitance([1], 'series')).toBeNull();
  });

  it('calcula resistor de LED e estima consumo/custo', () => {
    expect(calculateLedResistor(5, 2, 20)).toMatchObject({ resistance: 150, standard: 150, power: 0.06 });
    expect(calculateLedResistor(2, 5, 20)).toBeNull();
    expect(calculateConsumption(100, 8, 30, 0.9)).toMatchObject({ kwh: 24, cost: 21.6 });
    expect(calculateConsumption(100, 25, 30, 0.9)).toBeNull();
  });

  it('exibe resultados elétricos com prefixos de engenharia legíveis', () => {
    expect(formatEngineeringResult(4700, 'Ω')).toBe('4,7 kΩ');
    expect(formatEngineeringResult(0.02, 'A')).toBe('20 mA');
    expect(formatEngineeringResult(0.24, 'W')).toBe('240 mW');
  });

  it('aceita notação de engenharia nas entradas da Lei de Ohm', () => {
    render(<MemoryRouter initialEntries={['/ferramentas/lei-de-ohm']}><App /></MemoryRouter>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Tensão' }), { target: { value: '12' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Corrente' }), { target: { value: '2m' } });
    expect(screen.getByText('6 kΩ')).toBeTruthy();
  });

  it('expõe cada ferramenta no catálogo e mostra resultados na interface', () => {
    render(<MemoryRouter initialEntries={['/ferramentas/lei-de-ohm']}><App /></MemoryRouter>);
    expect(screen.getByText('600 Ω')).toBeTruthy();
    cleanup();
    render(<MemoryRouter initialEntries={['/ferramentas/resistores']}><App /></MemoryRouter>);
    expect(screen.getByText('550 Ω')).toBeTruthy();
  });

  it('permite adicionar resistor e valida entradas de consumo', () => {
    render(<MemoryRouter initialEntries={['/ferramentas/resistores']}><App /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar resistor' }));
    expect(screen.getByLabelText('Resistor 4')).toBeTruthy();
    cleanup();
    render(<MemoryRouter initialEntries={['/ferramentas/potencia-consumo']}><App /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Uso por dia'), { target: { value: '25' } });
    expect(screen.getByRole('alert').textContent).toContain('entre 0 e 24');
  });

  it('monta buscas seguras e expõe pesquisador de CIs e esquemas', () => {
    expect(buildDatasheetSearch('UC3842', 'ti.com')).toContain(encodeURIComponent('UC3842 datasheet pinout site:ti.com'));
    const schematicUrl = new URL(buildSchematicSearch({ manufacturer: 'Samsung', model: 'TV X', board: 'BN44-001', chip: '' }));
    expect(schematicUrl.searchParams.get('q')).toContain('Samsung TV X BN44-001');
    expect(buildDatasheetSearch(' ')).toBe('');
    cleanup();
    render(<MemoryRouter initialEntries={['/ferramentas/pesquisador-cis']}><App /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Código do CI'), { target: { value: 'UC3842' } });
    expect(screen.getByRole('link', { name: /Texas Instruments/ }).getAttribute('href')).toContain('site%3Ati.com');
    cleanup();
    render(<MemoryRouter initialEntries={['/ferramentas/buscador-esquemas']}><App /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 2, name: 'Buscador de esquemas e manuais' })).toBeTruthy();
  });

  it('registra uma ficha de bancada no armazenamento local', () => {
    render(<MemoryRouter initialEntries={['/ferramentas/registro-bancada']}><App /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Equipamento e modelo *'), { target: { value: 'Monitor exemplo' } });
    fireEvent.change(screen.getByLabelText('Sintoma informado *'), { target: { value: 'Não liga' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar registro' }));
    expect(screen.getByText('Monitor exemplo')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('yva-tools:bench-records') ?? '[]')).toHaveLength(1);
  });
});
