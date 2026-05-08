import ReactDOM from "react-dom/client"
import { StrictMode } from "react"

import { App } from "@app"
import "@app/styles/index.css"

/**
 * Monta la aplicación React en el elemento root del DOM.
 * @returns {void} No retorna un valor
 */
function bootstrap() {
  const rootElement = document.getElementById("root")

  if (!rootElement) {
    throw new Error("No se encontró el elemento #root para montar la app")
  }

  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()
