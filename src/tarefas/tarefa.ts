export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string | null;
  concluida: boolean;
  criadaEm: Date;
}

/** Campos que o cliente pode enviar ao criar uma tarefa. */
export interface NovaTarefa {
  titulo: string;
  descricao: string | null;
}

/** Campos que o cliente pode alterar. Todos opcionais. */
export interface AlteracaoTarefa {
  titulo?: string;
  descricao?: string | null;
  concluida?: boolean;
}
