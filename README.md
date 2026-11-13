# ci-tarefas-api

API REST de tarefas (Node.js, TypeScript, Express e PostgreSQL) usada para demonstrar um
pipeline de integração contínua (CI) com GitHub Actions.

## Endpoints

| Método | Rota           | Descrição                                        |
| ------ | -------------- | ------------------------------------------------ |
| GET    | `/health`      | Verifica a API e a conexão com o banco           |
| GET    | `/tarefas`     | Lista as tarefas                                 |
| GET    | `/tarefas/:id` | Busca uma tarefa                                 |
| POST   | `/tarefas`     | Cria (`{ "titulo": "...", "descricao": "..." }`) |
| PATCH  | `/tarefas/:id` | Altera `titulo`, `descricao` e/ou `concluida`    |
| DELETE | `/tarefas/:id` | Exclui                                           |

## Como executar

Pré-requisitos: Node.js 22 e um PostgreSQL acessível.

```bash
cp .env.example .env          # ajuste a DATABASE_URL
npm ci
npm run build
export $(cat .env | xargs)
npm run migrate               # cria a tabela
npm start
```

Com Docker:

```bash
docker build -t ci-tarefas-api .
docker run -p 3000:3000 -e DATABASE_URL=postgres://usuario:senha@host:5432/tarefas ci-tarefas-api
```

## Verificações

Os mesmos comandos que o CI executa podem ser rodados localmente:

| Comando                    | O que verifica                                            |
| -------------------------- | --------------------------------------------------------- |
| `npm run format:check`     | Formatação (Prettier)                                     |
| `npm run lint`             | Análise estática (ESLint)                                 |
| `npm run typecheck`        | Tipos (TypeScript)                                        |
| `npm run build`            | Compilação                                                |
| `npm run test:unit`        | Testes unitários (regras de validação, sem banco)         |
| `npm run test:integration` | Testes de integração (API + PostgreSQL, usa DATABASE_URL) |

## Estrutura

```
src/
  app.ts                 rotas e tratamento de erros
  server.ts              inicialização
  db.ts                  pool de conexões
  migrate.ts             executa os arquivos de sql/
  tarefas/
    validacao.ts         regras de negócio (funções puras)
    repositorio.ts       SQL parametrizado
sql/                     migrações
tests/unit/              testes unitários
tests/integration/       testes de integração
```

## Pipeline de CI

O workflow `.github/workflows/ci.yml` é disparado a cada Pull Request para a `main`:

1. Análise de formatação (Prettier)
2. Análise estática de código (ESLint + TypeScript)
3. Análise estática de segurança (CodeQL + npm audit)
4. Build
5. Testes unitários
6. Testes de integração (API + PostgreSQL)
7. Criação da imagem Docker

As etapas 1 a 3 rodam em paralelo. Cada etapa seguinte só roda se a anterior passou.
