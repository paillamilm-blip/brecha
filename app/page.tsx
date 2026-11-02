import Link from "next/link";
import SubirCv from "@/components/SubirCv";
import { estadoProveedor } from "@/lib/ai";
import { listarAnalisis, metricaGlobal, usoDeHoy, USUARIO_LOCAL } from "@/lib/store";
import { brechasConfirmadas } from "@/lib/types";

export const dynamic = "force-dynamic";

function fecha(iso: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const PASOS = [
  { n: "1", t: "Subes tu CV", d: "Un PDF. Nada más: no llenas formularios ni describes tu cargo." },
  { n: "2", t: "Se arma tu referencia", d: "El sistema detecta tu profesión y nivel, y construye el perfil de alguien fuerte en eso mismo." },
  { n: "3", t: "Ves las brechas", d: "Cada una con la evidencia en tu propio documento y qué aprender esta semana para cerrarla." },
];

export default function PaginaInicio() {
  const proveedor = estadoProveedor();
  const historial = listarAnalisis(USUARIO_LOCAL);
  const metrica = metricaGlobal(USUARIO_LOCAL);
  const uso = usoDeHoy();

  return (
    <>
      <section className="hero">
        <h1>Tu CV ya dice qué te falta. Falta convertirlo en un plan.</h1>
        <p>
          Sube tu CV y compara tu perfil real contra el de un profesional fuerte de tu misma ocupación y nivel. Cada
          brecha sale con la evidencia en tu propio documento y con la acción concreta para cerrarla.
        </p>
      </section>

      {proveedor.simulado && (
        <div className="aviso aviso-sim" style={{ marginTop: 0, marginBottom: 22 }}>
          <strong>Modo simulado activo.</strong> Estás viendo un análisis de muestra, no el de tu CV: sirve para
          recorrer la app completa sin gastar cuota. Para conectar la IA real cambia dos líneas en{" "}
          <code>.env.local</code> (proveedor y clave) y reinicia. Nada más cambia.
        </div>
      )}

      <div className="shell-inicio">
        <div>
          <SubirCv restantes={uso.restantes} simulado={proveedor.simulado} />

          <details className="como-funciona">
            <summary>Cómo funciona en 3 pasos</summary>
            <ol>
              {PASOS.map((p) => (
                <li key={p.n}>
                  <strong>{p.t}.</strong> {p.d}
                </li>
              ))}
            </ol>
          </details>
        </div>

        <aside className="estado-lateral" aria-label="Tu estado e historial">
          <div className="card">
            <h2 className="card-titulo">Tu estado</h2>
            <div className="metrica-lista">
              <div className="metrica-fila">
                <b>{metrica.totalAnalisis}</b>
                <span>Análisis hechos</span>
              </div>
              <div className="metrica-fila">
                <b>{metrica.brechas}</b>
                <span>Brechas detectadas</span>
              </div>
              <div className="metrica-fila">
                <b>{metrica.confirmadas}</b>
                <span>Confirmadas por ti</span>
              </div>
              <div className="metrica-fila">
                <b>{metrica.precision === null ? "—" : `${metrica.precision}%`}</b>
                <span>Precisión del análisis</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-titulo">Tus análisis</h2>
            {historial.length === 0 ? (
              <div className="vacio">Cuando analices tu primer CV, aparecerá aquí con su puntaje de precisión.</div>
            ) : (
              <div className="lista">
                {historial.map(({ analisis, cv }) => {
                  const { confirmadas, total } = brechasConfirmadas(analisis.brechas);
                  return (
                    <Link href={`/reporte/${analisis.id}`} className="item-historial" key={analisis.id}>
                      <div className="item-historial-main">
                        <div className="item-historial-titulo">{analisis.ocupacion}</div>
                        <div className="item-historial-sub">
                          {analisis.nivel} · {fecha(analisis.creadoEn)}
                          {cv ? ` · ${cv.nombreArchivo}` : ""}
                        </div>
                      </div>
                      {analisis.simulado && <span className="badge badge-sim">Simulado</span>}
                      <span className="badge">
                        {confirmadas}/{total} confirmadas
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
