import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"

import { requestUserPasswordReset } from "@features/user-auth/login/model/userAuthApi"
import {
  validateUserForgotPassword,
  type UserForgotPasswordErrors
} from "../model/userForgotPasswordSchema"

type FormState = {
  email: string
}

export function UserForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [touched, setTouched] = useState({
    email: false
  })
  const [values, setValues] = useState<FormState>({
    email: ""
  })

  const errors: UserForgotPasswordErrors = useMemo(() => {
    return validateUserForgotPassword(values)
  }, [values])

  const isValid = Object.keys(errors).length === 0

  function getFieldError<TKey extends keyof UserForgotPasswordErrors>(
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
      await requestUserPasswordReset(values)
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
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
            Revisa tu correo
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-500">
            Si la cuenta existe, enviamos instrucciones para recuperar tu contraseña.
          </div>
        </div>
        <Link to="/login/user/sign-in" className="text-sm font-extrabold text-[#264572]">
          Volver al login
        </Link>
      </div>
    )
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={onSubmit}>
      {serverError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {serverError}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="text-xs font-bold tracking-widest text-slate-500">EMAIL ADDRESS</div>
        <input
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#264572]/20"
          placeholder="alex@example.com"
          type="email"
          value={values.email}
          autoComplete="email"
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          onChange={(event) => setValues({ email: event.target.value })}
        />
        {getFieldError("email", "email") ? (
          <div className="text-sm font-semibold text-rose-600">
            {getFieldError("email", "email")}
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-xl bg-[#264572] text-sm font-extrabold text-white shadow-[0px_20px_40px_rgba(19,27,46,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : "Send recovery email"}
      </button>

      <div className="text-center text-sm font-semibold text-slate-500">
        <Link to="/login/user/sign-in" className="font-extrabold text-[#264572]">
          Volver
        </Link>
      </div>
    </form>
  )
}

