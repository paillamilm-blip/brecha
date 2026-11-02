import type { ProveedorAnalisis } from "../types";
import { proveedorFixture } from "./fixture";
import { proveedorGemini } from "./gemini";

/**
 * Punto único donde se decide qué IA analiza el CV. Conectar un modelo de pago
 * es cambiar ANALISIS_PROVEEDOR y la clave en el entorno: ninguna pantalla ni
 * tabla sabe qué proveedor está corriendo.
 */
export function obtenerProveedor(): ProveedorAnalisis {
  const elegido = (process.env.ANALISIS_PROVEEDOR ?? "fixture").trim().toLowerCase();

  if (elegido === "gemini") return proveedorGemini;
  if (elegido === "fixture") return proveedorFixture;

  throw new Error(`ANALISIS_PROVEEDOR="${elegido}" no existe. Usa "fixture" o "gemini".`);
}

export function estadoProveedor() {
  const proveedor = obtenerProveedor();
  return {
    nombre: proveedor.nombre,
    simulado: proveedor.simulado,
    faltaClave: proveedor.nombre === "gemini" && !process.env.GEMINI_API_KEY?.trim(),
  };
}
