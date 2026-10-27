import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../../app/App';
import { csvToJson, createZip, extractZip, formatBytes, imagesToPdf, jsonToCsv, optimizePdfStructure, repackageExtracted, safeArchiveName } from './FilesTools';
import { zipSync } from 'fflate';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('Parte 5: arquivos e navegação', () => {
  it('valida o lote de imagens antes de iniciar a conversão para PDF', async () => {
    const textFile = new File(['texto'], 'nota.txt', { type: 'text/plain' });
    await expect(imagesToPdf([textFile])).rejects.toThrow(/1 a 30 imagens/);
    await expect(imagesToPdf([])).rejects.toThrow(/1 a 30 imagens/);
  });

  it('recusa arquivos que não são PDFs no otimizador estrutural', async () => {
    await expect(optimizePdfStructure(new File(['texto'], 'nota.txt', { type: 'text/plain' }))).rejects.toThrow(/não parece ser um PDF/);
  });

  it('expõe a nova ferramenta de imagem para PDF pela navegação', async () => {
    render(<MemoryRouter initialEntries={['/ferramentas/imagens-para-pdf']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { level: 2, name: 'Converter imagens para PDF' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Converter e baixar PDF' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('converte CSV com campos entre aspas e não cria linha extra no fim', () => {
    expect(csvToJson('nome,observação\r\nAna,"usa, vírgulas"\r\n')).toEqual([{ nome: 'Ana', observação: 'usa, vírgulas' }]);
  });

  it('gera CSV escapando aspas, vírgulas e quebras de linha', () => {
    const csv = jsonToCsv([{ nome: 'Ana, Silva', nota: '"olá"\nlinha 2' }]);
    expect(csv).toContain('"Ana, Silva"');
    expect(csv).toContain('""olá""');
    expect(csvToJson(csv)).toEqual([{ nome: 'Ana, Silva', nota: '"olá"\nlinha 2' }]);
  });

  it('aplica limites básicos e recusa caminhos ZIP perigosos', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(safeArchiveName('pasta/arquivo.txt')).toBe(true);
    expect(safeArchiveName('../fora.txt')).toBe(false);
    expect(safeArchiveName('C:\\Windows\\arquivo.txt')).toBe(false);
    expect(safeArchiveName('/absoluto.txt')).toBe(false);
  });

  it('cria e extrai um ZIP e rejeita caminhos que escapam da pasta', async () => {
    const file = { name: 'nota.txt', size: 4, webkitRelativePath: '', arrayBuffer: async () => new TextEncoder().encode('teste').buffer } as File;
    const archive = await createZip([file]);
    const extracted = extractZip(archive);
    expect(extracted[0].name).toBe('nota.txt');
    expect(new TextDecoder().decode(extracted[0].data)).toBe('teste');
    const unsafe = zipSync({ '../fora.txt': new TextEncoder().encode('não') });
    expect(() => extractZip(unsafe)).toThrow(/caminho inválido/);
  });

  it('reempacota os arquivos ZIP mantendo a estrutura de pastas', () => {
    const original = zipSync({ 'imagens/icone.txt': new TextEncoder().encode('ok') });
    const restored = repackageExtracted(extractZip(original));
    expect(extractZip(restored).map((entry) => entry.name)).toEqual(['imagens/icone.txt']);
  });

  it('leva a volta de uma ferramenta para a categoria e depois à página inicial', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/ferramentas/lei-de-ohm']}><App /></MemoryRouter>);
    await user.click(screen.getByRole('link', { name: /Voltar a Eletrônica/ }));
    expect(screen.getByRole('heading', { name: 'Eletrônica' })).toBeTruthy();
    await user.click(screen.getByRole('link', { name: /Voltar ao início/ }));
    expect(screen.getByRole('heading', { name: /Em um só lugar/ })).toBeTruthy();
  });
});
