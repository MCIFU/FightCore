import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0B0C0E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="112" height="112" viewBox="0 0 24 24">
          <path d="M2 11V2h9" fill="none" stroke="#ECE6DA" strokeWidth="3" strokeLinecap="square" />
          <path d="M22 13v9h-9" fill="none" stroke="#ECE6DA" strokeWidth="3" strokeLinecap="square" />
          <rect x="9" y="9" width="6" height="6" fill="#EC6528" />
        </svg>
      </div>
    ),
    size,
  );
}
