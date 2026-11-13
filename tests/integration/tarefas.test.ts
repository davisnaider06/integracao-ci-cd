import type { Express } from "express";
import type pg from "pg";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { criarApp } from "../../src/app.js";
import { criarPool } from "../../src/db.js";
import { migrar } from "../../src/migrate.js";

// Testes de integração: API + PostgreSQL de verdade (definido em DATABASE_URL).
let pool: pg.Pool;
let app: Express;

beforeAll(async () => {
  pool = criarPool();
  await migrar(pool);
  app = criarApp(pool);
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE tarefas RESTART IDENTITY");
});

afterAll(async () => {
  await pool.end();
});

describe("API de tarefas", () => {
  it("GET /health confirma a conexão com o banco", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST cria a tarefa e ela fica gravada no banco", async () => {
    const res = await request(app).post("/tarefas").send({ titulo: "Configurar CI" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, titulo: "Configurar CI", concluida: false });

    const { rows } = await pool.query("SELECT titulo FROM tarefas WHERE id = 1");
    expect(rows).toEqual([{ titulo: "Configurar CI" }]);
  });

  it("GET lista as tarefas em ordem de criação", async () => {
    await request(app).post("/tarefas").send({ titulo: "Primeira" });
    await request(app).post("/tarefas").send({ titulo: "Segunda" });
    const res = await request(app).get("/tarefas");
    expect(res.status).toBe(200);
    expect(res.body.map((t: { titulo: string }) => t.titulo)).toEqual(["Primeira", "Segunda"]);
  });

  it("GET /tarefas/:id devolve 404 quando não existe e 400 quando o id é inválido", async () => {
    expect((await request(app).get("/tarefas/999")).status).toBe(404);
    expect((await request(app).get("/tarefas/abc")).status).toBe(400);
  });

  it("PATCH altera só os campos enviados", async () => {
    await request(app).post("/tarefas").send({ titulo: "Estudar", descricao: "Docker" });
    const res = await request(app).patch("/tarefas/1").send({ concluida: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ titulo: "Estudar", descricao: "Docker", concluida: true });
  });

  it("PATCH com descricao null limpa a descrição", async () => {
    await request(app).post("/tarefas").send({ titulo: "Estudar", descricao: "Docker" });
    const res = await request(app).patch("/tarefas/1").send({ descricao: null });
    expect(res.body).toMatchObject({ titulo: "Estudar", descricao: null });
  });

  it("DELETE remove a tarefa e a segunda tentativa devolve 404", async () => {
    await request(app).post("/tarefas").send({ titulo: "Apagar" });
    expect((await request(app).delete("/tarefas/1")).status).toBe(204);
    expect((await request(app).delete("/tarefas/1")).status).toBe(404);
    expect((await pool.query("SELECT COUNT(*)::int AS n FROM tarefas")).rows[0].n).toBe(0);
  });

  it("rejeita dados inválidos com 400 e não grava nada", async () => {
    expect((await request(app).post("/tarefas").send({ titulo: "" })).status).toBe(400);
    expect((await request(app).post("/tarefas").send({})).status).toBe(400);
    const malformado = await request(app)
      .post("/tarefas")
      .set("Content-Type", "application/json")
      .send('{"titulo": ');
    expect(malformado.status).toBe(400);
    expect((await pool.query("SELECT COUNT(*)::int AS n FROM tarefas")).rows[0].n).toBe(0);
  });

  it("tentativa de SQL injection é gravada como texto e a tabela continua existindo", async () => {
    const ataque = "x'); DROP TABLE tarefas; --";
    const res = await request(app).post("/tarefas").send({ titulo: ataque });
    expect(res.status).toBe(201);
    expect((await request(app).get("/tarefas")).body[0].titulo).toBe(ataque);
  });

  it("rota desconhecida devolve 404 em JSON", async () => {
    const res = await request(app).get("/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body.erros).toBeDefined();
  });
});
