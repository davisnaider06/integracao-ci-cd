import express, { type ErrorRequestHandler, type Express } from "express";
import type pg from "pg";
import { RepositorioTarefas } from "./tarefas/repositorio.js";
import { lerId, validarAlteracao, validarNovaTarefa } from "./tarefas/validacao.js";

/** Monta a aplicação Express. Recebe o pool para poder ser testada com um banco de teste. */
export function criarApp(pool: pg.Pool): Express {
  const app = express();
  const tarefas = new RepositorioTarefas(pool);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  app.get("/health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  });

  app.get("/tarefas", async (_req, res) => {
    res.json(await tarefas.listar());
  });

  app.get("/tarefas/:id", async (req, res) => {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ erros: ["id inválido."] });
    const tarefa = await tarefas.buscar(id);
    if (!tarefa) return res.status(404).json({ erros: ["Tarefa não encontrada."] });
    res.json(tarefa);
  });

  app.post("/tarefas", async (req, res) => {
    const validacao = validarNovaTarefa(req.body);
    if (!validacao.ok) return res.status(400).json({ erros: validacao.erros });
    res.status(201).json(await tarefas.criar(validacao.valor));
  });

  app.patch("/tarefas/:id", async (req, res) => {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ erros: ["id inválido."] });
    const validacao = validarAlteracao(req.body);
    if (!validacao.ok) return res.status(400).json({ erros: validacao.erros });
    const tarefa = await tarefas.alterar(id, validacao.valor);
    if (!tarefa) return res.status(404).json({ erros: ["Tarefa não encontrada."] });
    res.json(tarefa);
  });

  app.delete("/tarefas/:id", async (req, res) => {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ erros: ["id inválido."] });
    const excluiu = await tarefas.excluir(id);
    if (!excluiu) return res.status(404).json({ erros: ["Tarefa não encontrada."] });
    res.status(204).end();
  });

  app.use((_req, res) => {
    res.status(404).json({ erros: ["Rota não encontrada."] });
  });

  // JSON malformado vira 400; qualquer outro erro vira 500 sem expor detalhes internos.
  const tratarErro: ErrorRequestHandler = (erro, _req, res, _next) => {
    const status = typeof erro?.status === "number" && erro.status < 500 ? erro.status : 500;
    if (status === 500) console.error(erro);
    res.status(status).json({
      erros: [status === 500 ? "Erro interno do servidor." : "Requisição inválida."],
    });
  };
  app.use(tratarErro);

  return app;
}
