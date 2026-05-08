import { Link } from "react-router-dom"

import googleIcon from "@shared/assets/login-empresas/v62_334.png"
import linkedinIcon from "@shared/assets/login-empresas/v62_329.png"

import { UserRegisterForm } from "@features/user-auth/register/ui/UserRegisterForm"

export function UserRegisterPage() {
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
            to="/login/user/sign-in"
            className="rounded-full bg-[#264572] px-4 py-2 text-xs font-extrabold text-white shadow-sm"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl justify-center px-6 pb-16 pt-10">
        <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[0px_30px_60px_rgba(19,27,46,0.08)]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <section className="relative bg-[#5E86C7] p-8 text-white">
              <div className="absolute right-6 top-6 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold">
                FirstTep
              </div>
              <div className="max-w-xs space-y-4">
                <h1 className="text-2xl font-extrabold leading-tight">
                  Your first step into a brighter future.
                </h1>
                <p className="text-sm font-semibold text-white/80">
                  Join thousands of recent graduates building meaningful careers
                  through personalized guidance and a supportive community.
                </p>
              </div>

              <div className="mt-8 aspect-square w-full max-w-sm rounded-2xl bg-[#3F6FB6] p-6">
                <div className="h-full w-full rounded-2xl bg-gradient-to-b from-white/10 to-white/0">
                  <div className="flex h-full items-center justify-center">
                    <div className="grid w-full grid-cols-5 gap-3 px-4">
                      {Array.from({ length: 15 }).map((_, index) => (
                        <div
                          key={`tile-${index}`}
                          className="h-9 rounded-xl bg-white/10"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="p-8">
              <div>
                <h2 className="text-lg font-extrabold text-[#264572]">
                  Create your account
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Start your professional journey with FirstTep today.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <img className="h-4 w-4" src={googleIcon} alt="" />
                  Google
                </button>
                <button
                  type="button"
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <img className="h-4 w-4" src={linkedinIcon} alt="" />
                  LinkedIn
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <div className="text-[10px] font-extrabold tracking-widest text-slate-400">
                  OR WITH EMAIL
                </div>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <UserRegisterForm />
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
