import StampSticker from "@/components/ui/stamp";

// TEMP: visual check of generated stamps.
export default function Preview() {
  const seeds = [...Array.from({ length: 22 }, (_, i) => (i * 2654435761) | 0), 12345, 999];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, padding: 20, background: "#f6f1e3" }}>
      {seeds.map((seed, i) => (
        <div key={i} style={{ position: "relative", aspectRatio: 1, containerType: "inline-size" }}>
          <StampSticker s={{ id: i + 1, seed, ff: i >= 22, country: "BR", face: 0, x: 50, y: 50, date: "2026-09-24T12:00:00Z" }} style={{ left: "50%", top: "50%", width: "90cqi" }} />
        </div>
      ))}
    </div>
  );
}
