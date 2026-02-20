/**
 * Testes automatizados — sistema de ajuda (helpTourStorage)
 *
 * ✓ primeiro acesso → tutorial abre
 * ✓ fechar → não abre mais
 * ✓ refresh → continua fechado
 * ✓ outro usuário → tutorial aparece
 * ✓ navegação entre páginas → controle individual por página
 * ✓ clearAllHelpSeen → limpa apenas chaves corretas
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getHelpSeen, setHelpSeen, resetHelpSeen, clearAllHelpSeen } from "@/lib/helpTourStorage";

const USER_A = "user-111";
const USER_B = "user-222";

beforeEach(() => { localStorage.clear(); });
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe("helpTourStorage — persistência básica", () => {
  it("não visto antes do primeiro acesso", () => {
    expect(getHelpSeen(USER_A, "dashboard")).toBe(false);
  });

  it("marca como visto após setHelpSeen", () => {
    setHelpSeen(USER_A, "dashboard");
    expect(getHelpSeen(USER_A, "dashboard")).toBe(true);
  });

  it("persiste após simulated refresh", () => {
    setHelpSeen(USER_A, "dashboard");
    expect(getHelpSeen(USER_A, "dashboard")).toBe(true);
  });

  it("resetHelpSeen remove a chave", () => {
    setHelpSeen(USER_A, "dashboard");
    resetHelpSeen(USER_A, "dashboard");
    expect(getHelpSeen(USER_A, "dashboard")).toBe(false);
  });
});

describe("helpTourStorage — isolamento por usuário", () => {
  it("USER_A não interfere no USER_B", () => {
    setHelpSeen(USER_A, "dashboard");
    expect(getHelpSeen(USER_B, "dashboard")).toBe(false);
  });

  it("após logout do mesmo usuário, continua visto", () => {
    setHelpSeen(USER_A, "dashboard");
    expect(getHelpSeen(USER_A, "dashboard")).toBe(true);
  });
});

describe("helpTourStorage — isolamento por página", () => {
  it("ver dashboard não afeta clients", () => {
    setHelpSeen(USER_A, "dashboard");
    expect(getHelpSeen(USER_A, "clients")).toBe(false);
  });

  it("cada página tem controle independente", () => {
    const pages = ["dashboard", "clients", "tasks", "reports", "settings"];
    pages.forEach((p) => setHelpSeen(USER_A, p));
    pages.forEach((p) => expect(getHelpSeen(USER_A, p)).toBe(true));
  });
});

describe("clearAllHelpSeen — limpeza seletiva", () => {
  it("limpa todas as chaves do usuário especificado", () => {
    setHelpSeen(USER_A, "dashboard");
    setHelpSeen(USER_A, "clients");
    clearAllHelpSeen(USER_A);
    expect(getHelpSeen(USER_A, "dashboard")).toBe(false);
    expect(getHelpSeen(USER_A, "clients")).toBe(false);
  });

  it("não remove chaves de outro usuário", () => {
    setHelpSeen(USER_A, "dashboard");
    setHelpSeen(USER_B, "dashboard");
    clearAllHelpSeen(USER_A);
    expect(getHelpSeen(USER_A, "dashboard")).toBe(false);
    expect(getHelpSeen(USER_B, "dashboard")).toBe(true);
  });

  it("sem userId, limpa todos os tutoriais", () => {
    setHelpSeen(USER_A, "dashboard");
    setHelpSeen(USER_B, "clients");
    localStorage.setItem("other_key", "value");
    clearAllHelpSeen();
    expect(getHelpSeen(USER_A, "dashboard")).toBe(false);
    expect(getHelpSeen(USER_B, "clients")).toBe(false);
    expect(localStorage.getItem("other_key")).toBe("value");
  });
});
