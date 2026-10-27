import { describe, expect, it } from "vitest";
import { buildGitWorkflow } from "./gitGuide";

const options = {
  owner: "lorenzoPiecha",
  repository: "yva-tools",
  branch: "melhoria-menu",
  message: "Adiciona guia GitHub",
};

describe("guia de comandos Git", () => {
  it("monta o primeiro envio em ordem e aponta para o repositório informado", () => {
    const commands = buildGitWorkflow("first-push", options).map((step) => step.command);
    expect(commands).toEqual([
      "git init",
      "git add .",
      "git status",
      "git commit -m 'Adiciona guia GitHub'",
      "git branch -M main",
      "git remote add origin https://github.com/lorenzoPiecha/yva-tools.git",
      "git push -u origin main",
    ]);
  });

  it("fornece a sequência curta para enviar alterações futuras", () => {
    expect(buildGitWorkflow("update", options).map((step) => step.command)).toEqual([
      "git status",
      "git add .",
      "git status",
      "git commit -m 'Adiciona guia GitHub'",
      "git push",
    ]);
  });

  it("escapa aspas simples da mensagem no PowerShell", () => {
    const commands = buildGitWorkflow("update", { ...options, message: "Lorenzo's fix" }).map((step) => step.command);
    expect(commands[3]).toBe("git commit -m 'Lorenzo''s fix'");
  });

  it("rejeita valores que poderiam alterar o comando ou URL", () => {
    expect(() => buildGitWorkflow("first-push", { ...options, owner: "alguem; Remove-Item" })).toThrow(/apenas letras/);
    expect(() => buildGitWorkflow("update", { ...options, message: " " })).toThrow(/mensagem do commit/);
  });
});
