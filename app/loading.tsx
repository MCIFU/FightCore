import { Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="wrap" style={{ paddingTop: "var(--s-7)", display: "grid", gap: 14 }} aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Cargando…</span>
      <Skeleton w="18%" h={12} />
      <Skeleton w="54%" h={72} />
      <Skeleton w="38%" h={18} />
      <div style={{ display: "grid", gap: 10, marginTop: 32 }}>{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={44} />)}</div>
    </div>
  );
}
