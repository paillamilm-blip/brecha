import { NextResponse } from "next/server";
import { obtenerProveedor } from "@/lib/ai";
import { guardarAnalisis, guardarCv, usoDeHoy, USUARIO_LOCAL } from "@/lib/store";

export const dynamic = "force-dynamic";

const MIMES_PERMITIDOS = ["application/pdf"];
const TAMANIO_MAXIMO = 15 * 1024 * 1024;

function error(mensaje: string, estado: number) {
  return NextResponse.json({ ok: false, error: mensaje }, { status: estado });
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return error("La subida no llegó como formulario multipart.", 400);
  }

  const archivo = form.get("cv");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return error("Selecciona un archivo. Por ahora solo se acepta PDF.", 400);
  }
  if (!MIMES_PERMITIDOS.includes(archivo.type)) {
    return error(
      `El archivo es "${archivo.type || "de tipo desconocido"}". Por ahora solo se acepta PDF: si tu CV está en Word, expórtalo a PDF.`,
      415,
    );
  }
  if (archivo.size > TAMANIO_MAXIMO) {
    return error("El PDF pesa más de 15 MB. Exporta una versión más liviana.", 413);
  }

  const proveedor = obtenerProveedor();

  if (!proveedor.simulado) {
    const { restantes } = usoDeHoy();
    if (restantes <= 0) {
      return error(
        `Se alcanzó el tope de ${usoDeHoy().tope} análisis de hoy. La cuota gratuita se renueva a la medianoche (hora del Pacífico).`,
        429,
      );
    }
  }

  const bytes = Buffer.from(await archivo.arrayBuffer());

  try {
    const cv = guardarCv({
      userId: USUARIO_LOCAL,
      nombreArchivo: archivo.name,
      mime: archivo.type,
      bytes,
    });

    const resultado = await proveedor.analizar({ nombre: archivo.name, mime: archivo.type, bytes });
    const analisis = guardarAnalisis({
      cv,
      proveedor: proveedor.nombre,
      simulado: proveedor.simulado,
      resultado,
    });

    return NextResponse.json({
      ok: true,
      id: analisis.id,
      ocupacion: analisis.ocupacion,
      brechas: analisis.brechas.length,
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Falló el análisis por un motivo inesperado.";
    const estado = mensaje.includes("cuota") || mensaje.includes("429") ? 429 : 502;
    return error(mensaje, estado);
  }
}
