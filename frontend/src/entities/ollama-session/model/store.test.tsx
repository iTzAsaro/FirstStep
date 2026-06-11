import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOllamaSessions } from "./store";

describe("useOllamaSessions", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates, activates, updates, resets and deletes sessions", () => {
    const { result } = renderHook(() => useOllamaSessions());

    let createdId = "";
    act(() => {
      const session = result.current.createSession({
        kind: "general",
        title: "Nueva conversación",
        model: "llama3.1",
        messages: [{ role: "user", content: "Hola" }],
      });
      createdId = session.id;
    });

    expect(result.current.sessionsByKind.general).toHaveLength(1);
    expect(result.current.getActiveSession("general")?.id).toBe(createdId);

    act(() => {
      result.current.upsertSession({
        ...result.current.sessionsByKind.general[0],
        title: "Consulta actualizada",
        messages: [
          { role: "user", content: "Hola" },
          { role: "assistant", content: "Respuesta" },
        ],
      });
    });

    expect(result.current.sessionsByKind.general[0]?.title).toBe("Consulta actualizada");

    act(() => {
      result.current.resetSessionMessages(createdId, [{ role: "system", content: "base" }]);
    });
    expect(result.current.sessionsByKind.general[0]?.messages).toEqual([{ role: "system", content: "base" }]);

    act(() => {
      result.current.setActiveSession("general", createdId);
      result.current.deleteSession(createdId);
    });

    expect(result.current.sessionsByKind.general).toHaveLength(0);
    expect(result.current.getActiveSession("general")).toBeNull();
  });

  it("loads persisted state and keeps sessions grouped by kind", () => {
    const persisted = {
      sessions: [
        {
          id: "i1",
          kind: "interview",
          title: "Entrevista",
          model: "llama3.1",
          createdAt: 1,
          updatedAt: 2,
          messages: [{ role: "system", content: "base" }],
          interviewSettings: {
            role: "Frontend",
            interviewType: "mixta",
            difficulty: "mid",
          },
        },
      ],
      activeSessionIdByKind: { interview: "i1" },
    };
    localStorage.setItem("firststep.ollama.sessions.v1", JSON.stringify(persisted));

    const { result } = renderHook(() => useOllamaSessions());

    expect(result.current.sessionsByKind.interview).toHaveLength(1);
    expect(result.current.getActiveSession("interview")?.id).toBe("i1");
    expect(result.current.state.activeSessionIdByKind.interview).toBe("i1");
  });

  it("persists updates to localStorage", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useOllamaSessions());

    act(() => {
      result.current.createSession({
        kind: "general",
        title: "Persistida",
        model: "llama3.1",
      });
    });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

