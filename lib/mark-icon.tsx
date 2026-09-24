import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Mark is black on transparent: a light tile keeps it visible on dark tab bars.
export async function markIcon(px: number, radius = 0) {
  const mark = await readFile(join(process.cwd(), "public/logos/jalmeida-mark.png"));
  const w = Math.round(px * 0.86);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f1e8", borderRadius: radius }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={`data:image/png;base64,${mark.toString("base64")}`} width={w} height={Math.round((w * 608) / 1118)} />
      </div>
    ),
    { width: px, height: px },
  );
}
