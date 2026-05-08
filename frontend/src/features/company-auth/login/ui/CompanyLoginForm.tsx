import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button, TextField } from "@shared/ui"
import {
  validateCompanyLogin,
  type CompanyLoginErrors
} from "../model/companyLoginSchema"
import { loginCompany } from "../model/companyAuthApi"
import { useAuth } from "@processes/auth/index"

type FormState = {
  companyName: string
  email: string
  password: string
}

type CompanyLoginFormProps = {
  tone?: "dark" | "light"
}

export function CompanyLoginForm({ tone = "dark" }: CompanyLoginFormProps) {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [touched, setTouched] = useState({
    companyName: false,
    email: false,
    password: false
  })
  const [values, setValues] = useState<FormState>({
    companyName: "",
    email: "",
    password: ""
  })

  const errors: CompanyLoginErrors = useMemo(() => {
    return validateCompanyLogin(values)
  }, [values])

  const isValid = Object.keys(errors).length === 0
  const isDark = tone === "dark"
  const titleClassName = isDark
    ? "text-2xl font-extrabold tracking-tight text-white"
    : "text-2xl font-extrabold tracking-tight text-[#131B2E]"
  const descriptionClassName = isDark
    ? "text-sm font-semibold text-slate-200/90"
    : "text-sm font-semibold text-[#43474F]"
  const linkClassName = isDark
    ? "text-sm font-semibold text-slate-200 underline decoration-white/30 underline-offset-4 hover:text-white"
    : "text-sm font-semibold text-[#43474F] underline decoration-[#43474F]/30 underline-offset-4 hover:decoration-[#43474F]/60"
  const secondaryLinkClassName = isDark
    ? "text-white underline decoration-white/30 underline-offset-4 hover:decoration-white/60"
    : "text-[#264572] underline decoration-[#264572]/30 underline-offset-4 hover:decoration-[#264572]/60"
  const serverErrorClassName = isDark
    ? "rounded-xl border border-rose-200/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100"
    : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
  const submitVariant = isDark ? "primary" : "brand"

  function getFieldError<TKey extends keyof CompanyLoginErrors>(
    key: TKey,
    touchedKey: keyof typeof touched
  ) {
    const shouldShow = isSubmitted || touched[touchedKey]
    return shouldShow ? errors[key] : undefined
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setServerError(null)
    setIsSubmitted(true)

    if (!isValid || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await loginCompany(values)
      setSession({
        user: response.user
      })
      navigate("/dashboard/company")
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

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-1">
        <h2 className={titleClassName}>Login Empresas</h2>
        <p className={descriptionClassName}>
          Accede a tu cuenta corporativa para gestionar tus procesos.
        </p>
      </div>

      {serverError ? (
        <div className={serverErrorClassName}>{serverError}</div>
      ) : null}

      <TextField
        label="COMPANY NAME"
        name="companyName"
        placeholder="e.g. Acme Tech"
        value={values.companyName}
        error={getFieldError("companyName", "companyName")}
        autoComplete="organization"
        tone={tone}
        onChange={(value) => {
          if (!touched.companyName) {
            setTouched((prev) => ({ ...prev, companyName: true }))
          }
          setValues((prev) => ({ ...prev, companyName: value }))
        }}
      />

      <TextField
        label="WORK EMAIL"
        name="email"
        type="email"
        placeholder="name@company.com"
        value={values.email}
        error={getFieldError("email", "email")}
        autoComplete="email"
        tone={tone}
        onChange={(value) => {
          if (!touched.email) {
            setTouched((prev) => ({ ...prev, email: true }))
          }
          setValues((prev) => ({ ...prev, email: value }))
        }}
      />

      <TextField
        label="PASSWORD"
        name="password"
        type="password"
        placeholder="********"
        value={values.password}
        error={getFieldError("password", "password")}
        autoComplete="current-password"
        tone={tone}
        onChange={(value) => {
          if (!touched.password) {
            setTouched((prev) => ({ ...prev, password: true }))
          }
          setValues((prev) => ({ ...prev, password: value }))
        }}
      />

      <div className="flex items-center justify-between">
        <Link
          to="/login/company/forgot-password"
          className={linkClassName}
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <Button type="submit" variant={submitVariant} disabled={!isValid || isSubmitting}>
          {isSubmitting ? "Validando..." : "Ingresar"}
        </Button>
      </div>

      <div className={descriptionClassName}>
        ¿No eres empresa?{" "}
        <Link
          to="/login"
          className={secondaryLinkClassName}
        >
          Ir a selección de login
        </Link>
      </div>
    </form>
  )
}
