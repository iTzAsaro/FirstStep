import type { ReactNode } from "react"

type ButtonProps = {
  children: ReactNode
  type?: "button" | "submit"
  disabled?: boolean
  onClick?: () => void
  variant?: "primary" | "secondary" | "brand"
  className?: string
}

export function Button({
  children,
  type = "button",
  disabled = false,
  onClick,
  variant = "primary",
  className
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-white text-slate-900 hover:bg-slate-100 focus:ring-white focus:ring-offset-slate-900",
    secondary:
      "bg-slate-900/10 text-white hover:bg-slate-900/20 focus:ring-white focus:ring-offset-slate-900",
    brand:
      "bg-[#264572] text-white hover:bg-[#1f3a60] focus:ring-[#264572] focus:ring-offset-white"
  }

  return (
    <button
      className={[base, variants[variant], className].filter(Boolean).join(" ")}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
