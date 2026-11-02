// Genera un PDF minimo y valido para probar la subida sin depender de un CV real.
// Uso: node tools/generar-pdf-ejemplo.mjs [ruta-salida]
import fs from "node:fs";
import path from "node:path";

const LINEAS = [
  ["CURRICULUM VITAE", 18, 720],
  ["Nombre: Persona de Prueba", 11, 686],
  ["Perfil: Profesional con 7 anos de experiencia en gestion de operaciones.", 11, 668],
  ["", 11, 650],
  ["EXPERIENCIA", 13, 632],
  ["Coordinador de Operaciones, Empresa S.A., 2020 a la fecha", 11, 612],
  ["Responsable de la supervision de procesos y del equipo de terreno.", 11, 596],
  ["Analista de Procesos, Otra Empresa Ltda., 2017 a 2020", 11, 576],
  ["Apoyo en la ejecucion de procedimientos internos y reportes mensuales.", 11, 560],
  ["", 11, 542],
  ["FORMACION", 13, 524],
  ["Titulo profesional, Universidad de Chile, 2016", 11, 504],
  ["", 11, 486],
  ["HERRAMIENTAS", 13, 468],
  ["Microsoft Office, correo corporativo, sistema interno de la empresa.", 11, 448],
  ["", 11, 430],
  ["IDIOMAS", 13, 412],
  ["Espanol nativo. Ingles intermedio.", 11, 392],
];

function escapar(texto) {
  return texto.replace(/([\\()])/g, "\\$1");
}

function objeto(num, cuerpo) {
  return `${num} 0 obj\n${cuerpo}\nendobj\n`;
}

const contenido = LINEAS.map(([texto, tam, y]) => `BT /F1 ${tam} Tf 60 ${y} Td (${escapar(texto)}) Tj ET`).join("\n");

const objetos = [
  objeto(1, "<< /Type /Catalog /Pages 2 0 R >>"),
  objeto(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
  objeto(
    3,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
  ),
  objeto(4, `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`),
  objeto(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
];

let pdf = "%PDF-1.4\n";
const offsets = [];
for (const o of objetos) {
  offsets.push(Buffer.byteLength(pdf, "binary"));
  pdf += o;
}

const xrefPos = Buffer.byteLength(pdf, "binary");
pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;

const salida = process.argv[2] ?? path.join(process.cwd(), "data", "cv-ejemplo.pdf");
fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.writeFileSync(salida, Buffer.from(pdf, "binary"));
console.log(`PDF de prueba creado en: ${salida}`);
