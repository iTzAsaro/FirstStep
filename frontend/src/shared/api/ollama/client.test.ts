import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOllamaClient, OllamaError } from "./client";

function response(body: unknown, init?: Partial<Response>) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
    body: init?.body,
  } as Response;
}

function streamFromLines(lines: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(line));
      controller.close();
    },
  });
}

describe("ollama client", () => {
  beforeEach(() => {
    vi.mocked(globalThis.fetch).mockReset();
  });

  it("lists models and checks availability", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      response({
        models: [{ name: "llama3.1:latest" }, { name: "mistral:latest" }],
      }),
    );

    const client = createOllamaClient();
    await expect(client.listModels()).resolves.toEqual([
      { name: "llama3.1:latest" },
      { name: "mistral:latest" },
    ]);
    await expect(client.hasModel("llama3.1")).resolves.toBe(true);
  });

  it("throws network and http errors for tags", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("offline"));
    const client = createOllamaClient({ baseUrl: "http://ollama.local/" });
    await expect(client.listModels()).rejects.toThrow(/no se pudo conectar con ollama/i);

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(response({}, { ok: false, status: 503 }));
    await expect(client.listModels()).rejects.toThrow(/http 503/i);
  });

  it("streams chat tokens and triggers onDone", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      response(
        {},
        {
          body: streamFromLines([
            JSON.stringify({ message: { content: "Hola " } }) + "\n",
            JSON.stringify({ message: { content: "mundo" }, done: true }) + "\n",
          ]),
        },
      ),
    );

    const tokens: string[] = [];
    const onDone = vi.fn();
    const client = createOllamaClient();
    await client.streamChat({
      model: "llama3.1",
      messages: [{ role: "user", content: "Hi" }],
      onToken: (token) => tokens.push(token),
      onDone,
    });

    expect(tokens.join("")).toBe("Hola mundo");
    expect(onDone).toHaveBeenCalled();
  });

  it("throws model and protocol errors for bad streams", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      response(
        {},
        {
          body: streamFromLines([JSON.stringify({ error: "modelo roto" }) + "\n"]),
        },
      ),
    );
    const client = createOllamaClient();
    await expect(
      client.streamChat({
        model: "llama3.1",
        messages: [],
        onToken: vi.fn(),
      }),
    ).rejects.toThrow(/modelo roto/i);

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      response(
        {},
        {
          body: streamFromLines(["not-json\n"]),
        },
      ),
    );
    await expect(
      client.streamChat({
        model: "llama3.1",
        messages: [],
        onToken: vi.fn(),
      }),
    ).rejects.toBeInstanceOf(OllamaError);
  });
});

