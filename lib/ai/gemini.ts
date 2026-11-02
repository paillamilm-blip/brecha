import type { ArchivoCv, ProveedorAnalisis, ResultadoProveedor } from "../types";
import { extraerJson, validarResultado } from "./validar";

const MODELO_POR_DEFECTO = "gemini-2.5-flash";
const LIMITE_BYTES = 15 * 1024 * 1024;

const PROMPT = `Eres analista de desarrollo profesional. Recibes un CV en PDF.

Trabaja en este orden y no te saltes el paso 2:

PASO 1 — Identifica la ocupación y el nivel real del CV (no el que la persona quisiera, el que se sostiene con su experiencia).

PASO 2 — Construye el perfil de referencia: qué tiene un profesional FUERTE de esa misma ocupación, en ese mismo nivel y en el mercado donde ese CV buscaría trabajo. Incluye habilidades duras, habilidades blandas, conocimientos y credenciales. Este perfil no se muestra en la salida, pero es la base obligatoria de la comparación.

PASO 3 — Compara el CV contra ese perfil de referencia y reporta solo las diferencias reales.

REGLAS DURAS:
- Cada brecha DEBE citar evidencia: una frase textual del CV entre comillas, o la palabra "Ausente en el CV" seguida de qué buscaste y no estaba.
- PROHIBIDO el consejo que le serviría a cualquier profesional ("mejorar la comunicación", "ser proactivo", "seguir aprendiendo"). Si la brecha sería cierta para un contador, un enfermero y un programador por igual, no es una brecha: bórrala.
- PROHIBIDO inventar experiencia, fechas, cargos o idiomas que no estén en el CV.
- Entre 6 y 10 brechas. Ordenadas de mayor a menor impacto en la carrera.
- Reparte las categorías: no todas duras, no todas blandas.
- "aprender.que" nombra la habilidad o conocimiento concreto a adquirir.
- "aprender.como" es una acción que la persona puede empezar esta semana, con costo cero o bajo, y dice cuánto tiempo toma.
- "aprender.comoLoDemuestro" es la prueba observable de que la brecha se cerró (algo que se pueda poner en el CV o mostrar).

IDIOMA: escribe toda la salida en el mismo idioma en que está escrito el CV.

Devuelve ÚNICAMENTE JSON válido con esta forma exacta:
{
  "ocupacion": "string",
  "nivel": "string",
  "resumen": "string de 3 a 5 frases con el diagnóstico general, sin halagos vacíos",
  "fortalezas": ["string con evidencia del CV", ...],
  "brechas": [
    {
      "categoria": "dura" | "blanda" | "conocimiento" | "credencial",
      "titulo": "nombre corto de la brecha",
      "evidencia": "cita textual del CV o 'Ausente en el CV: ...'",
      "porQueImporta": "por qué esta brecha frena la carrera en ESTA ocupación",
      "severidad": "alta" | "media" | "baja",
      "aprender": {
        "que": "string",
        "como": "string",
        "comoLoDemuestro": "string"
      }
    }
  ]
}`;

export const proveedorGemini: ProveedorAnalisis = {
  nombre: "gemini",
  simulado: false,

  async analizar(archivo: ArchivoCv): Promise<ResultadoProveedor> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "Falta GEMINI_API_KEY. Crea una clave gratuita en Google AI Studio y pégala en .env.local, o vuelve a ANALISIS_PROVEEDOR=fixture.",
      );
    }
    if (archivo.bytes.byteLength > LIMITE_BYTES) {
      throw new Error("El PDF supera los 15 MB. Exporta una versión más liviana o solo las páginas relevantes.");
    }

    const modelo = process.env.GEMINI_MODELO?.trim() || MODELO_POR_DEFECTO;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

    const respuesta = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inlineData: { mimeType: archivo.mime || "application/pdf", data: archivo.bytes.toString("base64") } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      }),
    });

    const cuerpo = await respuesta.text();

    if (!respuesta.ok) {
      let detalle = cuerpo.slice(0, 300);
      try {
        detalle = JSON.parse(cuerpo)?.error?.message ?? detalle;
      } catch {
        /* el cuerpo no era JSON: se muestra el recorte */
      }
      if (respuesta.status === 429) {
        throw new Error(
          `Se agotó la cuota gratuita del modelo (${detalle}). Mañana se renueva, o baja ANALISIS_TOPE_DIARIO.`,
        );
      }
      throw new Error(`La IA respondió ${respuesta.status}: ${detalle}`);
    }

    let texto: string;
    try {
      const json = JSON.parse(cuerpo);
      texto = (json?.candidates?.[0]?.content?.parts ?? [])
        .map((p: { text?: string }) => p.text ?? "")
        .join("")
        .trim();
    } catch {
      throw new Error("No se pudo leer la respuesta de la IA (JSON inválido en la respuesta HTTP).");
    }

    if (!texto) {
      const bloqueo = JSON.parse(cuerpo)?.candidates?.[0]?.finishReason;
      throw new Error(
        `La IA devolvió una respuesta vacía${bloqueo ? ` (motivo: ${bloqueo})` : ""}. Revisa que el modelo ${modelo} exista y acepte PDFs.`,
      );
    }

    return validarResultado(extraerJson(texto));
  },
};
