import { getUseMockAuth } from "@shared/config/env"
import { postJson } from "@shared/api/httpClient"

export async function registerUser(input: {
  fullName: string
  email: string
  password: string
}): Promise<{ ok: true }> {
  if (getUseMockAuth()) {
    return { ok: true }
  }

  return await postJson<{ ok: true }, typeof input>("/api/auth/user/register", input)
}

