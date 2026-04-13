# Integração contínua com GitHub Actions

Este projeto é usado como base prática para uma aula sobre integração contínua com GitHub Actions.

O foco principal não está na aplicação em si, mas em como os arquivos `*.yml` dentro de `.github/workflows/` definem pipelines automatizados de validação.

## Objetivo da aula

Ao estudar este repositório, a ideia é entender:

- onde os workflows do GitHub Actions ficam no projeto;
- como cada arquivo `*.yml` representa um workflow independente;
- quais eventos disparam cada workflow;
- como um job pode rodar diretamente no runner do GitHub;
- como um job pode rodar dentro de um container;
- como acompanhar a execução pela aba `Actions` do GitHub.

## Onde estão os workflows

Os workflows deste projeto ficam em:

- `.github/workflows/ci-runner.yml`
- `.github/workflows/ci-container.yml`

Cada um desses arquivos é lido automaticamente pelo GitHub Actions quando o repositório recebe eventos compatíveis com o bloco `on:`.

## Como o GitHub executa arquivos `*.yml`

O GitHub Actions não executa "qualquer YAML" do repositório. Ele observa especificamente os arquivos salvos em `.github/workflows/`.

O funcionamento geral é este:

1. Um evento acontece no repositório, como `push`, `pull_request` ou `workflow_dispatch`.
2. O GitHub verifica quais arquivos `.github/workflows/*.yml` respondem a esse evento.
3. Cada arquivo compatível gera uma execução própria.
4. Dentro do workflow, os `jobs` são iniciados.
5. Cada job executa seus `steps` em sequência.

Em outras palavras: dois arquivos `.yml` com gatilhos diferentes podem coexistir sem problema, e cada um representa um pipeline distinto.

## Workflow 1: `ci-runner.yml`

Arquivo:

- `.github/workflows/ci-runner.yml`

Finalidade:

- executar a integração contínua diretamente no ambiente padrão fornecido pelo GitHub (`ubuntu-latest`);
- validar automaticamente o projeto em `push` e `pull_request` para a branch `main`.

Gatilhos atuais:

- `push` em `main`
- `pull_request` para `main`

Estratégia de execução:

- o job usa `runs-on: ubuntu-latest`;
- o Node.js é configurado com `actions/setup-node`;
- o cache de dependências do `npm` é habilitado;
- os comandos do projeto são executados diretamente no runner.

Fluxo executado:

1. `actions/checkout` baixa o código do repositório.
2. `actions/setup-node` configura o Node.js 22.
3. `npm ci` instala as dependências.
4. `npm run lint` valida o código.
5. `npm run build` gera o build.
6. `npm run test:cov -- --runInBand` executa os testes com cobertura.
7. `actions/upload-artifact` publica a pasta `coverage` como artefato.

## Workflow 2: `ci-container.yml`

Arquivo:

- `.github/workflows/ci-container.yml`

Finalidade:

- demonstrar a mesma pipeline rodando dentro de um container, e não diretamente no ambiente do runner;
- permitir execução manual para comparação didática com o workflow anterior.

Gatilho atual:

- `workflow_dispatch`

Estratégia de execução:

- o job continua usando `ubuntu-latest` como host do runner;
- porém os comandos do job são executados dentro do container `node:22-bookworm`;
- isso permite mostrar a diferença entre "rodar no runner" e "rodar em um container no runner".

Fluxo executado:

1. `actions/checkout` baixa o código.
2. O job exibe as versões de `node` e `npm`.
3. `npm ci` instala as dependências dentro do container.
4. `npm run lint` executa a análise estática.
5. `npm run build` gera o build.
6. `npm run test:cov -- --runInBand` roda os testes com cobertura.
7. `actions/upload-artifact` envia a pasta `coverage` como artefato.

## Diferença entre runner e container

### `ci-runner.yml`

- executa os comandos diretamente na máquina virtual do GitHub;
- precisa configurar o Node.js com `actions/setup-node`;
- representa o cenário mais comum de CI para projetos Node.js.

### `ci-container.yml`

- executa os comandos dentro de uma imagem Docker;
- o ambiente já nasce com o Node presente na imagem escolhida;
- é útil para demonstrar padronização de ambiente e isolamento.

## Estrutura básica de um workflow

Nos dois arquivos, a estrutura principal é a mesma:

```yml
name: Nome do workflow

on:
  evento:

jobs:
  nome-do-job:
    runs-on: ubuntu-latest
    steps:
      - name: Etapa
        run: comando
```

Os blocos mais importantes para a aula são:

- `name`: nome exibido na aba Actions;
- `on`: define quando o workflow será disparado;
- `jobs`: agrupa as tarefas executadas;
- `runs-on`: define o ambiente do runner;
- `container`: opcional, define uma imagem Docker para o job;
- `steps`: lista de etapas executadas na ordem definida;
- `uses`: reaproveita actions prontas;
- `run`: executa comandos shell.

## Como testar na prática

### Teste automático do workflow do runner

Faça uma alteração no projeto e envie para a branch `main`, ou abra um pull request para `main`.

Esse evento deve disparar automaticamente o workflow:

- `CI Runner`

### Teste manual do workflow em container

Na interface do GitHub:

1. abra a aba `Actions`;
2. selecione o workflow `CI Container`;
3. clique em `Run workflow`;
4. escolha a branch desejada;
5. confirme a execução.

## Como observar a execução

Na aba `Actions`, o aluno pode analisar:

- qual workflow foi executado;
- qual evento disparou a execução;
- quanto tempo cada job levou;
- quais steps passaram ou falharam;
- logs de cada etapa;
- artefatos gerados ao final da execução.

## Artefatos gerados

Os workflows fazem upload da pasta `coverage` ao final da execução.

Isso permite demonstrar que o pipeline não apenas valida o código, mas também publica arquivos úteis gerados durante a CI.

Artefatos atuais:

- `coverage-report` no workflow do runner;
- `coverage-report-container` no workflow em container.

## Scripts usados pela CI

Os workflows usam estes comandos definidos no `package.json`:

- `npm run lint`
- `npm run build`
- `npm run test:cov`

Esses scripts são a ponte entre a automação do GitHub Actions e o projeto Node/NestJS.

## Resumo didático

Este repositório permite demonstrar três ideias centrais:

1. um arquivo `.github/workflows/*.yml` define um workflow do GitHub Actions;
2. workflows diferentes podem ser disparados de formas diferentes;
3. o mesmo processo de CI pode rodar tanto no runner quanto dentro de um container.
