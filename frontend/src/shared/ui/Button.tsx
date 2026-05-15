import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-[#294266] text-white hover:bg-[#1a2b44] shadow-md shadow-[#294266]/20",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-50",
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-xs px-4 py-2.5 rounded-lg",
  md: "text-sm px-5 py-3 rounded-xl",
  lg: "text-sm px-6 py-3.5 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
