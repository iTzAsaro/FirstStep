import { getUseMockAuth } from "@shared/config/env"
import { postJson } from "@shared/api/httpClient"

export type CompanyAuthUser = {
  id: string
  companyName: string
  email: string
  kind: "company"
}

export type CompanyLoginResponse = {
  user: CompanyAuthUser
}

export async function loginCompany(input: {
  companyName: string
  email: string
  password: string
}): Promise<CompanyLoginResponse> {
  if (getUseMockAuth()) {
    const normalizedEmail = input.email.trim().toLowerCase()
    const normalizedCompany = input.companyName.trim().toLowerCase()

    if (
      normalizedCompany === "acme tech" &&
      normalizedEmail === "admin@company.com" &&
      input.password === "Password123"
    ) {
      return {
        user: {
          id: "company_1",
          companyName: input.companyName.trim(),
          email: normalizedEmail,
          kind: "company"
        }
      }
    }

    const error = {
      status: 401,
      message: "Credenciales inválidas"
    }
    throw error
  }

  return await postJson<CompanyLoginResponse, typeof input>(
    "/api/auth/company/login",
    input
  )
}

export async function requestCompanyPasswordReset(input: {
  companyName: string
  email: string
}): Promise<{ ok: true }> {
  if (getUseMockAuth()) {
    return { ok: true }
  }

  return await postJson<{ ok: true }, typeof input>(
    "/api/auth/company/forgot-password",
    input
  )
}
