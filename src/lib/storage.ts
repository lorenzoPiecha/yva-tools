// Keep the original namespace so existing saved preferences survive the YVA Tools rebrand.
const keys = { favorites: 'nexus:favorites', history: 'nexus:history', theme: 'nexus:theme', largeText: 'nexus:largeText' } as const;
type Theme = 'dark' | 'light';
type Preferences = { version: 1; favorites: string[]; history: string[]; theme: Theme; largeText: boolean };

function read<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
}
function readStringList(key: string) {
  const value: unknown = read(key, []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export const storage = {
  getFavorites: () => readStringList(keys.favorites),
  setFavorites: (value: string[]) => write(keys.favorites, value),
  getHistory: () => readStringList(keys.history),
  setHistory: (value: string[]) => write(keys.history, value),
  getTheme: (): Theme => { const value: unknown = read(keys.theme, 'dark'); return value === 'light' ? 'light' : 'dark'; },
  setTheme: (value: Theme) => write(keys.theme, value),
  getLargeText: () => read<boolean>(keys.largeText, false) === true,
  setLargeText: (value: boolean) => write(keys.largeText, value),
  exportData: (): Preferences => ({ version: 1, favorites: readStringList(keys.favorites), history: readStringList(keys.history), theme: storage.getTheme(), largeText: storage.getLargeText() }),
  importData: (value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('Arquivo de preferências inválido.');
    const data = value as Record<string, unknown>;
    if (data.version !== 1 || !Array.isArray(data.favorites) || !Array.isArray(data.history) || (data.theme !== 'dark' && data.theme !== 'light') || typeof data.largeText !== 'boolean') throw new Error('O arquivo não contém preferências YVA Tools válidas.');
    const next = new Map<string, string>([
      [keys.favorites, JSON.stringify(data.favorites.filter((id): id is string => typeof id === 'string'))],
      [keys.history, JSON.stringify(data.history.filter((id): id is string => typeof id === 'string'))],
      [keys.theme, JSON.stringify(data.theme)],
      [keys.largeText, JSON.stringify(data.largeText)],
    ]);
    const previous = new Map<string, string | null>();
    try {
      for (const key of next.keys()) previous.set(key, localStorage.getItem(key));
      for (const [key, serialized] of next) localStorage.setItem(key, serialized);
    } catch {
      for (const [key, oldValue] of previous) { try { if (oldValue === null) localStorage.removeItem(key); else localStorage.setItem(key, oldValue); } catch { /* Best effort rollback when storage is unavailable. */ } }
      throw new Error('Não foi possível salvar as preferências. O armazenamento do navegador pode estar indisponível.');
    }
  },
  clearData: () => {
    try { Object.values(keys).forEach((key) => localStorage.removeItem(key)); return true; }
    catch { return false; }
  },
};
