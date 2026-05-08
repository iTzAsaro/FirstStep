type TextFieldProps = {
  label: string
  name: string
  type?: "text" | "email" | "password"
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoComplete?: string
  tone?: "dark" | "light"
}

export function TextField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
  tone = "dark"
}: TextFieldProps) {
  const describedBy = error ? `${name}-error` : undefined
  const isDark = tone === "dark"
  const labelClassName = isDark
    ? "text-xs font-bold tracking-widest text-slate-200"
    : "text-xs font-bold tracking-widest text-slate-500"
  const inputClassName = isDark
    ? "mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-300 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
    : "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#264572]/20"
  const errorClassName = isDark
    ? "text-xs font-semibold text-rose-200"
    : "text-xs font-semibold text-rose-600"

  return (
    <div className="space-y-2">
      <label className={labelClassName}>
        {label}
        <input
          className={inputClassName}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {error ? (
        <p id={describedBy} className={errorClassName}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
