import {
  isCompanyNameValid,
  isValidEmail
} from "@shared/lib/validation/validators"

export type CompanyForgotPasswordValues = {
  companyName: string
  email: string
}

export type CompanyForgotPasswordErrors = Partial<
  Record<keyof CompanyForgotPasswordValues, string>
>

export function validateCompanyForgotPassword(values: CompanyForgotPasswordValues) {
  const errors: CompanyForgotPasswordErrors = {}

  if (!isCompanyNameValid(values.companyName)) {
    errors.companyName = "Ingresa el nombre de la empresa"
  }

  if (!isValidEmail(values.email)) {
    errors.email = "Ingresa un correo corporativo válido"
  }

  return errors
}

