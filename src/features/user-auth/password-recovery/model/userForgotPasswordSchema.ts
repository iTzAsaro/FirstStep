import { isValidEmail } from "@shared/lib/validation/validators"

export type UserForgotPasswordValues = {
  email: string
}

export type UserForgotPasswordErrors = Partial<Record<keyof UserForgotPasswordValues, string>>

export function validateUserForgotPassword(values: UserForgotPasswordValues) {
  const errors: UserForgotPasswordErrors = {}

  if (!isValidEmail(values.email)) {
    errors.email = "Ingresa un correo válido"
  }

  return errors
}

