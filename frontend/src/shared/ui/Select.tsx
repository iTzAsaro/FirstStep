import type { SelectHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: Props) {
  return (
    <select
      className={cn(
        "w-full bg-[#f8fafc] text-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#1e3456]/20 transition-all text-sm border border-transparent cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}
