import { isCompanyNameValid, isStrongPassword, isValidEmail } from "@shared/lib/validation/validators"

export type CompanyRegisterValues = {
  companyName: string
  email: string
  companySize: string
  password: string
  acceptTerms: boolean
}

export type CompanyRegisterErrors = Partial<
  Record<keyof Omit<CompanyRegisterValues, "acceptTerms">, string>
> & { acceptTerms?: string }

export function validateCompanyRegister(values: CompanyRegisterValues) {
  const errors: CompanyRegisterErrors = {}

  if (!isCompanyNameValid(values.companyName)) {
    errors.companyName = "Ingresa el nombre de la empresa"
  }

  if (!isValidEmail(values.email)) {
    errors.email = "Ingresa un correo válido"
  }

  if (!values.companySize) {
    errors.companySize = "Selecciona un tamaño de empresa"
  }

  if (!isStrongPassword(values.password)) {
    errors.password = "Usa al menos 10 caracteres, mayúscula, minúscula y número"
  }

  if (!values.acceptTerms) {
    errors.acceptTerms = "Debes aceptar los términos para continuar"
  }

  return errors
}

