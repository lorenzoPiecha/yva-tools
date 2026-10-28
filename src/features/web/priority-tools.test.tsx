import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../app/App';
import { contrastRatio } from './ColorTools';

function mount(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

afterEach(() => { cleanup(); localStorage.clear(); });

describe('Parte 3: ferramentas prioritárias', () => {
  it('converte HEX em RGB/HSL e informa entradas inválidas', async () => {
    const user = userEvent.setup();
    mount('/ferramentas/conversor-cores');
    expect(screen.getByText('rgb(25, 197, 216)')).toBeTruthy();
    expect(screen.getByText('hsl(186, 79%, 47%)')).toBeTruthy();
    const input = screen.getByRole('textbox', { name: 'Código HEX' });
    await user.clear(input);
    await user.type(input, 'not-a-color');
    expect(screen.getByRole('alert').textContent).toContain('HEX válida');
  });

  it('calcula contraste WCAG com a relação esperada para preto e branco', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('invalid', '#000000')).toBeNull();
  });

  it('formata JSON e mostra erros de validação', async () => {
    const user = userEvent.setup();
    mount('/ferramentas/json');
    await user.click(screen.getByRole('button', { name: 'Formatar e validar' }));
    expect(screen.getByText(/"ferramenta": "YVA Tools"/)).toBeTruthy();
    const input = screen.getByRole('textbox', { name: 'JSON de entrada' });
    await user.clear(input);
    fireEvent.change(input, { target: { value: '{invalido' } });
    await user.click(screen.getByRole('button', { name: 'Formatar e validar' }));
    expect(screen.getByRole('alert').textContent).toContain('JSON inválido');
  });

  it('codifica e decodifica texto Unicode em Base64', async () => {
    const user = userEvent.setup();
    mount('/ferramentas/base64');
    const input = screen.getByRole('textbox', { name: 'Texto ou Base64' });
    await user.clear(input);
    await user.type(input, 'Olá, 🌊!');
    await user.click(screen.getByRole('button', { name: 'Codificar' }));
    const encoded = screen.getByText('T2zDoSwg8J+MiiE=');
    expect(encoded).toBeTruthy();
    await user.clear(input);
    await user.type(input, encoded.textContent ?? '');
    await user.click(screen.getByRole('button', { name: 'Decodificar' }));
    expect(screen.getByText('Olá, 🌊!')).toBeTruthy();
  });

  it('gera UUID v4 e mantém o playground em iframe sem same-origin', async () => {
    const user = userEvent.setup();
    mount('/ferramentas/uuid');
    await user.click(screen.getByRole('button', { name: /Gerar UUID/ }));
    await waitFor(() => expect(screen.getByText(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)).toBeTruthy());
    cleanup();
    mount('/ferramentas/playground');
    const frame = screen.getByTitle('Prévia isolada do código') as HTMLIFrameElement;
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin');
  });

  it('gera CSS para botões com valores alteráveis', async () => {
    const { container } = mount('/ferramentas/gerador-botoes');
    expect(screen.getByText(/\.yva-button/)).toBeTruthy();
    expect(screen.getByText(/border-radius: 10px/)).toBeTruthy();
    const radius = screen.getByRole('slider', { name: /Raio/ });
    fireEvent.change(radius, { target: { value: '20' } });
    expect(screen.getByText(/border-radius: 20px/)).toBeTruthy();
    const css = () => container.querySelector('.code-output code')?.textContent ?? '';
    fireEvent.change(screen.getByRole('combobox', { name: 'Estilo visual do botão' }), { target: { value: 'tilted' } });
    expect(css()).toContain('rotateX(10deg)');
    fireEvent.change(screen.getByRole('combobox', { name: 'Estilo visual do botão' }), { target: { value: 'raised' } });
    expect(css()).toContain('box-shadow: 0 7px 0');
    expect(css()).toContain('.yva-button:focus-visible');
    expect(css()).toContain('.yva-button:disabled');
  });

  it('personaliza componentes web e mantém prévia e HTML/CSS coerentes', async () => {
    const user = userEvent.setup();
    mount('/ferramentas/biblioteca-componentes');
    expect(screen.getByRole('heading', { name: 'Biblioteca de componentes' })).toBeTruthy();
    const title = screen.getByRole('textbox', { name: 'Título do componente' });
    await user.clear(title);
    await user.type(title, 'Meu card');
    expect(screen.getByText('Meu card')).toBeTruthy();
    expect(document.querySelector('.component-code-block code')?.textContent).toContain('Meu card');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo de componente' }), 'button');
    expect(document.querySelector('.component-code-block code')?.textContent).toContain('<button');
    expect(screen.getByRole('button', { name: 'Meu card' })).toBeTruthy();
  });

  it('oferece controles de formulário e barra de progresso com marcação acessível', async () => {
    const user = userEvent.setup();
    mount('/ferramentas/biblioteca-componentes');
    const type = screen.getByRole('combobox', { name: 'Tipo de componente' });
    for (const [kind, marker] of [['select', '<select>'], ['textarea', '<textarea'], ['checkbox', 'type="checkbox"'], ['switch', 'role="switch"'], ['progress', 'role="progressbar"']] as const) {
      await user.selectOptions(type, kind);
      expect(document.querySelector('.component-code-block code')?.textContent).toContain(marker);
    }
    expect(screen.getByRole('progressbar', { name: 'Componente personalizado' })).toBeTruthy();
  });

  it('gera estilos visuais com gradiente, transparência, relevo e inclinação ajustáveis', async () => {
    const user = userEvent.setup();
    mount('/ferramentas/biblioteca-componentes');
    const style = screen.getByRole('combobox', { name: 'Estilo visual do componente' });
    const css = () => document.querySelectorAll('.component-code-block code')[1]?.textContent ?? '';
    await user.selectOptions(style, 'gradient');
    expect(css()).toContain('linear-gradient(135deg, #19C5D8, #725CFF)');
    await user.selectOptions(style, 'glass');
    expect(css()).toContain('backdrop-filter: blur(8px)');
    expect(css()).toContain('55%, transparent');
    await user.selectOptions(style, 'raised');
    expect(css()).toContain('box-shadow: 0 12px 0');
    await user.selectOptions(style, 'tilted');
    expect(css()).toContain('rotateX(8deg) rotateY(-8deg)');
    await user.selectOptions(style, 'neon');
    expect(css()).toContain('text-shadow:');
    await user.click(screen.getByRole('checkbox', { name: 'Ativar sombra ou brilho' }));
    expect(css()).toContain('box-shadow: none;');
  });

  it('permite editar raios independentes nos quatro cantos', async () => {
    const user = userEvent.setup();
    mount('/ferramentas/bordas-css');
    expect(document.querySelector('.code-output code')?.textContent).toContain('border-radius: 18px 18px 18px 18px');
    await user.click(screen.getByRole('checkbox', { name: 'Manter os quatro cantos iguais' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Superior esquerdo' }), { target: { value: '40' } });
    const css = document.querySelector('.code-output code')?.textContent ?? '';
    expect(css).toContain('border-radius: 40px 18px 18px 18px');
    expect(document.querySelector('.border-preview')?.getAttribute('style')).toContain('40px 18px 18px 18px');
    await user.click(screen.getByRole('checkbox', { name: 'Manter os quatro cantos iguais' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Inferior direito' }), { target: { value: '12' } });
    expect(document.querySelector('.code-output code')?.textContent).toContain('border-radius: 12px 12px 12px 12px');
  });

  it('recusa arquivo que não seja imagem no extrator de cores', () => {
    mount('/ferramentas/extrator-cores');
    const file = new File(['texto'], 'not-image.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Escolher imagem para extrair cores'), { target: { files: [file] } });
    expect(screen.getByRole('alert').textContent).toContain('imagem válido');
  });

  it('converte unidades com base tipográfica configurável', async () => {
    const user = userEvent.setup();
    mount('/ferramentas/unidades-css');
    expect(screen.getByText('1rem')).toBeTruthy();
    const value = screen.getByRole('textbox', { name: 'Valor em pixels' });
    await user.clear(value);
    await user.type(value, '24');
    expect(screen.getByText('1.5rem')).toBeTruthy();
    const base = screen.getByRole('textbox', { name: 'Tamanho base em pixels' });
    fireEvent.change(base, { target: { value: '0' } });
    expect(screen.getByRole('alert').textContent).toContain('base maior que zero');
  });
});
