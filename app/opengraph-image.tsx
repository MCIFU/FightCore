import { ImageResponse } from "next/og";

export const alt = "FIGHTCORE — The core of MMA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0B0C0E", color: "#ECE6DA", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72 }}>
        <svg width="96" height="96" viewBox="0 0 24 24">
          <path d="M2 11V2h9" fill="none" stroke="#ECE6DA" strokeWidth="3" strokeLinecap="square" />
          <path d="M22 13v9h-9" fill="none" stroke="#ECE6DA" strokeWidth="3" strokeLinecap="square" />
          <rect x="9" y="9" width="6" height="6" fill="#EC6528" />
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
