import { describe, expect, it } from "vitest";
import {
  lerId,
  TAMANHO_MAXIMO_TITULO,
  validarAlteracao,
  validarNovaTarefa,
} from "../../src/tarefas/validacao.js";

describe("validarNovaTarefa", () => {
  it("aceita título e descrição e remove espaços das pontas", () => {
    const r = validarNovaTarefa({ titulo: "  Estudar CI  ", descricao: " GitHub Actions " });
    expect(r).toEqual({ ok: true, valor: { titulo: "Estudar CI", descricao: "GitHub Actions" } });
  });

  it("descrição ausente ou vazia vira null", () => {
    expect(validarNovaTarefa({ titulo: "A" })).toEqual({
      ok: true,
      valor: { titulo: "A", descricao: null },
    });
    expect(validarNovaTarefa({ titulo: "A", descricao: "   " })).toEqual({
      ok: true,
      valor: { titulo: "A", descricao: null },
    });
  });

  it.each([undefined, null, "", "   ", 123, {}, []])("rejeita título inválido: %j", (titulo) => {
    expect(validarNovaTarefa({ titulo }).ok).toBe(false);
  });

  it("respeita o tamanho máximo do título", () => {
    expect(validarNovaTarefa({ titulo: "a".repeat(TAMANHO_MAXIMO_TITULO) }).ok).toBe(true);
    expect(validarNovaTarefa({ titulo: "a".repeat(TAMANHO_MAXIMO_TITULO + 1) }).ok).toBe(false);
  });

  it.each([null, undefined, "texto", 42, ["titulo"]])("rejeita corpo que não é objeto: %j", (c) => {
    expect(validarNovaTarefa(c).ok).toBe(false);
  });

  it("rejeita descrição que não é texto", () => {
    expect(validarNovaTarefa({ titulo: "A", descricao: 10 }).ok).toBe(false);
  });
});

describe("validarAlteracao", () => {
  it("aceita alterar só o campo concluida", () => {
    expect(validarAlteracao({ concluida: true })).toEqual({ ok: true, valor: { concluida: true } });
  });

  it("permite limpar a descrição com null", () => {
    expect(validarAlteracao({ descricao: null })).toEqual({ ok: true, valor: { descricao: null } });
  });

  it("rejeita corpo sem nenhum campo alterável", () => {
    expect(validarAlteracao({}).ok).toBe(false);
    expect(validarAlteracao({ id: 5 }).ok).toBe(false);
  });

  it("rejeita concluida que não é booleano", () => {
    expect(validarAlteracao({ concluida: "sim" }).ok).toBe(false);
  });

  it("rejeita título vazio", () => {
    expect(validarAlteracao({ titulo: "" }).ok).toBe(false);
  });
});

describe("lerId", () => {
  it("aceita inteiro positivo", () => {
    expect(lerId("1")).toBe(1);
    expect(lerId("42")).toBe(42);
  });

  it.each(["0", "-1", "1.5", "abc", "1; DROP TABLE tarefas", "", "9999999999", undefined])(
    "rejeita %j",
    (texto) => {
      expect(lerId(texto)).toBeNull();
    },
  );
});
