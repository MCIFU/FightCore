import type { Metadata } from "next";
import { CornerMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Sin conexión", robots: { index: false } };

export default function Offline() {
  return (
    <div className="wrap" style={{ padding: "var(--s-9) var(--gutter)", display: "grid", gap: 20, justifyItems: "start" }}>
      <CornerMark size={48} />
      <p className="label">Sin conexión</p>
      <h1 className="display" style={{ fontSize: "var(--fs-3xl)" }}>Entre rounds</h1>
      <p className="serif" style={{ fontSize: "var(--fs-lg)", color: "var(--bone-2)", maxWidth: "44ch" }}>
        No hay conexión y esta página aún no está guardada en el dispositivo. Las páginas que ya visitaste y la búsqueda siguen disponibles sin conexión.
      </p>
      <ButtonLink href="/">Volver al inicio</ButtonLink>
    </div>
  );
}
