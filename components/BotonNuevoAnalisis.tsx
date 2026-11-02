"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BotonNuevoAnalisis() {
  const pathname = usePathname();
  if (!pathname?.startsWith("/reporte")) return null;
  return (
    <Link href="/" className="boton boton-primario boton-topbar">
      Nuevo análisis
    </Link>
  );
}
