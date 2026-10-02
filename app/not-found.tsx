import { NucleoMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: "var(--s-9) var(--gutter)", display: "grid", gap: 24, justifyItems: "start" }}>
      <NucleoMark size={48} />
      <p className="label">Error 404 · Sin decisión</p>
      <h1 className="display" style={{ fontSize: "var(--fs-3xl)" }}>Esta página no subió a la jaula</h1>
      <p className="serif" style={{ fontSize: "var(--fs-lg)", color: "var(--bone-2)", maxWidth: "44ch" }}>
        El enlace puede estar roto o el expediente ya no existe. Prueba con la búsqueda (tecla /) o vuelve al inicio.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <ButtonLink href="/">Ir al inicio</ButtonLink>
        <ButtonLink href="/fighters" variant="ghost">Luchadores</ButtonLink>
      </div>
    </div>
  );
}
