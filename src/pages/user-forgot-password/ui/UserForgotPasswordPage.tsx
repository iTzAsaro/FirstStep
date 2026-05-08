import { Link } from "react-router-dom"

import { UserForgotPasswordForm } from "@features/user-auth/password-recovery/ui/UserForgotPasswordForm"

export function UserForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F6F7FF]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-sm font-extrabold tracking-tight text-[#264572]">
          FirsTep
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login/user/sign-in"
            className="rounded-full bg-[#264572] px-4 py-2 text-xs font-extrabold text-white shadow-sm"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl justify-center px-6 pb-16 pt-10">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white p-8 shadow-[0px_30px_60px_rgba(19,27,46,0.08)]">
          <div>
            <h1 className="text-2xl font-extrabold text-[#264572]">
              Recuperar contraseña
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Enviaremos instrucciones al correo registrado.
            </p>
          </div>

          <UserForgotPasswordForm />
        </div>
      </main>
    </div>
  )
}

