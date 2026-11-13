import type pg from "pg";
import type { AlteracaoTarefa, NovaTarefa, Tarefa } from "./tarefa.js";

const COLUNAS = `id, titulo, descricao, concluida, criada_em AS "criadaEm"`;

/**
 * Acesso à tabela tarefas. Todo valor vindo do cliente entra como parâmetro
 * ($1, $2...), nunca concatenado no SQL, o que evita SQL injection.
 */
export class RepositorioTarefas {
  constructor(private readonly pool: pg.Pool) {}

  async listar(): Promise<Tarefa[]> {
    const { rows } = await this.pool.query<Tarefa>(`SELECT ${COLUNAS} FROM tarefas ORDER BY id`);
    return rows;
  }

  async buscar(id: number): Promise<Tarefa | null> {
    const { rows } = await this.pool.query<Tarefa>(`SELECT ${COLUNAS} FROM tarefas WHERE id = $1`, [
      id,
    ]);
    return rows[0] ?? null;
  }

  async criar(nova: NovaTarefa): Promise<Tarefa> {
    const { rows } = await this.pool.query<Tarefa>(
      `INSERT INTO tarefas (titulo, descricao) VALUES ($1, $2) RETURNING ${COLUNAS}`,
      [nova.titulo, nova.descricao],
    );
    return rows[0]!;
  }

  async alterar(id: number, alteracao: AlteracaoTarefa): Promise<Tarefa | null> {
    // COALESCE mantém o valor atual quando o campo não foi enviado.
    // A descrição precisa de um sinalizador próprio porque null é um valor válido para ela.
    const { rows } = await this.pool.query<Tarefa>(
      `UPDATE tarefas
          SET titulo    = COALESCE($2, titulo),
              descricao = CASE WHEN $3 THEN $4 ELSE descricao END,
              concluida = COALESCE($5, concluida)
        WHERE id = $1
    RETURNING ${COLUNAS}`,
      [
        id,
        alteracao.titulo ?? null,
        "descricao" in alteracao,
        alteracao.descricao ?? null,
        alteracao.concluida ?? null,
      ],
    );
    return rows[0] ?? null;
  }

  async excluir(id: number): Promise<boolean> {
    const resultado = await this.pool.query(`DELETE FROM tarefas WHERE id = $1`, [id]);
    return (resultado.rowCount ?? 0) > 0;
  }
}
