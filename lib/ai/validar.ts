import type { BrechaNueva, CategoriaBrecha, ResultadoProveedor, Severidad } from "../types";

const CATEGORIAS_VALIDAS: CategoriaBrecha[] = ["dura", "blanda", "conocimiento", "credencial"];
const SEVERIDADES_VALIDAS: Severidad[] = ["alta", "media", "baja"];

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Convierte la respuesta de cualquier modelo al formato interno. El modelo es una
 * frontera externa: puede devolver campos de menos, tipos cambiados o brechas basura.
 */
export function validarResultado(crudo: unknown): ResultadoProveedor {
  if (!esObjeto(crudo)) throw new Error("El modelo no devolvió un objeto JSON.");

  const ocupacion = texto(crudo.ocupacion);
  if (!ocupacion) throw new Error("El modelo no pudo identificar la ocupación del CV.");

  const fortalezasRaw = Array.isArray(crudo.fortalezas) ? crudo.fortalezas : [];
  const fortalezas = fortalezasRaw.map(texto).filter((f) => f.length > 3).slice(0, 8);

  const brechasRaw = Array.isArray(crudo.brechas) ? crudo.brechas : [];
  const brechas: BrechaNueva[] = [];

  for (const item of brechasRaw) {
    if (!esObjeto(item)) continue;

    const titulo = texto(item.titulo);
    const evidencia = texto(item.evidencia);
    const porQueImporta = texto(item.porQueImporta);
    if (!titulo || !evidencia || !porQueImporta) continue;

    const aprenderRaw = esObjeto(item.aprender) ? item.aprender : {};
    const que = texto(aprenderRaw.que);
    const como = texto(aprenderRaw.como);
    const comoLoDemuestro = texto(aprenderRaw.comoLoDemuestro);
    if (!que || !como) continue;

    const categoria = CATEGORIAS_VALIDAS.includes(item.categoria as CategoriaBrecha)
      ? (item.categoria as CategoriaBrecha)
      : "conocimiento";

    const severidad = SEVERIDADES_VALIDAS.includes(item.severidad as Severidad)
      ? (item.severidad as Severidad)
      : "media";

    brechas.push({
      categoria,
      titulo,
      evidencia,
      porQueImporta,
      severidad,
      aprender: { que, como, comoLoDemuestro: comoLoDemuestro || "—" },
    });
  }

  if (brechas.length === 0) {
    throw new Error("El modelo no produjo ninguna brecha utilizable (faltan título, evidencia o acción).");
  }

  return {
    ocupacion,
    nivel: texto(crudo.nivel) || "No determinado",
    resumen: texto(crudo.resumen) || "Sin resumen.",
    fortalezas,
    brechas,
  };
}

export function extraerJson(textoCrudo: string): unknown {
  const limpio = textoCrudo.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(limpio);
}
