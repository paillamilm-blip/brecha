import { notFound } from "next/navigation";
import PanelReporte from "@/components/PanelReporte";
import { compararAnalisis } from "@/lib/comparar";
import { listarAnalisis, obtenerAnalisis, USUARIO_LOCAL } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PaginaReporte({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encontrado = obtenerAnalisis(id, USUARIO_LOCAL);
  if (!encontrado) notFound();

  const { analisis, cv } = encontrado;

  // Solo comparo con un análisis anterior de la misma ocupación: comparar perfiles
  // distintos generaría "brechas cerradas" que en realidad son cambios de objetivo.
  const previo = listarAnalisis(USUARIO_LOCAL)
    .map((x) => x.analisis)
    .filter((a) => a.id !== analisis.id && a.ocupacion === analisis.ocupacion && a.creadoEn < analisis.creadoEn)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))[0];

  const comparacion = previo
    ? compararAnalisis({ id: previo.id, creadoEn: previo.creadoEn, brechas: previo.brechas }, analisis.brechas, analisis.creadoEn)
    : null;

  return (
    <PanelReporte
      analisisId={analisis.id}
      ocupacion={analisis.ocupacion}
      nivel={analisis.nivel}
      creadoEn={analisis.creadoEn}
      nombreArchivo={cv?.nombreArchivo ?? null}
      simulado={analisis.simulado}
      proveedor={analisis.proveedor}
      resumen={analisis.resumen}
      fortalezas={analisis.fortalezas}
      brechas={analisis.brechas}
      comparacion={comparacion}
    />
  );
}
