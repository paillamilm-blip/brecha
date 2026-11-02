export type CategoriaBrecha = "dura" | "blanda" | "conocimiento" | "credencial";

export type Severidad = "alta" | "media" | "baja";

export type Veredicto = "confirmada" | "rechazada" | null;

export type Aprender = {
  que: string;
  como: string;
  comoLoDemuestro: string;
};

export type Brecha = {
  id: string;
  categoria: CategoriaBrecha;
  titulo: string;
  evidencia: string;
  porQueImporta: string;
  severidad: Severidad;
  aprender: Aprender;
  veredicto: Veredicto;
  veredictoEn: string | null;
  dominadaEn: string | null;
};

export type BrechaNueva = Omit<Brecha, "id" | "veredicto" | "veredictoEn" | "dominadaEn">;

export type MotivoCerrada = "dominada" | "no_aparece";

export type BrechaCerrada = {
  id: string;
  titulo: string;
  categoria: CategoriaBrecha;
  severidad: Severidad;
  fecha: string;
  motivo: MotivoCerrada;
};

export type ComparacionAnalisis = {
  anteriorId: string;
  anteriorEn: string;
  cerradas: BrechaCerrada[];
  nuevasIds: string[];
  persistenIds: string[];
};

export type ResultadoProveedor = {
  ocupacion: string;
  nivel: string;
  resumen: string;
  fortalezas: string[];
  brechas: BrechaNueva[];
};

export type ProveedorAnalisis = {
  nombre: string;
  simulado: boolean;
  analizar(archivo: ArchivoCv): Promise<ResultadoProveedor>;
};

export type ArchivoCv = {
  nombre: string;
  mime: string;
  bytes: Buffer;
};

export type Cv = {
  id: string;
  userId: string;
  nombreArchivo: string;
  mime: string;
  tamanio: number;
  ruta: string;
  subidoEn: string;
};

export type Analisis = {
  id: string;
  cvId: string;
  userId: string;
  creadoEn: string;
  proveedor: string;
  simulado: boolean;
  ocupacion: string;
  nivel: string;
  resumen: string;
  fortalezas: string[];
  brechas: Brecha[];
};

export type Db = {
  cvs: Cv[];
  analisis: Analisis[];
  uso: Record<string, number>;
};

export const CATEGORIAS: Record<CategoriaBrecha, string> = {
  dura: "Habilidad dura",
  blanda: "Habilidad blanda",
  conocimiento: "Conocimiento",
  credencial: "Credencial",
};

export function brechasConfirmadas(brechas: Brecha[]) {
  const confirmadas = brechas.filter((b) => b.veredicto === "confirmada").length;
  const rechazadas = brechas.filter((b) => b.veredicto === "rechazada").length;
  return { confirmadas, rechazadas, revisadas: confirmadas + rechazadas, total: brechas.length };
}
