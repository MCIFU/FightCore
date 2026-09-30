"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap" style={{ padding: "var(--s-9) var(--gutter)", display: "grid", gap: 20, justifyItems: "start" }} role="alert">
      <p className="label" style={{ color: "var(--danger)" }}>Error del sistema</p>
      <h1 className="display" style={{ fontSize: "var(--fs-2xl)" }}>No hemos podido cargar estos datos</h1>
      <p className="serif" style={{ color: "var(--bone-2)", maxWidth: "48ch" }}>No es culpa tuya. Vuelve a intentarlo; si persiste, el proveedor de datos puede estar caído.</p>
      <button type="button" onClick={reset} style={{ minHeight: 44, padding: "0 18px", background: "var(--bone)", color: "var(--ink-0)", fontWeight: 600 }}>Reintentar</button>
    </div>
  );
}
