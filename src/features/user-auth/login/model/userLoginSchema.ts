import { isValidEmail } from "@shared/lib/validation/validators"

export type UserLoginValues = {
  email: string
  password: string
}

export type UserLoginErrors = Partial<Record<keyof UserLoginValues, string>>

export function validateUserLogin(values: UserLoginValues) {
  const errors: UserLoginErrors = {}

  if (!isValidEmail(values.email)) {
    errors.email = "Ingresa un correo válido"
  }

  if (!values.password || values.password.length < 1) {
    errors.password = "Ingresa tu contraseña"
  }

  return errors
}

