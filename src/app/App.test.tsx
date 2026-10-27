import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

function mount(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-large-text");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

describe("Parte 2: busca, favoritos, histórico e preferências", () => {
  it("volta ao topo ao abrir uma ferramenta depois de rolar a página", async () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 640 });
    mount("/ferramentas/editor-imagens");
    await screen.findByRole("heading", { name: "Editor de imagens" });
    expect(scroll).toHaveBeenCalledWith(0, 0);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("abre o guia GitHub e mostra comandos ordenados para enviar atualizações", async () => {
    const user = userEvent.setup();
    mount("/ferramentas/github-commands");
    await screen.findByRole("heading", { name: "Guia de comandos Git e GitHub" });
    await user.selectOptions(await screen.findByLabelText("O que você quer fazer?"), "update");
    expect(screen.getAllByText("git status")).toHaveLength(3);
    expect(screen.getByText("git add .")).toBeTruthy();
    expect(screen.getByText("git push")).toBeTruthy();
  });

  it("abre a busca com Ctrl/⌘+K, encontra sinônimos e navega pelos resultados com o teclado", async () => {
    const user = userEvent.setup();
    mount();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
    );
    const input = screen.getByRole("textbox", { name: "Buscar ferramentas" });
    expect(document.activeElement).toBe(input);
    await user.type(input, "resistor");
    expect(screen.getByRole("option", { name: /Lei de Ohm/ })).toBeTruthy();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Lei de Ohm" })).toBeTruthy();
  });

  it("salva favoritos localmente e mantém a seleção após remontar a aplicação", async () => {
    const user = userEvent.setup();
    const first = mount();
    await user.click(
      screen.getByRole("button", {
        name: "Adicionar Paleta de cores aos favoritos",
      }),
    );
    expect(localStorage.getItem("nexus:favorites")).toBe('["paleta-cores"]');
    first.unmount();
    mount("/favoritos");
    expect(
      screen.getByRole("heading", { name: "Seus favoritos" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /Paleta de cores/ })).toBeTruthy();
  });

  it("registra ferramentas recentes e permite limpar o histórico", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("link", { name: /Paleta de cores/ }));
    expect(JSON.parse(localStorage.getItem("nexus:history") ?? "[]")).toContain(
      "paleta-cores",
    );
    await user.click(screen.getByRole("link", { name: "Recentes" }));
    expect(
      screen.getByRole("heading", { name: "Acessadas recentemente" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Limpar histórico" }));
    expect(localStorage.getItem("nexus:history")).toBe("[]");
    expect(
      screen.getByText("As ferramentas que você abrir aparecerão aqui."),
    ).toBeTruthy();
  });

  it("persiste tema e texto ampliado e pede confirmação antes de apagar dados locais", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const view = mount("/configuracoes");
    await user.click(screen.getByRole("button", { name: /Claro/ }));
    await user.click(screen.getByRole("checkbox", { name: /Texto maior/ }));
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("light"),
    );
    expect(document.documentElement.dataset.largeText).toBe("true");
    expect(JSON.parse(localStorage.getItem("nexus:theme") ?? "null")).toBe(
      "light",
    );
    expect(JSON.parse(localStorage.getItem("nexus:largeText") ?? "false")).toBe(
      true,
    );
    view.unmount();
    mount("/configuracoes");
    expect(
      screen
        .getByRole("checkbox", { name: /Texto maior/ })
        .hasAttribute("checked"),
    ).toBe(true);
    await user.click(
      screen.getByRole("button", { name: "Apagar dados locais" }),
    );
    expect(confirm).toHaveBeenCalledOnce();
    expect(localStorage.getItem("nexus:theme")).toBe('"dark"');
    expect(localStorage.getItem("nexus:largeText")).toBe("false");
  });

  it("exporta e importa um backup validado de preferências", async () => {
    const user = userEvent.setup();
    const createUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test");
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    mount("/configuracoes");
    await user.click(
      screen.getByRole("button", { name: "Exportar favoritos e recentes" }),
    );
    expect(createUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    const backup = new File(
      [
        JSON.stringify({
          version: 1,
          favorites: ["gradientes"],
          history: ["sombras-css"],
          theme: "light",
          largeText: true,
        }),
      ],
      "backup.json",
      { type: "application/json" },
    );
    fireEvent.change(screen.getByLabelText("Importar backup"), {
      target: { files: [backup] },
    });
    await waitFor(() =>
      expect(localStorage.getItem("nexus:favorites")).toBe('["gradientes"]'),
    );
    expect(localStorage.getItem("nexus:history")).toBe('["sombras-css"]');
  });
});
