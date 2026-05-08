import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { loginUser } from "../model/userAuthApi"
import { validateUserLogin, type UserLoginErrors } from "../model/userLoginSchema"
import { useAuth } from "@processes/auth/index"

type FormState = {
  email: string
  password: string
}

export function UserLoginForm() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [touched, setTouched] = useState({
    email: false,
    password: false
  })
  const [values, setValues] = useState<FormState>({
    email: "",
    password: ""
  })

  const errors: UserLoginErrors = useMemo(() => {
    return validateUserLogin(values)
  }, [values])

  const isValid = Object.keys(errors).length === 0

  function getFieldError<TKey extends keyof UserLoginErrors>(
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
      const response = await loginUser(values)
      setSession({
        user: response.user
      })
      navigate("/dashboard/user")
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
          onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
        />
        {getFieldError("email", "email") ? (
          <div className="text-sm font-semibold text-rose-600">
            {getFieldError("email", "email")}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold tracking-widest text-slate-500">PASSWORD</div>
          <Link to="/login/user/forgot-password" className="text-xs font-bold text-[#264572]">
            Forgot?
          </Link>
        </div>
        <input
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#264572]/20"
          placeholder="********"
          type="password"
          value={values.password}
          autoComplete="current-password"
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
        />
        {getFieldError("password", "password") ? (
          <div className="text-sm font-semibold text-rose-600">
            {getFieldError("password", "password")}
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-xl bg-[#264572] text-sm font-extrabold text-white shadow-[0px_20px_40px_rgba(19,27,46,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Validando..." : "Sign in"}
      </button>

      <div className="text-center text-sm font-semibold text-slate-500">
        ¿No tienes cuenta?{" "}
        <Link to="/login/user" className="font-extrabold text-[#264572]">
          Create account
        </Link>
      </div>
    </form>
  )
}

