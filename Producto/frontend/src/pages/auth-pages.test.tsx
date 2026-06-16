import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginCompanyPage } from "@/pages/login-company";
import { LoginUserPage } from "@/pages/login-user";
import { SignUpCompanyPage } from "@/pages/signup-company";

const companySignUpMock = vi.fn();
const clearCompanySignUpErrorMock = vi.fn();
const loginTalentPasswordMock = vi.fn();
const loginTalentEmailMock = vi.fn();
const clearTalentErrorMock = vi.fn();
const loginCompanyPasswordMock = vi.fn();
const loginCompanyEmailMock = vi.fn();
const clearCompanyLoginErrorMock = vi.fn();
const sessionLoginCompanyMock = vi.fn();
const navigateMock = vi.fn();
const signInWithOAuthMock = vi.fn(async () => ({ error: null }));
const exchangeCodeForSessionMock = vi.fn(async () => ({ error: null }));
const getSessionMock = vi.fn(async () => ({ data: { session: null }, error: null }));

vi.mock("@/features/auth/login-company/model/useCompanySignUp", () => ({
  useCompanySignUp: () => ({
    signUp: companySignUpMock,
    isLoading: false,
    error: null,
    clearError: clearCompanySignUpErrorMock,
  }),
}));

vi.mock("@/features/auth/login-talent/model/useLoginTalent", () => ({
  useLoginTalent: () => ({
    loginWithEmail: loginTalentEmailMock,
    loginWithPassword: loginTalentPasswordMock,
    isLoading: false,
    error: null,
    clearError: clearTalentErrorMock,
  }),
}));

vi.mock("@/features/auth/login-company/model/useCompanyLogin", () => ({
  useCompanyLogin: () => ({
    loginWithEmail: loginCompanyEmailMock,
    loginWithPassword: loginCompanyPasswordMock,
    isLoading: false,
    error: null,
    clearError: clearCompanyLoginErrorMock,
  }),
}));

vi.mock("@/entities/session", async () => {
  const actual = await vi.importActual<typeof import("@/entities/session")>("@/entities/session");
  return {
    ...actual,
    useSession: () => ({
      loginCompany: sessionLoginCompanyMock,
      companyName: "Acme",
    }),
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: signInWithOAuthMock,
      exchangeCodeForSession: exchangeCodeForSessionMock,
      getSession: getSessionMock,
    },
  }),
}));

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

describe("auth pages", () => {
  beforeEach(() => {
    companySignUpMock.mockReset();
    clearCompanySignUpErrorMock.mockReset();
    loginTalentPasswordMock.mockReset();
    loginTalentEmailMock.mockReset();
    clearTalentErrorMock.mockReset();
    loginCompanyPasswordMock.mockReset();
    loginCompanyEmailMock.mockReset();
    clearCompanyLoginErrorMock.mockReset();
    sessionLoginCompanyMock.mockReset();
    navigateMock.mockReset();
    signInWithOAuthMock.mockReset();
    signInWithOAuthMock.mockResolvedValue({ error: null });
    exchangeCodeForSessionMock.mockReset();
    getSessionMock.mockReset();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("validates and submits company signup", async () => {
    const user = userEvent.setup();
    renderPage(<SignUpCompanyPage />);

    const submitButton = screen.getByRole("button", { name: /crear cuenta de empresa/i });
    fireEvent.submit(submitButton.closest("form")!);
    expect(screen.getByText(/ingresa el nombre de la empresa/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresa un correo válido/i)).toBeInTheDocument();
    expect(screen.getByText(/selecciona el tamaño de la empresa/i)).toBeInTheDocument();
    expect(screen.getByText(/tu contraseña debe cumplir los requisitos/i)).toBeInTheDocument();
    expect(screen.getByText(/debes aceptar los términos y la política/i)).toBeInTheDocument();
    expect(companySignUpMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /términos de servicio/i }));
    expect(screen.getByText(/al crear una cuenta aceptas usar la plataforma/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /entendido/i }));

    await user.click(screen.getByRole("button", { name: /política de privacidad/i }));
    expect(screen.getByText(/guardamos tu email para autenticación/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /entendido/i }));

    await user.type(screen.getByPlaceholderText(/acme tech/i), "  Acme Corp  ");
    await user.type(screen.getByPlaceholderText(/nombre@empresa.com/i), "  corp@example.com  ");
    await user.selectOptions(screen.getByRole("combobox"), "11-50");
    await user.type(screen.getByPlaceholderText(/mín. 8 caracteres/i), "Secret123");
    await user.type(screen.getByPlaceholderText(/repite tu contraseña/i), "Secret123");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /crear cuenta de empresa/i }));

    await waitFor(() => {
      expect(companySignUpMock).toHaveBeenCalledWith({
        companyName: "Acme Corp",
        companySize: "11-50",
        email: "corp@example.com",
        password: "Secret123",
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    });
  });

  it("opens oauth config in company signup and saves values", async () => {
    const user = userEvent.setup();
    renderPage(<SignUpCompanyPage />);

    await user.click(screen.getByRole("button", { name: /google/i }));
    expect(screen.getAllByText(/debes aceptar los términos y la política/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /google/i }));
    expect(screen.getByText(/configurar oauth/i)).toBeInTheDocument();

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "https://demo.supabase.co/rest/v1");
    const keyInput = screen.getByPlaceholderText(/eyjhbgcioijiuzi1ni/i);
    await user.type(keyInput, "anon-key");
    await user.click(screen.getByRole("button", { name: /^guardar$/i }));

    expect(localStorage.getItem("firststep.supabase.url")).toBe("https://demo.supabase.co");
    expect(localStorage.getItem("firststep.supabase.anonKey")).toBe("anon-key");
  });

  it("submits login user form and opens oauth config", async () => {
    const user = userEvent.setup();
    renderPage(<LoginUserPage />);

    await user.type(screen.getByPlaceholderText(/alex@ejemplo.com/i), "talent@example.com");
    await user.type(screen.getByPlaceholderText(/••••••••/i), "Secret123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(clearTalentErrorMock).toHaveBeenCalled();
      expect(loginTalentPasswordMock).toHaveBeenCalledWith({
        email: "talent@example.com",
        password: "Secret123",
      });
    });

    await user.click(screen.getByRole("button", { name: /^google$/i }));
    expect(screen.getByText(/configurar oauth/i)).toBeInTheDocument();

    const urlInput = screen.getByPlaceholderText(/https:\/\/xxxxx\.supabase\.co/i);
    const keyInput = screen.getByPlaceholderText(/eyjhbgcioijiuzi1ni/i);
    await user.type(urlInput, "https://talent.supabase.co");
    await user.type(keyInput, "anon");
    await user.click(screen.getByRole("button", { name: /^guardar$/i }));

    expect(localStorage.getItem("firststep.supabase.url")).toBe("https://talent.supabase.co");
    expect(localStorage.getItem("firststep.supabase.anonKey")).toBe("anon");
  });

  it("submits login company form and starts oauth when configured", async () => {
    const user = userEvent.setup();
    localStorage.setItem("firststep.supabase.url", "https://corp.supabase.co");
    localStorage.setItem("firststep.supabase.anonKey", "anon");
    renderPage(<LoginCompanyPage />);

    await user.type(screen.getByPlaceholderText(/nombre@empresa.com/i), "empresa@example.com");
    await user.type(screen.getByPlaceholderText(/••••••••/i), "Secret123");
    await user.click(screen.getByRole("button", { name: /^iniciar sesión$/i }));

    await waitFor(() => {
      expect(clearCompanyLoginErrorMock).toHaveBeenCalled();
      expect(loginCompanyPasswordMock).toHaveBeenCalledWith({
        email: "empresa@example.com",
        password: "Secret123",
      });
    });

    await user.click(screen.getByRole("button", { name: /^google$/i }));
    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/empresa/login` },
      });
    });
  });
});
