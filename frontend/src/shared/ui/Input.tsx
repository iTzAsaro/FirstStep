// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     Input.tsx                                               ║
// ║ Módulo:      frontend/src/shared/ui                                  ║
// ║ Descripción: Input reutilizable con slots opcionales (izq/der).       ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
};

/**
 * Input con soporte de iconos/slots en los laterales.
 */
export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, leftSlot, rightSlot, ...props },
  ref,
) {
  return (
    <div className="relative">
      {leftSlot ? (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {leftSlot}
        </div>
      ) : null}
      <input
        ref={ref}
        className={cn(
          "w-full bg-[#f3f6fc] text-slate-800 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#294266]/30 transition-all text-sm",
          leftSlot ? "pl-11" : null,
          rightSlot ? "pr-12" : null,
          className,
        )}
        {...props}
      />
      {rightSlot ? (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">{rightSlot}</div>
      ) : null}
    </div>
  );
});
