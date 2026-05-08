import { Link } from "react-router-dom"

import { UserLoginForm } from "@features/user-auth/login/ui/UserLoginForm"

export function UserSignInPage() {
  return (
    <div className="min-h-screen bg-[#F6F7FF]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-sm font-extrabold tracking-tight text-[#264572]">
          FirsTep
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/help"
            className="text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            Help Center
          </Link>
          <Link
            to="/login/user"
            className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#264572] shadow-sm"
          >
            Create account
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl justify-center px-6 pb-16 pt-10">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white p-8 shadow-[0px_30px_60px_rgba(19,27,46,0.08)]">
          <div>
            <h1 className="text-2xl font-extrabold text-[#264572]">Sign in</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Accede con tu correo y contraseña.
            </p>
          </div>

          <UserLoginForm />
        </div>
      </main>
    </div>
  )
}

