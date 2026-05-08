import { getApiBaseUrl } from "@shared/config/env"

type HttpError = {
  status: number
  message: string
}

async function parseErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as { message?: string }
    return data.message ?? "Error inesperado"
  }

  return "Error inesperado"
}

export async function postJson<TResponse, TBody>(
  url: string,
  body: TBody
): Promise<TResponse> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}${url}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    const error: HttpError = {
      status: response.status,
      message
    }
    throw error
  }

  return (await response.json()) as TResponse
}
