export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isStrongPassword(value: string) {
  const hasMinLength = value.length >= 10
  const hasUpper = /[A-Z]/.test(value)
  const hasLower = /[a-z]/.test(value)
  const hasNumber = /\d/.test(value)

  return hasMinLength && hasUpper && hasLower && hasNumber
}

export function isCompanyNameValid(value: string) {
  return value.trim().length >= 2
}
