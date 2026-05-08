import { CompanyForgotPasswordForm } from "@features/company-auth/password-recovery/ui/CompanyForgotPasswordForm"
import { Link } from "react-router-dom"

export function CompanyForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#264572] text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-6">
        <div className="mb-6">
          <Link
            to="/login"
            className="text-sm font-semibold text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            Volver a selección
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <CompanyForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}

