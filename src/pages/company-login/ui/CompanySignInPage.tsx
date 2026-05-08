import { Link } from "react-router-dom"

import heroImage from "@shared/assets/login-empresas/v62_307.png"
import avatar1 from "@shared/assets/login-empresas/v62_298.png"
import avatar2 from "@shared/assets/login-empresas/v62_300.png"
import avatar3 from "@shared/assets/login-empresas/v62_302.png"

import { CompanyLoginForm } from "@features/company-auth/login/ui/CompanyLoginForm"

export function CompanySignInPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FF] lg:flex">
      <section className="relative w-full overflow-hidden bg-[#264572] text-white lg:flex-[1]">
        <div className="absolute right-0 top-56 h-96 w-96 rounded-full bg-[#3F5D8B]/20 blur-2xl" />
        <div className="absolute bottom-16 left-16 h-80 w-80 rounded-full bg-[#465D83]/20 blur-2xl" />

        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-10 sm:px-10 lg:max-w-none lg:px-16 lg:py-16">
          <header className="flex flex-wrap items-center gap-3">
            <div className="text-3xl font-bold">FirsTep</div>
            <div className="rounded-full bg-[#D5E3FF]/20 px-3 py-1 text-xs font-bold tracking-widest text-[#D5E3FF]">
              FOR BUSINESS
            </div>
          </header>

          <div className="max-w-xl">
            <div className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Encuentra tu nueva generacion de talrntos
            </div>
            <div className="mt-6 text-lg font-semibold text-[#C0D6FF] sm:text-xl">
              Join a community of forward-thinking employers connecting with 12k+
              graduates ready to work. Streamline your hiring with AI-driven
              matching.
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center">
                <img
                  className="h-12 w-12 rounded-full border-2 border-[#264572] object-cover"
                  src={avatar1}
                  alt=""
                />
                <img
                  className="-ml-3 h-12 w-12 rounded-full border-2 border-[#264572] object-cover"
                  src={avatar2}
                  alt=""
                />
                <img
                  className="-ml-3 h-12 w-12 rounded-full border-2 border-[#264572] object-cover"
                  src={avatar3}
                  alt=""
                />
              </div>
              <div className="text-sm font-semibold text-[#C0D6FF]">
                Trusted by 450+ global companies
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl">
            <img
              src={heroImage}
              alt=""
              className="aspect-[16/10] w-full rounded-3xl object-cover shadow-[0px_30px_40px_rgba(63,93,139,0.06)]"
            />
          </div>
        </div>
      </section>

      <section className="w-full bg-[#FAF8FF] lg:flex-[1]">
        <div className="mx-auto w-full max-w-2xl px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
          <div className="mb-8 flex items-center justify-between">
            <div className="text-sm font-extrabold tracking-widest text-[#747780]">
              SIGN IN
            </div>
            <Link to="/login/company" className="text-sm font-semibold text-[#43474F] underline underline-offset-4">
              Crear cuenta
            </Link>
          </div>

          <CompanyLoginForm tone="light" />
        </div>
      </section>
    </div>
  )
}
