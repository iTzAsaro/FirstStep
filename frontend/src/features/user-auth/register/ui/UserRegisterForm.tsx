import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { registerUser } from "../model/userRegisterApi"
import { validateUserRegister, type UserRegisterErrors } from "../model/userRegisterSchema"

type FormState = {
  fullName: string
  email: string
  password: string
}

export function UserRegisterForm() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false
  })
  const [values, setValues] = useState<FormState>({
    fullName: "",
    email: "",
    password: ""
  })

  const errors: UserRegisterErrors = useMemo(() => {
    return validateUserRegister(values)
  }, [values])

  const isValid = Object.keys(errors).length === 0

  function getFieldError<TKey extends keyof UserRegisterErrors>(
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
      await registerUser(values)
      navigate("/login/user/sign-in")
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
        <div className="text-xs font-bold tracking-widest text-slate-500">FULL NAME</div>
        <input
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#264572]/20"
          placeholder="Alex Johnson"
          value={values.fullName}
          autoComplete="name"
          onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
          onChange={(event) => setValues((prev) => ({ ...prev, fullName: event.target.value }))}
        />
        {getFieldError("fullName", "fullName") ? (
          <div className="text-sm font-semibold text-rose-600">
            {getFieldError("fullName", "fullName")}
          </div>
        ) : null}
      </div>

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
        <div className="text-xs font-bold tracking-widest text-slate-500">PASSWORD</div>
        <input
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#264572]/20"
          placeholder="********"
          type="password"
          value={values.password}
          autoComplete="new-password"
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
        />
        {getFieldError("password", "password") ? (
          <div className="text-sm font-semibold text-rose-600">
            {getFieldError("password", "password")}
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-400">
            Mínimo 10 caracteres, mayúscula, minúscula y número.
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-xl bg-[#264572] text-sm font-extrabold text-white shadow-[0px_20px_40px_rgba(19,27,46,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creando..." : "Create Account"}
      </button>

      <div className="text-center text-sm font-semibold text-slate-500">
        Already have an account?{" "}
        <Link to="/login/user/sign-in" className="font-extrabold text-[#264572]">
          Sign in
        </Link>
      </div>
    </form>
  )
}

