import { NextResponse } from "next/server";
import { marcarBrecha, marcarDominada, metricaGlobal, USUARIO_LOCAL } from "@/lib/store";
import type { Veredicto } from "@/lib/types";

export const dynamic = "force-dynamic";

const VEREDICTOS: Veredicto[] = ["confirmada", "rechazada", null];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "El cuerpo no era JSON." }, { status: 400 });
  }

  const analisisId = typeof cuerpo.analisisId === "string" ? cuerpo.analisisId : "";
  if (!analisisId) {
    return NextResponse.json({ ok: false, error: "Falta analisisId." }, { status: 400 });
  }

  if (cuerpo.dominada === true) {
    const brecha = marcarDominada({ analisisId, brechaId: id, userId: USUARIO_LOCAL });
    if (!brecha) {
      return NextResponse.json(
        { ok: false, error: "Solo se puede marcar como dominada una brecha que antes reconociste como real." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, brecha, metrica: metricaGlobal(USUARIO_LOCAL) });
  }

  const valor = (cuerpo.veredicto ?? null) as Veredicto;
  if (!VEREDICTOS.includes(valor)) {
    return NextResponse.json(
      { ok: false, error: "veredicto debe ser confirmada, rechazada o null." },
      { status: 400 },
    );
  }

  const brecha = marcarBrecha({ analisisId, brechaId: id, veredicto: valor, userId: USUARIO_LOCAL });
  if (!brecha) {
    return NextResponse.json({ ok: false, error: "No se encontró esa brecha." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, brecha, metrica: metricaGlobal(USUARIO_LOCAL) });
}
