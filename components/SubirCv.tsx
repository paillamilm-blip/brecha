"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import EscaneoCv from "./EscaneoCv";

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Un CV firmado suele pesar 150–400 KB: en MB con dos decimales daría "0.00 MB".
function peso(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function SubirCv({ restantes, simulado }: { restantes: number; simulado: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [etapa, setEtapa] = useState(-1);
  const [totalBrechas, setTotalBrechas] = useState<number | null>(null);
  const [fallido, setFallido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const escaneando = etapa >= 0 && !fallido;

  function elegir(candidato: File | null | undefined) {
    setError(null);
    setFallido(false);
    if (!candidato) return;
    if (candidato.type !== "application/pdf") {
      setArchivo(null);
      setError(`"${candidato.name}" no es un PDF. Si tu CV está en Word, expórtalo a PDF y súbelo de nuevo.`);
      return;
    }
    setArchivo(candidato);
  }

  async function analizar() {
    if (!archivo || escaneando) return;
    setError(null);
    setFallido(false);
    setTotalBrechas(null);
    setEtapa(0);
    await dormir(500);
    setEtapa(1);

    const form = new FormData();
    form.append("cv", archivo);

    try {
      const promesa = fetch("/api/analisis", { method: "POST", body: form });
      await dormir(550);
      setEtapa(2);
      const res = await promesa;
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error ?? `El servidor respondió ${res.status}.`);

      setTotalBrechas(json.brechas ?? 0);
      setEtapa(3);
      await dormir(700);
      setEtapa(4);
      await dormir(420);
      router.push(`/reporte/${json.id}`);
      router.refresh();
    } catch (e) {
      setFallido(true);
      setError(e instanceof Error ? e.message : "Falló la subida.");
    }
  }

  const bloqueado = !simulado && restantes <= 0;

  return (
    <section className="card">
      <h2 className="card-titulo">1 · Sube tu CV</h2>

      <div
        className="dropzone"
        data-activo={arrastrando}
        data-bloqueado={escaneando}
        onClick={() => !escaneando && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (!escaneando) elegir(e.dataTransfer.files?.[0]);
        }}
      >
        <strong>{archivo ? archivo.name : "Arrastra tu CV aquí o haz clic para elegirlo"}</strong>
        <span>
          {archivo
            ? `${peso(archivo.size)} · listo para analizar`
            : "Solo PDF, hasta 15 MB. El archivo queda en tu máquina."}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => elegir(e.target.files?.[0])}
        />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
        <button
          className="boton boton-primario"
          onClick={analizar}
          disabled={!archivo || escaneando || bloqueado}
        >
          {escaneando ? "Analizando…" : "Analizar mi CV"}
        </button>
        {!simulado && (
          <span style={{ color: "var(--dim)", fontSize: 13 }}>
            {bloqueado ? "Tope diario alcanzado" : `Quedan ${restantes} análisis hoy`}
          </span>
        )}
      </div>

      {etapa >= 0 && (
        <EscaneoCv
          etapa={etapa}
          kb={peso(archivo?.size ?? 0)}
          totalBrechas={totalBrechas}
          fallido={fallido}
        />
      )}

      {error && (
        <div className="aviso aviso-error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
