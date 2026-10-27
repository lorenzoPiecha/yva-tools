import { describe, expect, it } from 'vitest';
import { buildReadmeMarkdown, formatMarkup, ICONS, minifyMarkup, minifyScript, regexHighlightParts } from './WebDevKit';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';
import { WebDevKit } from './WebDevKit';

afterEach(() => cleanup());

describe('Kit de desenvolvimento web', () => {
  it('divide o texto em trechos seguros para realçar correspondências regex', () => {
    expect(regexHighlightParts('YVA Tools 2026', [{ match: 'YVA', index: 0 }, { match: '2026', index: 10 }])).toEqual([
      { text: 'YVA', matched: true }, { text: ' Tools ', matched: false }, { text: '2026', matched: true },
    ]);
  });
  it('indenta HTML básico e organiza CSS por blocos', () => {
    expect(formatMarkup('<main><h1>YVA</h1></main>', 'html')).toContain('  <h1>YVA</h1>');
    expect(formatMarkup('.x{color:red;}', 'css')).toContain('  color: red;');
  });
  it('minifica marcação HTML e CSS básicos', () => {
    expect(minifyMarkup('<main>\n  <p>Oi</p>\n</main>', 'html')).toBe('<main><p>Oi</p></main>');
    expect(minifyMarkup('.x { color: red; }', 'css')).toBe('.x{color:red;}');
  });
  it('compacta JavaScript simples preservando texto literal e removendo comentários', () => {
    expect(minifyScript('const label = "a  b"; // nota\nconst x = 1 + 2;')).toBe('const label="a  b";const x=1+2;');
  });
  it('exibe abas com estado ativo claro e os desenhos reais dos ícones', async () => {
    const user = userEvent.setup(); render(<WebDevKit/>);
    const catalogTab = screen.getByRole('button', { name: /Fontes · Ícones/ });
    expect(catalogTab.getAttribute('aria-pressed')).toBe('false');
    await user.click(catalogTab);
    expect(catalogTab.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Home')).toBeTruthy();
    expect(ICONS.length).toBeGreaterThan(140);
    expect(new Set(ICONS.map(([name]) => name)).size).toBe(ICONS.length);
    expect(document.querySelectorAll('.icon-catalog-item').length).toBe(ICONS.length);
    expect(document.querySelectorAll('.icon-catalog-item svg').length).toBeGreaterThanOrEqual(ICONS.length);
  });
  it('filtra o catálogo pelos nomes exatos e gera um README Markdown', async () => {
    const user = userEvent.setup(); render(<WebDevKit/>);
    await user.click(screen.getByRole('button', { name: /Fontes · Ícones/ }));
    const search = screen.getByRole('searchbox', { name: 'Pesquisar ícones' });
    await user.type(search, 'Wifi');
    expect(screen.getByText('Wifi')).toBeTruthy();
    expect(document.querySelectorAll('.icon-catalog-item').length).toBe(1);
    expect(buildReadmeMarkdown({ name: 'Demo', description: 'Projeto', features: 'Busca\n- Testes', install: 'npm i', usage: 'npm run dev', license: 'MIT' })).toContain('# Demo\n\nProjeto\n\n## Funcionalidades\n\n- Busca\n- Testes');
    await user.click(screen.getByRole('button', { name: /README/ }));
    expect(screen.getByText('Prévia do README.md')).toBeTruthy();
  });
  it('mostra o resultado do formatador em campo próprio e permite usá-lo como entrada', async () => {
    const user = userEvent.setup(); render(<WebDevKit/>);
    await user.click(screen.getByRole('button', { name: 'Formatar código' }));
    const result = screen.getByRole('textbox', { name: 'Resultado do formatador' }) as HTMLTextAreaElement;
    expect(result.value).toContain('\n  <h1>YVA Tools</h1>');
    await user.click(screen.getByRole('button', { name: 'Usar resultado como entrada' }));
    expect(screen.getByLabelText('Código de entrada')).toHaveProperty('value', result.value);
  });
});
