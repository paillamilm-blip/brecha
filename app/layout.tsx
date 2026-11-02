import type { Metadata, Viewport } from "next";
import Link from "next/link";
import BotonNuevoAnalisis from "@/components/BotonNuevoAnalisis";
import { estadoProveedor } from "@/lib/ai";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brecha · diagnóstico y plan de aprendizaje desde tu CV",
  description: "Sube tu CV y recibe las brechas reales frente a tu profesión, con qué aprender para cerrarlas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const proveedor = estadoProveedor();

  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <div className="topbar-in">
            <Link href="/" className="brand">
              <span className="brand-dot" />
              Brecha
            </Link>
            <div className="topbar-right">
              {proveedor.simulado ? (
                <span className="badge badge-sim">Modo simulado · sin IA</span>
              ) : (
                <span className="badge badge-ia">IA conectada · {proveedor.nombre}</span>
              )}
              <BotonNuevoAnalisis />
            </div>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
