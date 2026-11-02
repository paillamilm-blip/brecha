# Brecha

Sube tu CV en PDF y el sistema te muestra las brechas reales entre tu perfil y el de un
profesional fuerte de tu misma ocupación y nivel, con la evidencia en tu propio documento
y qué aprender esta semana para cerrar cada una.

## Correr la app

```bash
npm install
npm run dev
```

Abre http://localhost:3000

Arranca en **modo simulado**: un análisis de muestra, sin IA y sin costo, para recorrer
toda la app. Los datos se guardan en `data/` (tu máquina, no sale de ahí).

Para tener un PDF con qué probar sin usar tu CV real:

```bash
node tools/generar-pdf-ejemplo.mjs
```

## Conectar la IA real (2 líneas)

1. Crea una clave gratuita en Google AI Studio: https://aistudio.google.com
2. Edita `.env.local` y deja estas dos líneas:

```
ANALISIS_PROVEEDOR=gemini
GEMINI_API_KEY=pega_aqui_tu_clave
```

3. Reinicia el servidor (Ctrl+C y `npm run dev`).

Nada más cambia: ni pantallas, ni tablas, ni botones. El adaptador de IA
(`lib/ai/index.ts`) es el único lugar que sabe qué modelo está corriendo.

Opcional en `.env.local`:

- `GEMINI_MODELO` — nombre del modelo (por defecto `gemini-2.5-flash`).
- `ANALISIS_TOPE_DIARIO` — cuántos análisis reales por día (por defecto 10), para no
  quemar la cuota gratuita de un golpe.

## La métrica que importa

**Brechas confirmadas por análisis.** En cada reporte marcas cada brecha como
"Es real" o "No aplica". Si menos de 6 de cada 10 son reales, el problema no es la
interfaz: es el perfil de referencia que usa el modelo, y se ajusta el prompt.

## Estructura

- `app/` — pantallas y rutas API (Next.js App Router)
- `lib/store.ts` — persistencia local en JSON, con `userId` en cada fila desde el día uno
- `lib/comparar.ts` — aparea las brechas de dos análisis del mismo CV para saber qué se cerró
- `lib/ai/` — adaptador: `fixture` (muestra) y `gemini` (IA real por REST, sin SDK)
- `components/` — subida de CV, escáner, mapa de capacidades y reporte de brechas
- `tools/` — generador del PDF de prueba

## Fases acordadas

1. **1a (esta)**: app completa local, sin claves. ✔ hecha
2. **1b**: conectar clave gratuita y validar con 10 CVs reales que ≥6/10 brechas sean confirmadas.
3. **2**: Supabase (login multiusuario), tope diario y cola cuando se agota la cuota.
4. **3**: plan de aprendizaje persistente. El re-análisis ya compara contra el CV anterior y
   marca qué brechas cerraste; falta el plan de estudio sostenido.
