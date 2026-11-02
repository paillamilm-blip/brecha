import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { Analisis, Brecha, Cv, Db, ResultadoProveedor, Veredicto } from "./types";

const RAIZ = path.join(process.cwd(), "data");
const DB_PATH = path.join(RAIZ, "db.json");
const UPLOADS = path.join(RAIZ, "uploads");

// Fase 1a es local y de un solo usuario. Todas las filas ya llevan userId para
// que agregar el login en fase 2 no obligue a migrar datos.
export const USUARIO_LOCAL = "usuario-local";

const DB_VACIA: Db = { cvs: [], analisis: [], uso: {} };

function asegurarCarpetas() {
  fs.mkdirSync(UPLOADS, { recursive: true });
}

export function leerDb(): Db {
  asegurarCarpetas();
  if (!fs.existsSync(DB_PATH)) return { ...DB_VACIA };
  const crudo = fs.readFileSync(DB_PATH, "utf8");
  if (!crudo.trim()) return { ...DB_VACIA };
  const db = JSON.parse(crudo) as Db;
  return {
    cvs: db.cvs ?? [],
    analisis: db.analisis ?? [],
    uso: db.uso ?? {},
  };
}

function guardarDb(db: Db) {
  asegurarCarpetas();
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}

function claveDia(d: Date = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function topeDiario() {
  const crudo = Number(process.env.ANALISIS_TOPE_DIARIO);
  return Number.isFinite(crudo) && crudo > 0 ? crudo : 10;
}

export function usoDeHoy(): { usados: number; tope: number; restantes: number } {
  const db = leerDb();
  const usados = db.uso[claveDia()] ?? 0;
  const tope = topeDiario();
  return { usados, tope, restantes: Math.max(0, tope - usados) };
}

function incrementarUso() {
  const db = leerDb();
  const dia = claveDia();
  db.uso = { ...db.uso, [dia]: (db.uso[dia] ?? 0) + 1 };
  guardarDb(db);
}

export function guardarCv(input: { userId: string; nombreArchivo: string; mime: string; bytes: Buffer }): Cv {
  asegurarCarpetas();
  const id = randomUUID();
  const seguro = `${id}-${input.nombreArchivo.replace(/[^\w.\-]+/g, "_")}`;
  const ruta = path.join(UPLOADS, seguro);
  fs.writeFileSync(ruta, input.bytes);

  const cv: Cv = {
    id,
    userId: input.userId,
    nombreArchivo: input.nombreArchivo,
    mime: input.mime,
    tamanio: input.bytes.byteLength,
    ruta,
    subidoEn: new Date().toISOString(),
  };

  const db = leerDb();
  db.cvs.push(cv);
  guardarDb(db);
  return cv;
}

export function guardarAnalisis(input: {
  cv: Cv;
  proveedor: string;
  simulado: boolean;
  resultado: ResultadoProveedor;
}): Analisis {
  const db = leerDb();
  const analisis: Analisis = {
    id: randomUUID(),
    cvId: input.cv.id,
    userId: input.cv.userId,
    creadoEn: new Date().toISOString(),
    proveedor: input.proveedor,
    simulado: input.simulado,
    ocupacion: input.resultado.ocupacion,
    nivel: input.resultado.nivel,
    resumen: input.resultado.resumen,
    fortalezas: input.resultado.fortalezas,
    brechas: input.resultado.brechas.map((b) => ({
      ...b,
      id: randomUUID(),
      veredicto: null,
      veredictoEn: null,
      dominadaEn: null,
    })),
  };
  db.analisis.push(analisis);
  guardarDb(db);

  if (!input.simulado) incrementarUso();
  return analisis;
}

export function listarAnalisis(userId: string) {
  const db = leerDb();
  const porId = new Map(db.cvs.map((cv) => [cv.id, cv]));
  return db.analisis
    .filter((a) => a.userId === userId)
    .map((a) => ({ analisis: a, cv: porId.get(a.cvId) }))
    .sort((x, y) => y.analisis.creadoEn.localeCompare(x.analisis.creadoEn));
}

export function obtenerAnalisis(id: string, userId: string) {
  const db = leerDb();
  const analisis = db.analisis.find((a) => a.id === id && a.userId === userId);
  if (!analisis) return null;
  return { analisis, cv: db.cvs.find((c) => c.id === analisis.cvId) ?? null };
}

export function marcarBrecha(input: {
  analisisId: string;
  brechaId: string;
  veredicto: Veredicto;
  userId: string;
}): Brecha | null {
  const db = leerDb();
  const analisis = db.analisis.find((a) => a.id === input.analisisId && a.userId === input.userId);
  if (!analisis) return null;
  const brecha = analisis.brechas.find((b) => b.id === input.brechaId);
  if (!brecha) return null;
  brecha.veredicto = input.veredicto;
  brecha.veredictoEn = input.veredicto ? new Date().toISOString() : null;
  if (input.veredicto !== "confirmada") brecha.dominadaEn = null;
  guardarDb(db);
  return brecha;
}

export function marcarDominada(input: {
  analisisId: string;
  brechaId: string;
  userId: string;
}): Brecha | null {
  const db = leerDb();
  const analisis = db.analisis.find((a) => a.id === input.analisisId && a.userId === input.userId);
  if (!analisis) return null;
  const brecha = analisis.brechas.find((b) => b.id === input.brechaId);
  if (!brecha || brecha.veredicto !== "confirmada") return null;
  brecha.dominadaEn = new Date().toISOString();
  guardarDb(db);
  return brecha;
}

export function metricaGlobal(userId: string) {
  const db = leerDb();
  const brechas = db.analisis.filter((a) => a.userId === userId).flatMap((a) => a.brechas);
  const confirmadas = brechas.filter((b) => b.veredicto === "confirmada").length;
  const rechazadas = brechas.filter((b) => b.veredicto === "rechazada").length;
  const revisadas = confirmadas + rechazadas;
  return {
    totalAnalisis: db.analisis.filter((a) => a.userId === userId).length,
    brechas: brechas.length,
    revisadas,
    confirmadas,
    rechazadas,
    precision: revisadas ? Math.round((confirmadas / revisadas) * 100) : null,
  };
}
