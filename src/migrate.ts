import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type pg from "pg";
import { criarPool } from "./db.js";

/** Executa, em ordem alfabética, todos os arquivos .sql da pasta informada. */
export async function migrar(pool: pg.Pool, pasta = path.resolve("sql")): Promise<string[]> {
  const arquivos = (await readdir(pasta)).filter((a) => a.endsWith(".sql")).sort();
  for (const arquivo of arquivos) {
    const sql = await readFile(path.join(pasta, arquivo), "utf8");
    await pool.query(sql);
  }
  return arquivos;
}

// Execução direta: `npm run migrate`
if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const pool = criarPool();
  try {
    const arquivos = await migrar(pool);
    console.log(`Migrações aplicadas: ${arquivos.join(", ")}`);
  } finally {
    await pool.end();
  }
}
