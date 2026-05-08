import { Link } from "react-router-dom"

import linkedinIcon from "@shared/assets/login-empresas/v62_329.png"
import googleIcon from "@shared/assets/login-empresas/v62_334.png"

import heroImage from "@shared/assets/login-empresas/v62_307.png"
import avatar1 from "@shared/assets/login-empresas/v62_298.png"
import avatar2 from "@shared/assets/login-empresas/v62_300.png"
import avatar3 from "@shared/assets/login-empresas/v62_302.png"

import { CompanyRegisterForm } from "@features/company-auth/register/ui/CompanyRegisterForm"

export function CompanyLoginPage() {
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
                <div
                  className="h-12 w-12 rounded-full border-2 border-[#264572] bg-cover bg-center"
                  style={{ backgroundImage: `url(${avatar1})` }}
                />
                <div
                  className="-ml-3 h-12 w-12 rounded-full border-2 border-[#264572] bg-cover bg-center"
                  style={{ backgroundImage: `url(${avatar2})` }}
                />
                <div
                  className="-ml-3 h-12 w-12 rounded-full border-2 border-[#264572] bg-cover bg-center"
                  style={{ backgroundImage: `url(${avatar3})` }}
                />
              </div>
              <div className="text-sm font-semibold text-[#C0D6FF]">
                Trusted by 450+ global companies
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl">
            <div
              className="aspect-[16/10] w-full rounded-3xl bg-cover bg-center shadow-[0px_30px_40px_rgba(63,93,139,0.06)]"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div className="-mt-16 w-full max-w-sm rounded-3xl bg-[#1B3358] px-6 py-5 shadow-[0px_30px_40px_rgba(63,93,139,0.06)] sm:-mt-20">
              <div className="text-base font-bold text-white">Vetted Talent Pool</div>
              <div className="mt-1 text-sm text-white/60">
                Every graduate verified for skills and credentials.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#FAF8FF] lg:flex-[1]">
        <div className="mx-auto w-full max-w-2xl px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
          <div>
            <div className="text-[32px] font-bold text-[#131B2E]">
              Create Business Account
            </div>
            <div className="mt-2 text-base text-[#43474F]">
              Fill in the details to start hiring your next top performers.
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              className="relative h-[46px] rounded-xl bg-white/70 shadow-[0px_30px_40px_rgba(63,93,139,0.06)]"
            >
              <div className="absolute inset-0 rounded-xl" />
              <div className="flex h-full items-center justify-center gap-3 px-4">
                <img className="h-5 w-5 opacity-80" src={linkedinIcon} alt="" />
                <div className="text-sm font-semibold text-[#43474F]">LinkedIn</div>
              </div>
            </button>
            <button
              type="button"
              className="relative h-[46px] rounded-xl bg-white/70 shadow-[0px_30px_40px_rgba(63,93,139,0.06)]"
            >
              <div className="absolute inset-0 rounded-xl" />
              <div className="flex h-full items-center justify-center gap-3 px-4">
                <img className="h-5 w-5 opacity-80" src={googleIcon} alt="" />
                <div className="text-sm font-semibold text-[#43474F]">Google</div>
              </div>
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#C4C6D0]/30" />
            <div className="bg-[#FAF8FF] px-4 text-xs font-bold text-[#747780]">
              OR WITH EMAIL
            </div>
            <div className="h-px flex-1 bg-[#C4C6D0]/30" />
          </div>

          <CompanyRegisterForm />

          <div className="mt-10">
            <Link
              to="/help"
              className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-4 py-3 text-xs font-bold tracking-widest text-[#43474F] shadow-[0px_30px_40px_rgba(63,93,139,0.06)]"
            >
              HELP CENTER
            </Link>
          </div>

          <div className="mt-6 text-sm font-semibold text-[#43474F]">
            <Link to="/login/company/sign-in" className="underline underline-offset-4">
              Already have a business account? Log in
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
