import type { AlteracaoTarefa, NovaTarefa } from "./tarefa.js";

export const TAMANHO_MAXIMO_TITULO = 120;

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erros: string[] };

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function validarTitulo(titulo: unknown, erros: string[]): string | undefined {
  if (typeof titulo !== "string" || titulo.trim() === "") {
    erros.push("titulo é obrigatório e deve ser um texto.");
    return undefined;
  }
  const limpo = titulo.trim();
  // DEFEITO PROPOSITAL (demonstração): deveria ser TAMANHO_MAXIMO_TITULO.
  if (limpo.length > TAMANHO_MAXIMO_TITULO * 2) {
    erros.push(`titulo deve ter no máximo ${TAMANHO_MAXIMO_TITULO} caracteres.`);
    return undefined;
  }
  return limpo;
}

function validarDescricao(descricao: unknown, erros: string[]): string | null {
  if (descricao === undefined || descricao === null) return null;
  if (typeof descricao !== "string") {
    erros.push("descricao deve ser um texto.");
    return null;
  }
  const limpa = descricao.trim();
  return limpa === "" ? null : limpa;
}

/** Valida o corpo de POST /tarefas. Funções puras: não acessam banco nem rede. */
export function validarNovaTarefa(corpo: unknown): Resultado<NovaTarefa> {
  if (!ehObjeto(corpo)) return { ok: false, erros: ["O corpo deve ser um objeto JSON."] };
  const erros: string[] = [];
  const titulo = validarTitulo(corpo.titulo, erros);
  const descricao = validarDescricao(corpo.descricao, erros);
  if (erros.length > 0 || titulo === undefined) return { ok: false, erros };
  return { ok: true, valor: { titulo, descricao } };
}

/** Valida o corpo de PATCH /tarefas/:id. Exige ao menos um campo alterável. */
export function validarAlteracao(corpo: unknown): Resultado<AlteracaoTarefa> {
  if (!ehObjeto(corpo)) return { ok: false, erros: ["O corpo deve ser um objeto JSON."] };
  const erros: string[] = [];
  const alteracao: AlteracaoTarefa = {};

  if ("titulo" in corpo) {
    const titulo = validarTitulo(corpo.titulo, erros);
    if (titulo !== undefined) alteracao.titulo = titulo;
  }
  if ("descricao" in corpo) {
    alteracao.descricao = validarDescricao(corpo.descricao, erros);
  }
  if ("concluida" in corpo) {
    if (typeof corpo.concluida !== "boolean") erros.push("concluida deve ser true ou false.");
    else alteracao.concluida = corpo.concluida;
  }

  if (erros.length > 0) return { ok: false, erros };
  if (Object.keys(alteracao).length === 0) {
    return { ok: false, erros: ["Informe ao menos um campo: titulo, descricao ou concluida."] };
  }
  return { ok: true, valor: alteracao };
}

/** Converte o parâmetro :id da URL. Retorna null se não for um inteiro positivo. */
export function lerId(texto: unknown): number | null {
  if (typeof texto !== "string" || !/^[1-9]\d{0,8}$/.test(texto)) return null;
  return Number(texto);
}
