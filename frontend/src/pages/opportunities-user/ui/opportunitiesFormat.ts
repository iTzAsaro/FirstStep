const usdFormatterEs = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatSalary(min: number | null, max: number | null) {
  if (min === null && max === null) return "Compensación a convenir";

  const format = (value: number) => usdFormatterEs.format(value);

  if (min !== null && max !== null) return `${format(min)} - ${format(max)}`;
  if (min !== null) return `Desde ${format(min)}`;
  return `Hasta ${format(max as number)}`;
}

export function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "Hace un momento";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hace un momento";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}
