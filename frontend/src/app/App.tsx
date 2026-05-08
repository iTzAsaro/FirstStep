import { BrowserRouter } from "react-router-dom"

import { AppRouter } from "./providers/router"
import { AuthProvider } from "@processes/auth"

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  )
}
