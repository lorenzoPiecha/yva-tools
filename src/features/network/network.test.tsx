import { describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../../app/App';
import { createQrDataUrl } from './NetworkTools';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('Parte 8: rede e QR Code', () => {
  it('valida conteúdo e limite de tamanho antes de gerar QR', () => {
    expect(() => createQrDataUrl('  ', '#000000', '#ffffff', 320, 'M')).toThrow(/Digite um texto/);
    expect(() => createQrDataUrl('x'.repeat(2901), '#000000', '#ffffff', 320, 'M')).toThrow(/2.900/);
  });
  it('abre a ferramenta de QR Code funcional no catálogo', async () => {
    render(<MemoryRouter initialEntries={['/ferramentas/qr-code']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Gerador de QR Code' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Gerar QR Code/ })).toBeTruthy();
    expect(screen.getByText(/não é enviado para um serviço externo/)).toBeTruthy();
  });
});
