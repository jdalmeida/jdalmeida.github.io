#!/usr/bin/env python3
"""Gera as versões responsivas das fotos dos eventos.

As fotos aparecem em celas pequenas da galeria — no máximo ~360px de largura no
desktop — mas os arquivos originais têm 1600px ou mais. Este script grava cópias
menores ao lado do original, com o sufixo da largura, e a galeria monta o
`srcset` a partir delas.

    python3 scripts/generate-image-variants.py

O script pula as próprias variantes e só regrava quando a cópia está faltando ou
mais antiga que o original.
"""

from pathlib import Path
import re
import sys

from PIL import Image

QUALITY = 78
PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"

# Precisa bater com imageVariantWidths em site/render.go.
WIDTHS = (480, 960)
SOURCE_DIR = PUBLIC_DIR / "uploads"

VARIANT_NAME = re.compile(r"-\d{3,4}$")


def build(source: Path, widths: tuple[int, ...]) -> None:
    with Image.open(source) as image:
        image.load()
        for width in widths:
            if width >= image.width:
                continue
            target = source.with_name(f"{source.stem}-{width}{source.suffix}")
            if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
                continue
            height = round(image.height * width / image.width)
            mode = "RGBA" if image.mode in ("RGBA", "LA", "P") else "RGB"
            resized = image.convert(mode).resize((width, height), Image.LANCZOS)
            resized.save(target, "WEBP", quality=QUALITY, method=6)
            print(f"{target.name}: {width}x{height}, {target.stat().st_size // 1024} KB")


def main() -> int:
    if not SOURCE_DIR.is_dir():
        print(f"pasta não encontrada: {SOURCE_DIR}", file=sys.stderr)
        return 1
    for source in sorted(SOURCE_DIR.glob("*.webp")):
        if VARIANT_NAME.search(source.stem):
            continue
        build(source, WIDTHS)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
