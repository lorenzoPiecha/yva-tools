import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../app/App';
import { analyzeText, convertIntegerBase, decodeJwt, decodeUrlComponent, encodeUrlComponent, estimatePasswordStrength, generatePassword, generatePassphrase, inferTypeScriptFromJson, md5Bytes, renderSafeMarkdown, sha256Text, urlParts } from './CodeDataTools';
import { compareTextLines } from '../files/FilesTools';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('Parte 6: programação, dados e segurança', () => {
  it('calcula MD5 conhecido e decodifica JWT sem validar assinatura', () => {
    expect(md5Bytes(new TextEncoder().encode('abc'))).toBe('900150983cd24fb0d6963f7d28e17f72');
    const token = `${btoa('{"alg":"none","typ":"JWT"}').replace(/=/g, '')}.${btoa('{"sub":"123","name":"YVA"}').replace(/=/g, '')}.assinatura`;
    expect(decodeJwt(token)).toMatchObject({ header: { alg: 'none', typ: 'JWT' }, payload: { sub: '123', name: 'YVA' }, signature: 'assinatura' });
    expect(() => decodeJwt('token-invalido')).toThrow(/formato/);
  });
  it('infere tipos TypeScript a partir de objetos JSON e valida JSON inválido', () => {
    const output = inferTypeScriptFromJson('{"user-name":"Ana","active":true,"tags":["a","b"],"meta":null}', 'Profile');
    expect(output).toContain('export type Profile');
    expect(output).toContain('"user-name": string');
    expect(output).toContain('active: boolean');
    expect(output).toContain('string[]');
    expect(output).toContain('meta: null');
    expect(() => inferTypeScriptFromJson('{bad')).toThrow();
  });
  it('converte inteiros entre bases sem perder precisão e rejeita dígitos inválidos', () => {
    expect(convertIntegerBase('FF', 16)).toMatchObject({ decimal: '255', binario: '11111111', octal: '377' });
    expect(convertIntegerBase('-101', 2).decimal).toBe('-5');
    expect(convertIntegerBase('9007199254740993', 10).hexadecimal).toBe('20000000000001');
    expect(() => convertIntegerBase('2', 2)).toThrow(/base 2/);
  });

  it('conta caracteres Unicode, palavras e linhas', () => {
    expect(analyzeText('Olá 🌊\nYVA')).toEqual({ characters: 9, words: 2, lines: 2, withoutSpaces: 7 });
    expect(analyzeText('')).toEqual({ characters: 0, words: 0, lines: 0, withoutSpaces: 0 });
  });

  it('calcula SHA-256 conhecido e preserva o aviso de uso local', async () => {
    expect(await sha256Text('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('gera senhas com grupos escolhidos e frases-senha limitadas', () => {
    const password = generatePassword(20, { lower: true, upper: true, numbers: true, symbols: false });
    expect(password).toHaveLength(20); expect(password).toMatch(/[a-z]/); expect(password).toMatch(/[A-Z]/); expect(password).toMatch(/[0-9]/); expect(password).not.toMatch(/[!@#$%^&*]/);
    expect(generatePassphrase(6).split('-')).toHaveLength(6);
    expect(() => generatePassword(7, { lower: true, upper: false, numbers: false, symbols: false })).toThrow(/8 e 128/);
    expect(estimatePasswordStrength('')).toMatchObject({ bits: 0 });
    expect(estimatePasswordStrength('senha123')).toMatchObject({ label: 'Muito fraca' });
  });

  it('analisa URLs sem acessá-las e escapa HTML na prévia Markdown', () => {
    expect(urlParts('https://example.test:8443/a?b=2#c')).toMatchObject({ protocol: 'https:', domain: 'example.test', port: '8443', path: '/a', query: '?b=2' });
    expect(() => urlParts('isso não é url')).toThrow();
    const rendered = renderSafeMarkdown('# Título\n<script>alert(1)</script>\n**forte**');
    expect(rendered).toContain('<h1>Título</h1>');
    expect(rendered).toContain('&lt;script&gt;');
    expect(rendered).not.toContain('<script>');
  });

  it('codifica URLs, compara linhas e valida casos inválidos', () => {
    expect(encodeUrlComponent('café & chá')).toBe('caf%C3%A9%20%26%20ch%C3%A1');
    expect(decodeUrlComponent('caf%C3%A9%20%26%20ch%C3%A1')).toBe('café & chá');
    expect(() => decodeUrlComponent('%zz')).toThrow();
    expect(compareTextLines('a\nb\nb', 'a\nc')).toEqual({ removed: ['b', 'b'], added: ['c'] });
  });

  it('expõe os novos geradores no registro e permite criar um token', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/ferramentas/gerador-token']}><App /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: /Gerar token/ }));
    expect(screen.getByText(/^[0-9a-f]{64}$/i)).toBeTruthy();
  });

  it('permite selecionar um arquivo no fluxo visual do gerador de hash', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/ferramentas/hash']}><App /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: 'Arquivo' }));
    const picker = screen.getByLabelText(/Escolher arquivo/);
    fireEvent.change(picker, { target: { files: [new File(['abc'], 'abc.txt', { type: 'text/plain' })] } });
    expect(screen.getByText('abc.txt')).toBeTruthy();
  });
});
