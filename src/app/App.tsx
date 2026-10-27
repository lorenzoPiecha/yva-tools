import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Code2,
  Calculator,
  Command,
  Cpu,
  Heart,
  History,
  Home,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { categories, tools, type Category } from "../data/tools";
import { storage } from "../lib/storage";
import WebTool from "../features/web/WebTools";
import {
  BorderGenerator,
  ButtonGenerator,
  CssUnitConverter,
} from "../features/web/CSSTools";
import {
  ColorConverter,
  ContrastChecker,
  ImageColorExtractor,
} from "../features/web/ColorTools";
import {
  Base64Tool,
  HtmlPlayground,
  JsonFormatter,
  UuidGenerator,
} from "../features/programming/DevTools";
import { ElectronicsTool, formatEngineeringResult } from "../features/electronics/ElectronicsTools";
import { UtilitiesTool } from "../features/utilities/UtilitiesTools";
import { calculateQuickExpression } from "../lib/quickCalc";
import { CopyResultButton } from "../components/CopyResultButton";
import "../features/electronics/electronics.css";
const FilesTool = lazy(() =>
  import("../features/files/FilesTools").then((module) => ({
    default: module.FilesTool,
  })),
);
const CodeDataTool = lazy(() =>
  import("../features/programming/CodeDataTools").then((module) => ({
    default: module.CodeDataTool,
  })),
);
const ProgrammingSuite = lazy(() =>
  import("../features/programming/ProgrammingSuite").then((module) => ({
    default: module.ProgrammingSuite,
  })),
);
const WebDevKit = lazy(() =>
  import("../features/web/WebDevKit").then((module) => ({
    default: module.WebDevKit,
  })),
);
const NetworkTool = lazy(() =>
  import("../features/network/NetworkTools").then((module) => ({
    default: module.NetworkTool,
  })),
);
const MediaTool = lazy(() =>
  import("../features/media/MediaTools").then((module) => ({
    default: module.MediaTool,
  })),
);
const ProductivityTool = lazy(() =>
  import("../features/productivity/ProductivityTools").then((module) => ({
    default: module.ProductivityTool,
  })),
);

export default function App() {
  const [favorites, setFavorites] = useState(storage.getFavorites);
  const [history, setHistory] = useState(storage.getHistory);
  const [theme, setTheme] = useState(storage.getTheme);
  const [largeText, setLargeText] = useState(storage.getLargeText);
  const [query, setQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState(0);
  const [notice, setNotice] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#050b10" : "#f3fafb");
    storage.setTheme(theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.largeText = String(largeText);
    storage.setLargeText(largeText);
  }, [largeText]);
  useEffect(() => {
    setMobileOpen(false);
    const match = tools.find((tool) => tool.path === location.pathname);
    document.title =
      location.pathname === "/"
        ? "YVA Tools"
        : `${match?.name ?? pageTitle(location.pathname)} · YVA Tools`;
    if (match)
      setHistory((prev) => {
        const next = [match.id, ...prev.filter((id) => id !== match.id)].slice(
          0,
          20,
        );
        storage.setHistory(next);
        return next;
      });
  }, [location.pathname]);
  const filtered = useMemo(
    () =>
      tools.filter((tool) =>
        `${tool.name} ${tool.description} ${tool.category} ${tool.keywords.join(" ")} ${(tool.synonyms ?? []).join(" ")}`
          .toLocaleLowerCase("pt-BR")
          .includes(query.trim().toLocaleLowerCase("pt-BR")),
      ),
    [query],
  );
  const quickCalculation = useMemo(() => calculateQuickExpression(query), [query]);
  const quickCalculationText = quickCalculation
    ? formatEngineeringResult(quickCalculation.value, quickCalculation.unit)
    : "";
  useEffect(() => setSelectedResult(0), [query]);
  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (
        event.key === "Escape" &&
        document.activeElement === searchRef.current
      ) {
        setQuery("");
        searchRef.current?.blur();
      }
      if (event.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [mobileOpen]);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };
  const toggleFavorite = (id: string) => {
    const isFavorite = favorites.includes(id);
    const next = isFavorite
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    const saved = storage.setFavorites(next);
    setFavorites(next);
    const name = tools.find((tool) => tool.id === id)?.name ?? "Ferramenta";
    showNotice(
      !saved
        ? "O navegador não conseguiu salvar os favoritos nesta sessão"
        : isFavorite
          ? `${name} removida dos favoritos`
          : `${name} adicionada aos favoritos`,
    );
  };
  const clearHistory = () => {
    setHistory([]);
    storage.setHistory([]);
  };
  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(storage.exportData(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "yva-tools-preferencias.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotice("Preferências exportadas");
  };
  const importSettings = async (file?: File) => {
    if (!file) return;
    try {
      storage.importData(JSON.parse(await file.text()));
      setFavorites(storage.getFavorites());
      setHistory(storage.getHistory());
      setTheme(storage.getTheme());
      setLargeText(storage.getLargeText());
      showNotice("Preferências importadas");
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível importar o arquivo",
      );
    }
  };
  const clearLocalData = () => {
    if (
      !window.confirm(
        "Apagar favoritos, histórico e preferências salvos neste navegador?",
      )
    )
      return;
    const cleared = storage.clearData();
    setFavorites([]);
    setHistory([]);
    setTheme("dark");
    setLargeText(false);
    showNotice(
      cleared
        ? "Dados locais apagados"
        : "Os dados foram limpos desta sessão, mas o navegador não permitiu apagar o armazenamento local",
    );
  };
  const selectSearchResult = (path: string) => {
    setQuery("");
    navigate(path);
  };
  const matchingFavorites = tools.filter((tool) => favorites.includes(tool.id));
  const matchingHistory = history
    .map((id) => tools.find((tool) => tool.id === id))
    .filter((tool): tool is (typeof tools)[number] => Boolean(tool));
  return (
    <div className="app-shell">
      <aside
        id="primary-sidebar"
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      >
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Command size={21} />
          </span>
          <span>
            YVA<span className="brand-light"> TOOLS</span>
            <small>SEU ESPAÇO DE FERRAMENTAS</small>
          </span>
        </Link>
        <nav className="side-nav" aria-label="Navegação principal">
          <p className="nav-label">MENU</p>
          <NavLink
            to="/"
            icon={<Home size={17} />}
            label="Início"
            active={location.pathname === "/"}
          />
          <NavLink
            to="/favoritos"
            icon={<Heart size={17} />}
            label="Favoritos"
            count={favorites.length}
          />
          <NavLink
            to="/historico"
            icon={<History size={17} />}
            label="Recentes"
          />
          <p className="nav-label category-label">CATEGORIAS</p>
          {categories.map((category) => (
            <NavLink
              key={category.name}
              to={`/categoria/${encodeURIComponent(category.name)}`}
              icon={<category.icon size={17} />}
              label={category.name}
            />
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink
            to="/configuracoes"
            icon={<Settings size={17} />}
            label="Configurações"
          />
          <div className="privacy-note">
            <span className="privacy-dot" />
            <div>
              <strong>Seu espaço, suas regras</strong>
              <p>Ferramentas sem anúncios próprios.</p>
            </div>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            aria-controls="primary-sidebar"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <Menu size={19} />
          </button>
          <div className="breadcrumbs">
            <span>YVA Tools</span>
            <span className="crumb-slash">/</span>
            <strong>{pageTitle(location.pathname)}</strong>
          </div>
          <div className="top-actions">
            <div className="search-wrap">
              <label className="search-box">
                <Search size={17} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(event) => {
                    const options = filtered.slice(0, 7);
                    if (event.key === "ArrowDown" && options.length) {
                      event.preventDefault();
                      setSelectedResult(
                        (current) => (current + 1) % options.length,
                      );
                    }
                    if (event.key === "ArrowUp" && options.length) {
                      event.preventDefault();
                      setSelectedResult(
                        (current) =>
                          (current - 1 + options.length) % options.length,
                      );
                    }
                    if (event.key === "Enter" && options[selectedResult]) {
                      event.preventDefault();
                      selectSearchResult(options[selectedResult].path);
                    }
                  }}
                  placeholder="Buscar ferramentas..."
                  aria-label="Buscar ferramentas"
                  aria-controls="search-suggestions"
                  aria-expanded={Boolean(query)}
                  aria-activedescendant={
                    query && filtered[selectedResult]
                      ? `search-result-${filtered[selectedResult].id}`
                      : undefined
                  }
                />
                {query && (
                  <button
                    className="clear-search"
                    onClick={() => setQuery("")}
                    aria-label="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
                <kbd>
                  {navigator.platform.includes("Mac") ? "⌘ K" : "Ctrl K"}
                </kbd>
              </label>
              {query && (
                <div
                  id="search-suggestions"
                  className="search-suggestions"
                  role="listbox"
                  aria-label="Resultados da busca"
                >
                  {quickCalculation && (
                    <div className="quick-calc-suggestion" role="option" aria-selected="false">
                      <Calculator size={16}/>
                      <span><strong>Resultado rápido</strong><small>{query}</small></span>
                      <b>{quickCalculationText}</b>
                    </div>
                  )}
                  {filtered.length ? (
                    filtered.slice(0, 7).map((tool, index) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedResult === index}
                        id={`search-result-${tool.id}`}
                        className={`search-suggestion ${selectedResult === index ? "suggestion-active" : ""}`}
                        key={tool.id}
                        onMouseEnter={() => setSelectedResult(index)}
                        onClick={() => selectSearchResult(tool.path)}
                      >
                        <tool.icon size={16} />
                        <span>
                          <strong>{tool.name}</strong>
                          <small>{tool.category}</small>
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p className="no-suggestions">
                      Nenhuma ferramenta encontrada.
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              className="icon-button theme-button"
              title="Alternar tema"
              aria-label="Alternar tema"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="avatar">Y</div>
          </div>
        </header>
        {notice && (
          <div role="status" className="app-notice">
            <Sparkles size={15} />
            {notice}
          </div>
        )}
        {query ? (
          <div className="content">
            <PageHeading
              eyebrow="BUSCA GLOBAL"
              title={`Resultados para “${query}”`}
              subtitle={`${filtered.length} ferramenta${filtered.length === 1 ? "" : "s"} encontrada${filtered.length === 1 ? "" : "s"}.`}
            />
            {quickCalculation && <section className="quick-calculation-result"><div><small>CALCULADORA RÁPIDA</small><h2>{query}</h2><strong>{quickCalculationText}</strong></div><CopyResultButton value={quickCalculationText}/></section>}
            {filtered.length > 0 ? <ToolGrid items={filtered} favorites={favorites} onFavorite={toggleFavorite}/> : !quickCalculation && <p className="empty-state">Nenhuma ferramenta encontrada para essa busca.</p>}
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <HomePage favorites={favorites} onFavorite={toggleFavorite} />
              }
            />
            <Route
              path="/categoria/:category"
              element={
                <CategoryPage
                  favorites={favorites}
                  onFavorite={toggleFavorite}
                />
              }
            />
            <Route
              path="/favoritos"
              element={
                <CollectionPage
                  title="Seus favoritos"
                  subtitle="As ferramentas que você marcou para encontrar mais rápido."
                  items={matchingFavorites}
                  empty="Toque no coração de uma ferramenta para guardá-la aqui."
                  favorites={favorites}
                  onFavorite={toggleFavorite}
                />
              }
            />
            <Route
              path="/historico"
              element={
                <CollectionPage
                  title="Acessadas recentemente"
                  subtitle="Continue de onde você parou."
                  items={matchingHistory}
                  empty="As ferramentas que você abrir aparecerão aqui."
                  favorites={favorites}
                  onFavorite={toggleFavorite}
                  clearHistory={clearHistory}
                />
              }
            />
            <Route
              path="/configuracoes"
              element={
                <SettingsPage
                  theme={theme}
                  setTheme={setTheme}
                  largeText={largeText}
                  setLargeText={setLargeText}
                  favorites={favorites.length}
                  history={history.length}
                  exportSettings={exportSettings}
                  importSettings={importSettings}
                  clearLocalData={clearLocalData}
                />
              }
            />
            <Route
              path="/ferramentas/:slug"
              element={
                <ToolPage favorites={favorites} onFavorite={toggleFavorite} />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function NavLink({
  to,
  icon,
  label,
  count,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <Link className={`nav-item ${active ? "nav-active" : ""}`} to={to}>
      {icon}
      <span>{label}</span>
      {count ? <small>{count}</small> : null}
    </Link>
  );
}
function pageTitle(path: string) {
  if (path === "/") return "Início";
  if (path.startsWith("/categoria/")) {
    const parts = path.split("/");
    return decodeURIComponent(parts[parts.length - 1] ?? "Categoria");
  }
  return (
    (
      {
        "/favoritos": "Favoritos",
        "/historico": "Recentes",
        "/configuracoes": "Configurações",
      } as Record<string, string>
    )[path] ?? "Ferramentas"
  );
}
function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function HomePage({
  favorites,
  onFavorite,
}: {
  favorites: string[];
  onFavorite: (id: string) => void;
}) {
  return (
    <div className="content">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <Sparkles size={14} /> UM LUGAR PARA FACILITAR SEU DIA
          </div>
          <h1>
            Suas ferramentas.
            <br />
            <span>Em um só lugar.</span>
          </h1>
          <p>
            Um espaço simples para criar, resolver e seguir em frente — da web à
            bancada de eletrônica.
          </p>
          <a className="hero-link" href="#explore">
            Explorar ferramentas <ArrowRight size={16} />
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-core">
            <Command size={40} />
          </div>
          <span className="float-tile tile-code">
            <Code2 size={19} />
          </span>
          <span className="float-tile tile-cpu">
            <Cpu size={19} />
          </span>
          <span className="float-tile tile-palette">
            <Sparkles size={19} />
          </span>
        </div>
        <div className="hero-index">
          Nº 001 <span>·</span> CENTRAL DE FERRAMENTAS
        </div>
      </section>
      <section id="explore" className="section-block">
        <PageHeading
          eyebrow="COMECE POR AQUI"
          title="Explore por categoria"
          subtitle="Encontre o que precisa sem perder tempo."
        />
        <div className="category-grid">
          {categories.map((item) => (
            <Link
              className="category-card"
              to={`/categoria/${encodeURIComponent(item.name)}`}
              key={item.name}
            >
              <span className="category-icon">
                <item.icon size={19} />
              </span>
              <strong>{item.name}</strong>
              <p>{item.description}</p>
              <ArrowRight size={15} className="category-arrow" />
            </Link>
          ))}
        </div>
      </section>
      <section className="section-block tools-section">
        <PageHeading
          eyebrow="CATÁLOGO"
          title="Ferramentas em destaque"
          subtitle="Um catálogo em construção, com espaço para as próximas ideias."
        />
        <ToolGrid
          items={tools.slice(0, 6)}
          favorites={favorites}
          onFavorite={onFavorite}
        />
      </section>
    </div>
  );
}
function CategoryPage({
  favorites,
  onFavorite,
}: {
  favorites: string[];
  onFavorite: (id: string) => void;
}) {
  const location = useLocation();
  const { category: raw } = (location.state as { category?: Category }) ?? {};
  const parts = location.pathname.split("/");
  const pathname = decodeURIComponent(parts[parts.length - 1] ?? "");
  const category = categories.find(
    (item) => item.name === pathname || item.name === raw,
  );
  const items = tools.filter((tool) => tool.category === category?.name);
  return (
    <div className="content">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} /> Voltar ao início
      </Link>
      <PageHeading
        eyebrow="CATEGORIA"
        title={category?.name ?? "Categoria"}
        subtitle={category?.description ?? "Ferramentas organizadas para você."}
      />
      <ToolGrid items={items} favorites={favorites} onFavorite={onFavorite} />
    </div>
  );
}
function CollectionPage({
  title,
  subtitle,
  items,
  empty,
  favorites,
  onFavorite,
  clearHistory,
}: {
  title: string;
  subtitle: string;
  items: typeof tools;
  empty: string;
  favorites: string[];
  onFavorite: (id: string) => void;
  clearHistory?: () => void;
}) {
  return (
    <div className="content">
      <PageHeading
        eyebrow="SUA BIBLIOTECA"
        title={title}
        subtitle={subtitle}
        action={
          clearHistory && items.length ? (
            <button className="text-button" onClick={clearHistory}>
              Limpar histórico
            </button>
          ) : undefined
        }
      />
      {items.length ? (
        <ToolGrid items={items} favorites={favorites} onFavorite={onFavorite} />
      ) : (
        <EmptyState text={empty} />
      )}
    </div>
  );
}
function ToolGrid({
  items,
  favorites,
  onFavorite,
}: {
  items: typeof tools;
  favorites: string[];
  onFavorite: (id: string) => void;
}) {
  if (!items.length)
    return <EmptyState text="Não encontramos ferramentas neste grupo." />;
  return (
    <div className="tool-grid">
      {items.map((tool) => (
        <article className="tool-card" key={tool.id}>
          <Link to={tool.path} className="tool-card-main">
            <span className="tool-icon">
              <tool.icon size={19} />
            </span>
            <span className={`tool-status ${tool.status}`}>
              {tool.status === "coming-soon"
                ? "EM BREVE"
                : tool.execution === "external"
                  ? "BUSCA EXTERNA"
                  : tool.execution === "mixed"
                    ? "LOCAL + WEB"
                    : "NO NAVEGADOR"}
            </span>
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
            <span className="tool-category">{tool.category}</span>
          </Link>
          <button
            className={`favorite-button ${favorites.includes(tool.id) ? "is-favorite" : ""}`}
            aria-label={
              favorites.includes(tool.id)
                ? `Remover ${tool.name} dos favoritos`
                : `Adicionar ${tool.name} aos favoritos`
            }
            onClick={() => onFavorite(tool.id)}
          >
            <Heart
              size={17}
              fill={favorites.includes(tool.id) ? "currentColor" : "none"}
            />
          </button>
        </article>
      ))}
    </div>
  );
}
function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <span>
        <Sparkles size={21} />
      </span>
      <p>{text}</p>
    </div>
  );
}
function SettingsPage({
  theme,
  setTheme,
  largeText,
  setLargeText,
  favorites,
  history,
  exportSettings,
  importSettings,
  clearLocalData,
}: {
  theme: string;
  setTheme: (v: "dark" | "light") => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  favorites: number;
  history: number;
  exportSettings: () => void;
  importSettings: (file?: File) => void;
  clearLocalData: () => void;
}) {
  return (
    <div className="content">
      <PageHeading
        eyebrow="PREFERÊNCIAS"
        title="Configurações"
        subtitle="Ajuste a experiência do seu espaço."
      />
      <section className="settings-card">
        <div>
          <strong>Aparência</strong>
          <p>Escolha o tema que fica melhor para você.</p>
        </div>
        <div className="theme-switch">
          <button
            className={theme === "dark" ? "selected" : ""}
            onClick={() => setTheme("dark")}
          >
            <Moon size={16} /> Escuro
          </button>
          <button
            className={theme === "light" ? "selected" : ""}
            onClick={() => setTheme("light")}
          >
            <Sun size={16} /> Claro
          </button>
        </div>
      </section>
      <section className="settings-card">
        <div>
          <strong>Acessibilidade</strong>
          <p>Aumente o tamanho do texto para facilitar a leitura.</p>
        </div>
        <label className="inset-toggle">
          <input
            type="checkbox"
            checked={largeText}
            onChange={(event) => setLargeText(event.target.checked)}
          />
          Texto maior
        </label>
      </section>
      <section className="settings-card">
        <div>
          <strong>Dados neste dispositivo</strong>
          <p>Favoritos e histórico ficam salvos apenas neste navegador.</p>
        </div>
        <div className="local-stats">
          <span>{favorites} favoritos</span>
          <span>{history} recentes</span>
        </div>
      </section>
      <section className="settings-card data-actions">
        <div>
          <strong>Backup das preferências</strong>
          <p>
            Exporte ou importe favoritos, histórico e aparência em um arquivo
            JSON.
          </p>
        </div>
        <div className="settings-buttons">
          <button className="text-button" onClick={exportSettings}>
            Exportar favoritos e recentes
          </button>
          <label className="text-button import-label">
            Importar backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importSettings(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          <button
            className="text-button danger-button"
            onClick={clearLocalData}
          >
            Apagar dados locais
          </button>
        </div>
      </section>
    </div>
  );
}
function ToolPage({
  favorites,
  onFavorite,
}: {
  favorites: string[];
  onFavorite: (id: string) => void;
}) {
  const location = useLocation();
  const parts = location.pathname.split("/");
  const slug = parts[parts.length - 1];
  const tool = tools.find((item) => item.path.endsWith(`/${slug}`));
  if (!tool) return <NotFound />;
  const pairedToolIds: Record<string, string[]> = {
    "conversor-unidades": ["conversores"],
    conversores: ["conversor-unidades"],
    "pesquisador-cis": ["pesquisador-componentes", "buscador-esquemas"],
    "pesquisador-componentes": ["pesquisador-cis", "buscador-esquemas"],
    "buscador-esquemas": ["pesquisador-cis", "pesquisador-componentes"],
  };
  const relatedCandidates = tools.filter(
    (candidate) =>
      candidate.id !== tool.id &&
      (candidate.category === tool.category ||
        pairedToolIds[tool.id]?.includes(candidate.id)),
  );
  const related = relatedCandidates
    .map((candidate) => ({
      candidate,
      score:
        (pairedToolIds[tool.id]?.includes(candidate.id) ? 10 : 0) +
        candidate.keywords.filter((keyword) => tool.keywords.includes(keyword))
          .length +
        (candidate.synonyms ?? []).filter((word) =>
          tool.synonyms?.includes(word),
        ).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ candidate }) => candidate);
  const webSlug = ["paleta-cores", "gradientes", "sombras-css"].includes(
    slug ?? "",
  )
    ? (slug as "paleta-cores" | "gradientes" | "sombras-css")
    : null;
  const toolContent = webSlug ? (
    <WebTool slug={webSlug} />
  ) : (
    (() => {
      switch (slug) {
        case "conversor-cores":
          return <ColorConverter />;
        case "contraste":
          return <ContrastChecker />;
        case "extrator-cores":
          return <ImageColorExtractor />;
        case "gerador-botoes":
          return <ButtonGenerator />;
        case "bordas-css":
          return <BorderGenerator />;
        case "unidades-css":
          return <CssUnitConverter />;
        case "kit-dev-web":
          return (
            <Suspense
              fallback={
                <div className="content">
                  <div className="coming-panel">Carregando Kit Web…</div>
                </div>
              }
            >
              <WebDevKit />
            </Suspense>
          );
        case "formatadores-codigo":
          return <Suspense fallback={<div className="coming-panel">Carregando formatador…</div>}><WebDevKit initialTab="format" /></Suspense>;
        case "regex-tester":
          return <Suspense fallback={<div className="coming-panel">Carregando testador de regex…</div>}><WebDevKit initialTab="regex" /></Suspense>;
        case "snippet-library":
        case "json-codegen":
        case "curl-converter":
        case "string-escape":
        case "case-converter":
        case "date-format":
        case "json-yaml-sql":
        case "cron-generator":
        case "code-templates":
        case "crc-tools":
        case "float-uart":
          return <Suspense fallback={<div className="coming-panel">Carregando ferramenta…</div>}><ProgrammingSuite tool={slug as "snippet-library" | "json-codegen" | "curl-converter" | "string-escape" | "case-converter" | "date-format" | "json-yaml-sql" | "cron-generator" | "code-templates" | "crc-tools" | "float-uart"}/></Suspense>;
        case "json":
          return <JsonFormatter />;
        case "base64":
          return <Base64Tool />;
        case "uuid":
          return <UuidGenerator />;
        case "playground":
          return <HtmlPlayground />;
        case "url-codec":
        case "json-typescript":
        case "jwt-decoder":
        case "bases-numericas":
        case "contador-texto":
        case "hash":
        case "gerador-senhas":
        case "forca-senha":
        case "analisador-url":
        case "gerador-token":
        case "dados-ficticios":
        case "ascii":
        case "lorem-ipsum":
        case "markdown":
          return (
            <Suspense
              fallback={
                <div className="content">
                  <div className="coming-panel">
                    Carregando ferramentas de programação…
                  </div>
                </div>
              }
            >
              <CodeDataTool slug={slug} />
            </Suspense>
          );
        case "lei-de-ohm":
        case "resistores":
        case "resistor-led":
        case "potencia-consumo":
        case "pesquisador-cis":
        case "buscador-esquemas":
        case "registro-bancada":
        case "pesquisador-componentes":
        case "calculadora-smd":
        case "mapa-placa":
        case "diagnostico-guiado":
        case "orcamento-reparo":
        case "divisor-tensao":
        case "codigo-cores-resistor":
        case "capacitores-equivalentes":
        case "filtro-rc":
        case "timer-555":
        case "regulador-lm317":
        case "tabela-awg":
        case "pinouts":
        case "prefixos-si":
          return <ElectronicsTool slug={slug} />;
        case "calculadora-porcentagem":
        case "porcentagem-reversa":
        case "regra-de-tres":
        case "imc":
        case "conversor-unidades":
        case "media-numerica":
        case "divisor-conta":
        case "diferenca-datas":
        case "calculadora-subredes":
        case "tempo-transferencia":
        case "armazenamento-video":
        case "timestamp-converter":
        case "cpf-cnpj":
          return <UtilitiesTool slug={slug} />;
        case "qr-code":
        case "status-conexao":
          return (
            <Suspense
              fallback={
                <div className="content">
                  <div className="coming-panel">
                    Carregando ferramentas de rede…
                  </div>
                </div>
              }
            >
              <NetworkTool slug={slug} />
            </Suspense>
          );
        case "visualizador-midia":
          return (
            <Suspense
              fallback={
                <div className="content">
                  <div className="coming-panel">
                    Carregando visualizador de mídia…
                  </div>
                </div>
              }
            >
              <MediaTool />
            </Suspense>
          );
        case "pomodoro":
        case "lista-tarefas":
        case "cartoes-estudo":
          return (
            <Suspense
              fallback={
                <div className="content">
                  <div className="coming-panel">
                    Carregando ferramentas de produtividade…
                  </div>
                </div>
              }
            >
              <ProductivityTool slug={slug} />
            </Suspense>
          );
        case "compressor":
        case "conversor-imagens":
        case "recortar-imagem":
        case "remover-metadados":
        case "conversor-imagens-lote":
        case "pdf-tools":
        case "compressor-pdf":
        case "imagens-para-pdf":
        case "csv-json":
        case "conversores":
        case "comparador-textos":
        case "identificador-arquivos":
        case "tamanho-arquivos":
          return (
            <Suspense
              fallback={
                <div className="content">
                  <div className="coming-panel">
                    Carregando ferramentas de arquivos…
                  </div>
                </div>
              }
            >
              <FilesTool slug={slug} />
            </Suspense>
          );
        default:
          return null;
      }
    })()
  );
  return (
    <div className="content">
      <Link
        className="back-link"
        to={`/categoria/${encodeURIComponent(tool.category)}`}
      >
        <ArrowLeft size={15} /> Voltar a {tool.category}
      </Link>
      <PageHeading
        eyebrow={tool.category.toUpperCase()}
        title={tool.name}
        subtitle={tool.description}
        action={
          <button
            className={`outline-button ${favorites.includes(tool.id) ? "is-favorite" : ""}`}
            onClick={() => onFavorite(tool.id)}
          >
            <Heart size={16} />{" "}
            {favorites.includes(tool.id) ? "Favorito" : "Favoritar"}
          </button>
        }
      />
      {toolContent ? (
        toolContent
      ) : (
        <div className="coming-panel">
          <span className="coming-icon">
            <tool.icon size={23} />
          </span>
          <p className="eyebrow">EM DESENVOLVIMENTO</p>
          <h2>Esta ferramenta está chegando.</h2>
          <p>
            O catálogo já está preparado. A funcionalidade será adicionada em
            uma próxima etapa do projeto.
          </p>
          <Link className="hero-link" to="/">
            Voltar ao início <ArrowRight size={16} />
          </Link>
        </div>
      )}
      {related.length > 0 && (
        <section className="related-tools">
          <PageHeading
            eyebrow="CONTINUE EXPLORANDO"
            title="Ferramentas relacionadas"
            subtitle="Acesse recursos parecidos e ferramentas complementares."
          />
          <ToolGrid
            items={related}
            favorites={favorites}
            onFavorite={onFavorite}
          />
        </section>
      )}
    </div>
  );
}
function NotFound() {
  return (
    <div className="content">
      <PageHeading
        eyebrow="404"
        title="Essa página não está por aqui"
        subtitle="Volte ao início para explorar o catálogo de ferramentas."
      />
      <Link to="/" className="primary-button">
        Ir para o início <ArrowRight size={16} />
      </Link>
    </div>
  );
}
