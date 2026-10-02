import { ImageResponse } from "next/og";
import { MARK_SPEC, OCTAGON } from "@/components/brand/geometry";

export const alt = "FIGHTCORE — The core of MMA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0B0C0E", color: "#ECE6DA", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72 }}>
        <svg width="104" height="104" viewBox="0 0 24 24">
          <path d={OCTAGON} fill="none" stroke="#ECE6DA" strokeWidth={MARK_SPEC.large.stroke} />
          <rect x={12 - MARK_SPEC.large.core / 2} y={12 - MARK_SPEC.large.core / 2} width={MARK_SPEC.large.core} height={MARK_SPEC.large.core} fill="#EC6528" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: -4, lineHeight: 0.9 }}>FIGHTCORE</div>
          <div style={{ fontSize: 30, letterSpacing: 14, color: "#FF7A3D", marginTop: 24 }}>THE CORE OF MMA</div>
        </div>
      </div>
    ),
    size,
  );
}
