import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { vi } from "vitest";

afterEach(() => {
  cleanup();
});

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => {
      return {
        auth: {
          exchangeCodeForSession: vi.fn(async () => ({ data: null, error: null })),
          getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
          signInWithOAuth: vi.fn(async () => ({ data: null, error: null })),
          signOut: vi.fn(async () => ({ error: null })),
        },
      };
    },
  };
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };
  },
});

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  writable: true,
  value: vi.fn(),
});

globalThis.fetch = vi.fn(async () => {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => "",
  } as Response;
});
