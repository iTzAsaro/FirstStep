import {
  isCompanyNameValid,
  isValidEmail
} from "@shared/lib/validation/validators"

export type CompanyLoginValues = {
  companyName: string
  email: string
  password: string
}

export type CompanyLoginErrors = Partial<Record<keyof CompanyLoginValues, string>>

export function validateCompanyLogin(values: CompanyLoginValues) {
  const errors: CompanyLoginErrors = {}

  if (!isCompanyNameValid(values.companyName)) {
    errors.companyName = "Ingresa el nombre de la empresa"
  }

  if (!isValidEmail(values.email)) {
    errors.email = "Ingresa un correo corporativo válido"
  }

  if (!values.password || values.password.length < 1) {
    errors.password = "Ingresa tu contraseña"
  }

  return errors
}
