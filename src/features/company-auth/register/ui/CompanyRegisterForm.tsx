import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { validateCompanyRegister, type CompanyRegisterErrors } from "../model/companyRegisterSchema"
import { registerCompany } from "../model/companyRegisterApi"

type FormState = {
  companyName: string
  email: string
  companySize: string
  password: string
  acceptTerms: boolean
}

const companySizeOptions = [
  { value: "", label: "Select size" },
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501+", label: "501+" }
]

export function CompanyRegisterForm() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [touched, setTouched] = useState({
    companyName: false,
    email: false,
    companySize: false,
    password: false,
    acceptTerms: false
  })
  const [values, setValues] = useState<FormState>({
    companyName: "",
    email: "",
    companySize: "",
    password: "",
    acceptTerms: false
  })

  const errors: CompanyRegisterErrors = useMemo(() => {
    return validateCompanyRegister(values)
  }, [values])

  const isValid = Object.keys(errors).length === 0

  function getFieldError<TKey extends keyof CompanyRegisterErrors>(
    key: TKey,
    fallbackTouchedKey?: keyof typeof touched
  ) {
    const shouldShow =
      isSubmitted || (fallbackTouchedKey ? touched[fallbackTouchedKey] : false)
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
      await registerCompany({
        companyName: values.companyName,
        email: values.email,
        companySize: values.companySize,
        password: values.password
      })
      navigate("/login/company/sign-in")
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
    <form className="relative mt-8" onSubmit={onSubmit}>
      {serverError ? (
        <div className="mb-5 rounded-xl border border-rose-300/50 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {serverError}
        </div>
      ) : null}

      <div className="space-y-6">
        <div>
          <div className="text-base font-semibold text-[#43474F]">COMPANY NAME</div>
          <input
            className="mt-2 h-[57px] w-full rounded-xl border border-[#E6E8FF] bg-[#F2F3FF] px-5 text-base text-[#43474F] placeholder:text-[#747780]/50 focus:outline-none focus:ring-2 focus:ring-[#264572]/20"
            placeholder="e.g. Acme Tech"
            value={values.companyName}
            autoComplete="organization"
            onBlur={() => setTouched((prev) => ({ ...prev, companyName: true }))}
            onChange={(event) => setValues((prev) => ({ ...prev, companyName: event.target.value }))}
          />
          {getFieldError("companyName", "companyName") ? (
            <div className="mt-2 text-sm font-semibold text-rose-600">
              {getFieldError("companyName", "companyName")}
            </div>
          ) : null}
        </div>

        <div>
          <div className="text-base font-semibold text-[#43474F]">WORK EMAIL</div>
          <input
            className="mt-2 h-[57px] w-full rounded-xl border border-[#E6E8FF] bg-[#F2F3FF] px-5 text-base text-[#43474F] placeholder:text-[#747780]/50 focus:outline-none focus:ring-2 focus:ring-[#264572]/20"
            placeholder="name@company.com"
            type="email"
            value={values.email}
            autoComplete="email"
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
          />
          {getFieldError("email", "email") ? (
            <div className="mt-2 text-sm font-semibold text-rose-600">
              {getFieldError("email", "email")}
            </div>
          ) : null}
        </div>

        <div>
          <div className="text-base font-semibold text-[#43474F]">COMPANY SIZE</div>
          <div className="mt-2">
            <select
              className="h-[57px] w-full appearance-none rounded-xl border border-[#E6E8FF] bg-[#F2F3FF] px-5 pr-12 text-base font-semibold text-[#747780] focus:outline-none focus:ring-2 focus:ring-[#264572]/20"
              value={values.companySize}
              onBlur={() => setTouched((prev) => ({ ...prev, companySize: true }))}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, companySize: event.target.value }))
              }
            >
              {companySizeOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none relative -mt-[57px] flex h-[57px] items-center justify-end pr-5">
              <div className="h-4 w-4 rotate-45 border-b-2 border-r-2 border-[#747780]" />
            </div>
          </div>
          {getFieldError("companySize", "companySize") ? (
            <div className="mt-2 text-sm font-semibold text-rose-600">
              {getFieldError("companySize", "companySize")}
            </div>
          ) : null}
        </div>

        <div>
          <div className="text-base font-semibold text-[#43474F]">PASSWORD</div>
          <input
            className="mt-2 h-[57px] w-full rounded-xl border border-[#E6E8FF] bg-[#F2F3FF] px-5 text-base text-[#43474F] placeholder:text-[#747780]/50 focus:outline-none focus:ring-2 focus:ring-[#264572]/20"
            placeholder="Min. 8 characters"
            type="password"
            value={values.password}
            autoComplete="new-password"
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
          />
          {getFieldError("password", "password") ? (
            <div className="mt-2 text-sm font-semibold text-rose-600">
              {getFieldError("password", "password")}
            </div>
          ) : null}
        </div>

        <div>
          <label className="flex items-start gap-3">
            <input
              className="mt-1 h-5 w-5 rounded border border-[#C4C6D0]/60"
              type="checkbox"
              checked={values.acceptTerms}
              onBlur={() => setTouched((prev) => ({ ...prev, acceptTerms: true }))}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, acceptTerms: event.target.checked }))
              }
            />
            <div className="text-sm font-semibold text-[#43474F]">
              I agree to the Terms of Service and Privacy Policy.
              {getFieldError("acceptTerms", "acceptTerms") ? (
                <div className="mt-1 text-sm font-semibold text-rose-600">
                  {getFieldError("acceptTerms", "acceptTerms")}
                </div>
              ) : null}
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-[57px] w-full rounded-xl bg-[#264572] text-base font-extrabold text-white shadow-[0px_20px_40px_rgba(19,27,46,0.15)] transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creando..." : "Create Company Account"}
        </button>
      </div>
    </form>
  )
}
