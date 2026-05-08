type AppTitleProps = {
  text: string
}

/**
 * Renderiza un título consistente para la aplicación.
 * @param {AppTitleProps} props - Propiedades del componente
 * @returns {import("react").JSX.Element} Encabezado con estilo
 */
export function AppTitle({ text }: AppTitleProps) {
  return <h1 className="text-2xl font-semibold tracking-tight">{text}</h1>
}
