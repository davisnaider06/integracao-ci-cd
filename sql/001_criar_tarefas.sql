CREATE TABLE IF NOT EXISTS tarefas (
  id          SERIAL PRIMARY KEY,
  titulo      VARCHAR(120) NOT NULL,
  descricao   TEXT,
  concluida   BOOLEAN NOT NULL DEFAULT FALSE,
  criada_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
