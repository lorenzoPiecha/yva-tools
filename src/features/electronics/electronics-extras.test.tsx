import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BoardMapTool, buildRepairQuote, ComponentFinder, decodeSmdCode, identifyKnownPart, normalizePartCode } from './ElectronicsExtras';
import { convertImageBatch } from '../files/FilesTools';

afterEach(cleanup);

describe('novas ferramentas de eletrônica', () => {
  it('identifica códigos conhecidos de modo exato e mantém desconhecidos sem palpite', () => {
    expect(identifyKnownPart(' LM358 ' )?.name).toBe('LM358');
    expect(identifyKnownPart('lm-358n')?.name).toBe('LM358');
    expect(identifyKnownPart('amplificador operacional duplo')?.name).toBe('LM358');
    expect(identifyKnownPart('ABC123')).toBeNull();
    expect(normalizePartCode('A.B-C 1')).toBe('abc1');
  });

  it('decodifica códigos SMD comuns e rejeita formatos não suportados', () => {
    expect(decodeSmdCode('472', 'resistor')?.value).toBe(4700);
    expect(decodeSmdCode('4R7', 'resistor')?.value).toBe(4.7);
    expect(decodeSmdCode('104', 'capacitor')?.value).toBe(100000);
    expect(decodeSmdCode('R47', 'resistor')).toBeNull();
  });

  it('calcula orçamento com validação de custos e acréscimo', () => {
    expect(buildRepairQuote(100, 2, 50, 20, 10)).toEqual({ cost: 220, markupValue: 22, total: 242 });
    expect(buildRepairQuote(-1, 2, 50, 20, 10)).toBeNull();
    expect(buildRepairQuote(0, 0, 0, 0, 501)).toBeNull();
  });

  it('mostra datasheet oficial na correspondência e busca externa para código desconhecido', () => {
    render(<ComponentFinder />);
    fireEvent.change(screen.getByLabelText('Código, inscrição ou nome'), { target: { value: 'NE555' } });
    expect(screen.getByRole('link', { name: /Abrir datasheet/ }).getAttribute('href')).toContain('ti.com/lit/ds');
    fireEvent.change(screen.getByLabelText('Código, inscrição ou nome'), { target: { value: 'ZZ99' } });
    expect(screen.getByText(/Sem correspondência confirmada/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Buscar código/ }).getAttribute('href')).toContain('google.com/search');
  });

  it('mantém o mapa no navegador e permite preparar um marcador', () => {
    render(<BoardMapTool />);
    expect(screen.getByText(/apenas nesta sessão/)).toBeTruthy();
  });

  it('recusa lote inválido antes de tentar abrir imagens', async () => {
    await expect(convertImageBatch([new File(['x'], 'texto.txt', { type: 'text/plain' })], 'image/webp', 80)).rejects.toThrow(/1 a 20 imagens/);
  });
});
