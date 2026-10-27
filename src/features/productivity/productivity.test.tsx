import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../../app/App';
import { getPomodoroDuration } from './ProductivityTools';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('Parte 10: produtividade e estudos', () => {
  it('converte as durações configuradas do Pomodoro em segundos', () => {
    expect(getPomodoroDuration('focus', 25, 5)).toBe(1500);
    expect(getPomodoroDuration('break', 25, 5)).toBe(300);
  });
  it('adiciona tarefas e persiste a lista localmente', async () => {
    const user = userEvent.setup(); render(<MemoryRouter initialEntries={['/ferramentas/lista-tarefas']}><App /></MemoryRouter>);
    await user.type(await screen.findByRole('textbox', { name: 'Nova tarefa' }), 'Ler capítulo');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(screen.getByText('Ler capítulo')).toBeTruthy();
    expect(localStorage.getItem('yva-productivity-tasks-v1')).toContain('Ler capítulo');
  });
  it('cria cartões de estudo e revela a resposta', async () => {
    const user = userEvent.setup(); render(<MemoryRouter initialEntries={['/ferramentas/cartoes-estudo']}><App /></MemoryRouter>);
    await user.type(await screen.findByLabelText('Pergunta (até 300 caracteres)'), 'O que é HTML?');
    await user.type(await screen.findByLabelText('Resposta (até 1.000 caracteres)'), 'Linguagem de marcação');
    await user.click(screen.getByRole('button', { name: /Salvar cartão/ }));
    expect(screen.getByText('O que é HTML?')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Revelar resposta' }));
    expect(screen.getByText('Linguagem de marcação')).toBeTruthy();
  });
});
