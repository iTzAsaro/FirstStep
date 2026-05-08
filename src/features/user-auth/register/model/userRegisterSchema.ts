import { isStrongPassword, isValidEmail } from "@shared/lib/validation/validators"

export type UserRegisterValues = {
  fullName: string
  email: string
  password: string
}

export type UserRegisterErrors = Partial<Record<keyof UserRegisterValues, string>>

export function validateUserRegister(values: UserRegisterValues) {
  const errors: UserRegisterErrors = {}

  if (values.fullName.trim().length < 2) {
    errors.fullName = "Ingresa tu nombre completo"
  }

  if (!isValidEmail(values.email)) {
    errors.email = "Ingresa un correo válido"
  }

  if (!isStrongPassword(values.password)) {
    errors.password = "Usa al menos 10 caracteres, mayúscula, minúscula y número"
  }

  return errors
}

