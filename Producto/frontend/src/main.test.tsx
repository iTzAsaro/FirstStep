import { beforeEach, describe, expect, it, vi } from "vitest";

const renderMock = vi.fn();
const createRootMock = vi.fn(() => ({ render: renderMock }));

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: createRootMock,
  },
  createRoot: createRootMock,
}));

vi.mock("@/app/App", () => ({
  App: () => null,
}));

describe("main", () => {
  beforeEach(() => {
    renderMock.mockReset();
    createRootMock.mockClear();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("mounts the app into #root", async () => {
    await import("./main");
    expect(createRootMock).toHaveBeenCalledWith(document.getElementById("root"));
    expect(renderMock).toHaveBeenCalled();
  });
});

