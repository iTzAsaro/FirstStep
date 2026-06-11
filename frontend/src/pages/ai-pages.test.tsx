import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatPage } from "@/pages/chat";
import { InterviewPage } from "@/pages/interview";
import { OllamaError } from "@/shared/api/ollama/client";

const hasModelMock = vi.fn();
const listModelsMock = vi.fn();
const streamChatMock = vi.fn();

const getActiveSessionMock = vi.fn();
const setActiveSessionMock = vi.fn();
const createSessionMock = vi.fn();
const upsertSessionMock = vi.fn();
const resetSessionMessagesMock = vi.fn();
const deleteSessionMock = vi.fn();

let sessionsByKindMock = { general: [] as any[], interview: [] as any[] };

vi.mock("@/shared/api/ollama/client", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api/ollama/client")>("@/shared/api/ollama/client");
  return {
    ...actual,
    createOllamaClient: () => ({
      hasModel: hasModelMock,
      listModels: listModelsMock,
      streamChat: streamChatMock,
    }),
  };
});

vi.mock("@/entities/ollama-session", async () => {
  const actual = await vi.importActual<typeof import("@/entities/ollama-session")>("@/entities/ollama-session");
  return {
    ...actual,
    useOllamaSessions: () => ({
      sessionsByKind: sessionsByKindMock,
      getActiveSession: getActiveSessionMock,
      setActiveSession: setActiveSessionMock,
      createSession: createSessionMock,
      upsertSession: upsertSessionMock,
      resetSessionMessages: resetSessionMessagesMock,
      deleteSession: deleteSessionMock,
    }),
  };
});

function renderPage(ui: ReactNode) {
  return render(
    <MemoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {ui}
    </MemoryRouter>,
  );
}

describe("ai pages", () => {
  beforeEach(() => {
    hasModelMock.mockReset();
    listModelsMock.mockReset();
    streamChatMock.mockReset();
    getActiveSessionMock.mockReset();
    setActiveSessionMock.mockReset();
    createSessionMock.mockReset();
    upsertSessionMock.mockReset();
    resetSessionMessagesMock.mockReset();
    deleteSessionMock.mockReset();
    sessionsByKindMock = { general: [], interview: [] };
  });

  it("renders chat error state and session actions", async () => {
    const user = userEvent.setup();
    const generalSession = {
      id: "g1",
      kind: "general" as const,
      title: "Consulta inicial",
      model: "llama3.1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [{ role: "user" as const, content: "Hola" }],
    };
    sessionsByKindMock.general = [generalSession];
    getActiveSessionMock.mockReturnValue(generalSession);
    hasModelMock.mockRejectedValue(new Error("offline"));
    createSessionMock.mockReturnValue({
      id: "g2",
      kind: "general",
      title: "Nueva conversación",
      model: "llama3.1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    });

    renderPage(<ChatPage />);

    expect((await screen.findAllByText(/sin conexión/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/offline/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /sesiones/i }));
    await user.click(screen.getAllByRole("button", { name: /nuevo/i })[0]);
    expect(createSessionMock).toHaveBeenCalled();
    expect(setActiveSessionMock).toHaveBeenCalledWith("general", "g2");

    await user.click(screen.getByRole("button", { name: /reiniciar/i }));
    expect(resetSessionMessagesMock).toHaveBeenCalledWith("g1", []);

    await user.click(screen.getAllByTitle(/eliminar/i)[0]);
    expect(deleteSessionMock).toHaveBeenCalledWith("g1");
  });

  it("sends a chat message and stores the streamed answer", async () => {
    const user = userEvent.setup();
    const generalSession = {
      id: "g1",
      kind: "general" as const,
      title: "Nueva conversación",
      model: "llama3.1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    sessionsByKindMock.general = [generalSession];
    getActiveSessionMock.mockReturnValue(generalSession);
    hasModelMock.mockResolvedValue(true);
    streamChatMock.mockImplementation(async ({ onToken }: { onToken: (token: string) => void }) => {
      onToken("Hola ");
      onToken("mundo");
    });

    renderPage(<ChatPage />);
    await waitFor(() => {
      expect(hasModelMock).toHaveBeenCalled();
    });

    await user.type(screen.getByPlaceholderText(/escribe tu mensaje/i), "Necesito ayuda");
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => {
      expect(streamChatMock).toHaveBeenCalled();
      expect(upsertSessionMock).toHaveBeenCalled();
    });
  });

  it("renders interview status and starts an interview", async () => {
    const user = userEvent.setup();
    listModelsMock.mockResolvedValue([{ name: "llama3.1:latest" }, { name: "mistral:latest" }]);
    getActiveSessionMock.mockReturnValue(null);
    createSessionMock.mockReturnValue({
      id: "i1",
      kind: "interview",
      title: "Desarrollador Full Stack · mixta · mid",
      model: "llama3.1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [{ role: "system", content: "system" }],
      interviewSettings: {
        role: "Desarrollador Full Stack",
        interviewType: "mixta",
        difficulty: "mid",
      },
    });
    streamChatMock.mockImplementation(async ({ onToken }: { onToken: (token: string) => void }) => {
      onToken("Primera pregunta");
    });

    renderPage(<InterviewPage />);

    expect(await screen.findByText(/llama3\.1/i)).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText(/desarrollador full stack/i));
    await user.type(screen.getByPlaceholderText(/desarrollador full stack/i), "Frontend Engineer");
    await user.click(screen.getByRole("button", { name: /iniciar entrevista/i }));

    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalled();
      expect(streamChatMock).toHaveBeenCalled();
      expect(upsertSessionMock).toHaveBeenCalled();
    });
  });

  it("handles interview retry and send answer error", async () => {
    const user = userEvent.setup();
    const interviewSession = {
      id: "i1",
      kind: "interview" as const,
      title: "Entrevista actual",
      model: "llama3.1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        { role: "system" as const, content: "system" },
        { role: "assistant" as const, content: "Pregunta 1" },
      ],
      interviewSettings: {
        role: "Frontend",
        interviewType: "mixta" as const,
        difficulty: "mid" as const,
      },
    };
    sessionsByKindMock.interview = [interviewSession];
    getActiveSessionMock.mockReturnValue(interviewSession);
    listModelsMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce([{ name: "llama3.1:latest" }]);
    streamChatMock.mockRejectedValue(new OllamaError("model", "modelo roto"));

    renderPage(<InterviewPage />);

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(listModelsMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/disponible/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/escribe tu respuesta/i), "Mi respuesta");
    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(await screen.findByText(/modelo roto/i)).toBeInTheDocument();
  });
});
