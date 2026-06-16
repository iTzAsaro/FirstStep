// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     main.tsx                                                ║
// ║ Módulo:      frontend/src                                            ║
// ║ Descripción: Punto de entrada del frontend (ReactDOM + estilos).     ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "@/app/App";
import "@/app/styles/index.css";

/**
 * Renderiza la aplicación React en el elemento #root.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
