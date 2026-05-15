import type { InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, ...props }: Props) {
  return (
    <input
      type="checkbox"
      className={cn(
        "mt-1 w-3.5 h-3.5 rounded border-slate-300 text-[#1e3456] focus:ring-[#1e3456]",
        className,
      )}
      {...props}
    />
  );
}
