import { useEffect, useState } from 'react';
import { BookOpen, Check, Pause, Play, RotateCcw, SkipForward, Trash2 } from 'lucide-react';
import { NumberField } from '../../components/NumberField';
import './productivity.css';

type Task = { id: number; text: string; done: boolean };
type Flashcard = { id: number; front: string; back: string };
const TASKS_KEY = 'yva-productivity-tasks-v1'; const CARDS_KEY = 'yva-study-cards-v1';
function readLocal<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
export function getPomodoroDuration(mode: 'focus' | 'break', focusMinutes: number, breakMinutes: number) { return (mode === 'focus' ? focusMinutes : breakMinutes) * 60; }

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="web-tool-panel productivity-panel"><header className="web-panel-heading"><h2>{title}</h2><p>{description}</p></header>{children}</section>; }

function Pomodoro() {
  const [focusMinutes, setFocusMinutes] = useState(25); const [breakMinutes, setBreakMinutes] = useState(5); const [mode, setMode] = useState<'focus' | 'break'>('focus'); const [remaining, setRemaining] = useState(1500); const [running, setRunning] = useState(false); const [sessions, setSessions] = useState(0);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setRemaining((current) => Math.max(0, current - 1)), 1000); return () => window.clearInterval(timer); }, [running]);
  useEffect(() => { if (!running || remaining > 0) return; const next = mode === 'focus' ? 'break' : 'focus'; if (mode === 'focus') setSessions((number) => number + 1); setMode(next); setRemaining(getPomodoroDuration(next, focusMinutes, breakMinutes)); }, [running, remaining, mode, focusMinutes, breakMinutes]);
  const reset = () => { setRunning(false); setRemaining(getPomodoroDuration(mode, focusMinutes, breakMinutes)); };
  const selectMode = (next: 'focus' | 'break') => { setRunning(false); setMode(next); setRemaining(getPomodoroDuration(next, focusMinutes, breakMinutes)); };
  const display = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  return <Panel title="Temporizador Pomodoro" description="Trabalhe em blocos de foco e faça pausas. O contador funciona enquanto esta página estiver aberta."><div className="file-tabs"><button className={mode === 'focus' ? 'selected' : ''} onClick={() => selectMode('focus')}>Foco</button><button className={mode === 'break' ? 'selected' : ''} onClick={() => selectMode('break')}>Pausa</button></div><div className={`pomodoro-clock ${mode}`}><span>{mode === 'focus' ? 'SESSÃO DE FOCO' : 'PAUSA'}</span><strong aria-live="polite">{display}</strong><small>{sessions} sessão(ões) concluída(s)</small></div><div className="electronics-fields"><label className="text-field"><span>Foco (minutos)</span><NumberField label="Minutos de foco" min="1" max="180" step="1" disabled={running} value={focusMinutes} onChange={(raw) => { const value = Math.max(1, Math.min(180, Number(raw) || 1)); setFocusMinutes(value); if (mode === 'focus') setRemaining(value * 60); }}/></label><label className="text-field"><span>Pausa (minutos)</span><NumberField label="Minutos de pausa" min="1" max="60" step="1" disabled={running} value={breakMinutes} onChange={(raw) => { const value = Math.max(1, Math.min(60, Number(raw) || 1)); setBreakMinutes(value); if (mode === 'break') setRemaining(value * 60); }}/></label></div><div className="file-actions"><button className="primary-button" onClick={() => setRunning((value) => !value)}>{running ? <><Pause size={15}/> Pausar</> : <><Play size={15}/> Iniciar foco</>}</button><button className="text-button" onClick={reset}><RotateCcw size={14}/> Reiniciar</button><button className="text-button" onClick={() => selectMode(mode === 'focus' ? 'break' : 'focus')}><SkipForward size={14}/> Pular etapa</button></div></Panel>;
}

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(() => readLocal(TASKS_KEY, [])); const [input, setInput] = useState('');
  useEffect(() => { try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch { /* storage can be disabled */ } }, [tasks]);
  const add = () => { const text = input.trim(); if (!text || text.length > 160) return; setTasks((current) => [...current, { id: Date.now() + Math.floor(Math.random() * 1000), text, done: false }]); setInput(''); };
  return <Panel title="Lista de tarefas" description="Adicione itens, marque o que concluiu e retome a lista neste navegador."><form className="task-entry" onSubmit={(event) => { event.preventDefault(); add(); }}><input aria-label="Nova tarefa" maxLength={160} value={input} onChange={(event) => setInput(event.target.value)} placeholder="O que você precisa fazer?"/><button className="primary-button" type="submit" disabled={!input.trim()}>Adicionar</button></form>{tasks.length ? <ul className="task-list">{tasks.map((task) => <li key={task.id} className={task.done ? 'done' : ''}><button className="task-check" aria-label={task.done ? `Reabrir ${task.text}` : `Concluir ${task.text}`} onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}>{task.done && <Check size={15}/>}</button><span>{task.text}</span><button className="icon-button" aria-label={`Excluir ${task.text}`} onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}><Trash2 size={15}/></button></li>)}</ul> : <p className="electronics-note">Sua lista está vazia. As tarefas ficam salvas somente neste dispositivo.</p>}{tasks.length > 0 && <button className="text-button" onClick={() => setTasks((current) => current.filter((item) => !item.done))}>Remover concluídas</button>}<p className="electronics-note">Dados guardados no armazenamento local deste navegador; limpar os dados do site pode apagá-los.</p></Panel>;
}

function Flashcards() {
  const [cards, setCards] = useState<Flashcard[]>(() => readLocal(CARDS_KEY, [])); const [front, setFront] = useState(''); const [back, setBack] = useState(''); const [index, setIndex] = useState(0); const [revealed, setRevealed] = useState(false);
  useEffect(() => { try { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); } catch { /* storage can be disabled */ } }, [cards]);
  const add = () => { const question = front.trim(); const answer = back.trim(); if (!question || !answer || question.length > 300 || answer.length > 1000) return; setCards((current) => [...current, { id: Date.now(), front: question, back: answer }]); setFront(''); setBack(''); setIndex(cards.length); setRevealed(false); };
  const current = cards[index];
  return <Panel title="Cartões de estudo" description="Crie perguntas e respostas e revele cada cartão para praticar a lembrança ativa."><div className="flashcard-form"><label className="text-field"><span>Pergunta (até 300 caracteres)</span><textarea maxLength={300} rows={2} value={front} onChange={(event) => setFront(event.target.value)}/></label><label className="text-field"><span>Resposta (até 1.000 caracteres)</span><textarea maxLength={1000} rows={3} value={back} onChange={(event) => setBack(event.target.value)}/></label><button className="primary-button" onClick={add} disabled={!front.trim() || !back.trim()}><BookOpen size={15}/> Salvar cartão</button></div>{current ? <div className="study-card"><span>{index + 1} / {cards.length}</span><strong>{revealed ? current.back : current.front}</strong><div className="file-actions"><button className="primary-button" onClick={() => setRevealed((value) => !value)}>{revealed ? 'Ver pergunta' : 'Revelar resposta'}</button><button className="text-button" onClick={() => { setIndex((value) => (value + 1) % cards.length); setRevealed(false); }}>Próximo cartão</button><button className="icon-button" aria-label="Excluir cartão atual" onClick={() => { const remaining = cards.filter((card) => card.id !== current.id); setCards(remaining); setIndex(Math.max(0, Math.min(index, remaining.length - 1))); setRevealed(false); }}><Trash2 size={15}/></button></div></div> : <p className="electronics-note">Ainda não há cartões. Crie uma pergunta e uma resposta acima para começar.</p>}<p className="electronics-note">Cartões salvos localmente neste navegador.</p></Panel>;
}

export function ProductivityTool({ slug }: { slug: string }) {
  if (slug === 'pomodoro') return <Pomodoro/>;
  if (slug === 'lista-tarefas') return <TaskList/>;
  if (slug === 'cartoes-estudo') return <Flashcards/>;
  return null;
}
