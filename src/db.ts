import pg from "pg";

/** Cria o pool de conexões a partir da variável de ambiente DATABASE_URL. */
export function criarPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("A variável de ambiente DATABASE_URL não foi definida.");
  }
  return new pg.Pool({ connectionString });
}
