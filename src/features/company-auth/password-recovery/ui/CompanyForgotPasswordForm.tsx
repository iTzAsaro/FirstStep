import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"

import { Button, TextField } from "@shared/ui"
import {
  validateCompanyForgotPassword,
  type CompanyForgotPasswordErrors
} from "../model/companyForgotPasswordSchema"
import { requestCompanyPasswordReset } from "@features/company-auth/login/model/companyAuthApi"

type FormState = {
  companyName: string
  email: string
}

export function CompanyForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [values, setValues] = useState<FormState>({
    companyName: "",
    email: ""
  })

  const errors: CompanyForgotPasswordErrors = useMemo(() => {
    return validateCompanyForgotPassword(values)
  }, [values])

  const isValid = Object.keys(errors).length === 0

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)

    if (!isValid || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      await requestCompanyPasswordReset(values)
      setIsSuccess(true)
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message?: unknown }).message ?? "Error inesperado")
          : "Error inesperado"
      setServerError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Revisa tu correo
          </h2>
          <p className="text-sm font-semibold text-slate-200/90">
            Si la cuenta existe, enviamos instrucciones para recuperar tu
            contraseña.
          </p>
        </div>
        <Link
          to="/login/company"
          className="text-sm font-semibold text-slate-200 underline decoration-white/30 underline-offset-4 hover:text-white"
        >
          Volver al login
        </Link>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Recuperación de contraseña
        </h2>
        <p className="text-sm font-semibold text-slate-200/90">
          Te enviaremos instrucciones si tu correo corporativo está registrado.
        </p>
      </div>

      {serverError ? (
        <div className="rounded-xl border border-rose-200/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">
          {serverError}
        </div>
      ) : null}

      <TextField
        label="COMPANY NAME"
        name="companyName"
        placeholder="e.g. Acme Tech"
        value={values.companyName}
        error={errors.companyName}
        autoComplete="organization"
        onChange={(value) => setValues((prev) => ({ ...prev, companyName: value }))}
      />

      <TextField
        label="WORK EMAIL"
        name="email"
        type="email"
        placeholder="name@company.com"
        value={values.email}
        error={errors.email}
        autoComplete="email"
        onChange={(value) => setValues((prev) => ({ ...prev, email: value }))}
      />

      <div className="flex items-center justify-between">
        <Link
          to="/login/company"
          className="text-sm font-semibold text-slate-200 underline decoration-white/30 underline-offset-4 hover:text-white"
        >
          Volver
        </Link>
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </form>
  )
}
