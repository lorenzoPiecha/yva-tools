export type GitWorkflow = "first-push" | "update" | "clone" | "branch" | "sync";
export type GitGuideOptions = {
  owner: string;
  repository: string;
  branch: string;
  message: string;
};
export type GitGuideStep = { title: string; explanation: string; command: string };

function safePart(value: string, label: string) {
  const clean = value.trim();
  if (!/^[A-Za-z0-9_.-]+$/.test(clean)) {
    throw new Error(`${label}: use apenas letras, números, ponto, hífen ou sublinhado.`);
  }
  return clean;
}

function quotePowerShell(value: string) {
  return `'${value.split("'").join("''")}'`;
}

export function buildGitWorkflow(
  workflow: GitWorkflow,
  options: GitGuideOptions,
): GitGuideStep[] {
  const owner = safePart(options.owner, "Usuário ou organização do GitHub");
  const repository = safePart(options.repository, "Nome do repositório");
  const branch = safePart(options.branch, "Nome da branch");
  const message = options.message.trim();
  if (!message || message.length > 120) {
    throw new Error("A mensagem do commit precisa ter entre 1 e 120 caracteres.");
  }
  const remote = `https://github.com/${owner}/${repository}.git`;
  const commit = `git commit -m ${quotePowerShell(message)}`;

  switch (workflow) {
    case "first-push":
      return [
        { title: "Iniciar o controle de versão", explanation: "Faça isso uma vez na pasta do projeto.", command: "git init" },
        { title: "Preparar os arquivos", explanation: "Marca os arquivos que entrarão no próximo registro.", command: "git add ." },
        { title: "Conferir o que será enviado", explanation: "Revise a lista; arquivos .env e senhas não devem ser publicados.", command: "git status" },
        { title: "Criar o primeiro commit", explanation: "Salva uma versão local do projeto.", command: commit },
        { title: "Usar a branch principal main", explanation: "Padroniza o nome da branch principal.", command: "git branch -M main" },
        { title: "Conectar ao repositório do GitHub", explanation: "Crie antes um repositório vazio no GitHub.", command: `git remote add origin ${remote}` },
        { title: "Enviar para o GitHub", explanation: "Publica a branch main e configura o envio futuro.", command: "git push -u origin main" },
      ];
    case "update":
      return [
        { title: "Verificar alterações", explanation: "Mostra arquivos novos e modificados.", command: "git status" },
        { title: "Preparar as alterações", explanation: "Adiciona as mudanças para o commit.", command: "git add ." },
        { title: "Conferir novamente", explanation: "Confirme que só os arquivos desejados serão incluídos.", command: "git status" },
        { title: "Registrar a atualização", explanation: "Use uma mensagem curta que explique a mudança.", command: commit },
        { title: "Enviar a atualização", explanation: "Atualiza a branch atual no GitHub.", command: "git push" },
      ];
    case "clone":
      return [
        { title: "Baixar o projeto", explanation: "Cria uma cópia do repositório na pasta atual.", command: `git clone ${remote}` },
        { title: "Entrar na pasta do projeto", explanation: "Use o nome do repositório como pasta.", command: `Set-Location ${quotePowerShell(repository)}` },
      ];
    case "branch":
      return [
        { title: "Criar uma branch para a tarefa", explanation: "Trabalhe isolado sem mexer diretamente na main.", command: `git switch -c ${branch}` },
        { title: "Conferir as alterações", explanation: "Revise antes de registrar.", command: "git status" },
        { title: "Preparar e registrar", explanation: "Inclui e salva as alterações locais.", command: "git add ." },
        { title: "Criar commit", explanation: "Registra o trabalho nessa branch.", command: commit },
        { title: "Enviar a branch", explanation: "Depois, abra um Pull Request pelo site do GitHub.", command: `git push -u origin ${branch}` },
      ];
    case "sync":
      return [
        { title: "Verificar mudanças locais", explanation: "Se houver trabalho sem commit, salve antes de atualizar.", command: "git status" },
        { title: "Baixar e integrar as atualizações", explanation: "Atualiza sua branch atual com o repositório remoto.", command: "git pull" },
      ];
  }
}
