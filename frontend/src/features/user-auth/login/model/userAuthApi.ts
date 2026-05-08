import { getUseMockAuth } from "@shared/config/env"
import { postJson } from "@shared/api/httpClient"

export type UserAuthUser = {
  id: string
  fullName: string
  email: string
  kind: "user"
}

export type UserLoginResponse = {
  user: UserAuthUser
}

export async function loginUser(input: {
  email: string
  password: string
}): Promise<UserLoginResponse> {
  if (getUseMockAuth()) {
    const normalizedEmail = input.email.trim().toLowerCase()

    if (normalizedEmail === "user@firststep.com" && input.password === "Password123") {
      return {
        user: {
          id: "user_1",
          fullName: "Alex Johnson",
          email: normalizedEmail,
          kind: "user"
        }
      }
    }

    const error = {
      status: 401,
      message: "Credenciales inválidas"
    }
    throw error
  }

  return await postJson<UserLoginResponse, typeof input>("/api/auth/user/login", input)
}

export async function requestUserPasswordReset(input: {
  email: string
}): Promise<{ ok: true }> {
  if (getUseMockAuth()) {
    return { ok: true }
  }

  return await postJson<{ ok: true }, typeof input>("/api/auth/user/forgot-password", input)
}
