"use client";

const HITOS = [
  (kb: string) => `PDF recibido (${kb})`,
  () => "Enviado al análisis",
  () => "Leyendo el documento, armando tu perfil de referencia y comparando",
  (n: string) => `${n} brechas registradas en tu mapa`,
];

export default function EscaneoCv({
  etapa,
  kb,
  totalBrechas,
  fallido,
}: {
  etapa: number;
  kb: string;
  totalBrechas: number | null;
  fallido: boolean;
}) {
  const terminado = etapa >= HITOS.length;
  const activo = !terminado && !fallido;

  return (
    <div className="escaneo" role="status" aria-live="polite">
      <svg className="escaneo-doc" viewBox="0 0 120 152" aria-hidden="true">
        <rect x="8" y="6" width="104" height="140" rx="8" className="escaneo-hoja" />
        {[26, 40, 54, 68, 82, 96, 110].map((y, i) => (
          <rect
            key={y}
            x="20"
            y={y}
            width={i % 3 === 2 ? 52 : 80}
            height="5"
            rx="2.5"
            className="escaneo-linea"
            style={{ animationDelay: `${i * 180}ms` }}
            data-activo={activo}
            data-listo={terminado}
          />
        ))}
        <g className="escaneo-haz" data-activo={activo}>
          <rect x="8" y="0" width="104" height="3" rx="1.5" />
          <rect x="8" y="-7" width="104" height="14" rx="7" className="escaneo-haz-bruma" />
        </g>
      </svg>

      <ol className="escaneo-hitos">
        {HITOS.map((fabrica, i) => {
          const texto = fabrica(i === 0 ? kb : i === 3 ? String(totalBrechas ?? "…") : "");
          const estado = fallido && i === etapa ? "fallido" : i < etapa || terminado ? "listo" : i === etapa ? "activo" : "pendiente";
          return (
            <li key={i} className={`escaneo-hito escaneo-hito-${estado}`}>
              <span className="escaneo-marca" aria-hidden="true">
                {estado === "listo" ? (
                  <svg viewBox="0 0 16 16" width="13" height="13">
                    <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : estado === "activo" ? (
                  <span className="spinner" />
                ) : estado === "fallido" ? (
                  "!"
                ) : (
                  ""
                )}
              </span>
              {texto}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
