export function getApiBaseUrl() {
  const value = import.meta.env.VITE_API_BASE_URL

  if (typeof value === "string") {
    return value
  }

  return ""
}

export function getUseMockAuth() {
  return import.meta.env.VITE_USE_MOCK_AUTH === "true"
}
