import { criarApp } from "./app.js";
import { criarPool } from "./db.js";

const pool = criarPool();
const porta = Number(process.env.PORT ?? 3000);

const servidor = criarApp(pool).listen(porta, () => {
  console.log(`API de tarefas ouvindo na porta ${porta}`);
});

// Encerramento limpo quando o contêiner recebe SIGTERM (docker stop).
process.on("SIGTERM", () => {
  servidor.close(() => {
    void pool.end();
  });
});
