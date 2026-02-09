import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pacha-Chain-Origin — Trazabilidad Blockchain Farm-to-Table";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a3a1a 0%, #2d5a27 40%, #6b3a0a 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "white",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "64px" }}>🌿</span>
          <span
            style={{
              fontSize: "20px",
              background: "rgba(255,255,255,0.15)",
              padding: "6px 16px",
              borderRadius: "20px",
            }}
          >
            Blockchain • Farm-to-Table • Ecuador
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "56px",
            fontWeight: 800,
            margin: "0 0 8px 0",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          Pacha-Chain-Origin
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "24px",
            color: "rgba(255,255,255,0.8)",
            margin: "0 0 32px 0",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Trazabilidad inmutable para cacao y café premium de Ecuador
        </p>

        {/* State badges */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {["🌱 Cosechado", "🫘 Fermentado", "☀️ Secado", "📦 Empacado", "🚢 Enviado", "✅ Entregado"].map(
            (label) => (
              <span
                key={label}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontSize: "16px",
                }}
              >
                {label}
              </span>
            )
          )}
        </div>

        {/* Bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            display: "flex",
            gap: "24px",
            fontSize: "16px",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span>ERC-1155 • Polygon • IPFS • OpenZeppelin</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
