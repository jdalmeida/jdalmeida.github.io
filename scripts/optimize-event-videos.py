#!/usr/bin/env python3
"""Diagnostica e reencoda os vídeos da galeria de eventos.

Um MP4 só toca enquanto baixa quando o índice do arquivo — a caixa `moov` — vem
antes dos dados de vídeo. Quando o `moov` fica no fim, que é o padrão de quase
todo celular e editor, o navegador precisa puxar o arquivo inteiro antes do
primeiro quadro. É por isso que um clipe curto demora a aparecer mesmo com o CDN
respondendo rápido.

    # o que está no ar hoje
    python3 scripts/optimize-event-videos.py check https://exemplo/ss_brazil3.mp4

    # gera a versão web a partir do arquivo original
    python3 scripts/optimize-event-videos.py build ~/videos/ss_brazil3.mov

O `check` lê só os primeiros kilobytes, com uma requisição Range, e diz se o
arquivo está pronto para tocar progressivamente. O `build` grava um MP4 com o
`moov` na frente, no tamanho em que a galeria desenha o vídeo, e um pôster WebP
com o primeiro quadro.

O `build` precisa do ffmpeg no PATH ou em FFMPEG_BIN.
"""

from pathlib import Path
import argparse
import os
import shutil
import struct
import subprocess
import sys
import urllib.request

# A cela do vídeo tem ~232px no desktop e ~50vw no celular, então 720px de
# largura já cobre telas retina com folga.
MAX_WIDTH = 720
CRF = 27
PRESET = "slow"
POSTER_QUALITY = 72
HEADER_BYTES = 96 * 1024

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"
OUTPUT_DIR = PUBLIC_DIR / "uploads"


def read_header(source: str) -> tuple[bytes, int | None]:
    """Devolve o começo do arquivo e o tamanho total, quando o servidor informa."""
    if "://" not in source:
        path = Path(source)
        with path.open("rb") as handle:
            return handle.read(HEADER_BYTES), path.stat().st_size
    request = urllib.request.Request(source, headers={"Range": f"bytes=0-{HEADER_BYTES - 1}"})
    with urllib.request.urlopen(request, timeout=30) as response:
        header = response.read()
        content_range = response.headers.get("Content-Range", "")
        if "/" in content_range:
            total = int(content_range.rsplit("/", 1)[-1])
        else:
            length = response.headers.get("Content-Length")
            total = int(length) if length and length.isdigit() else None
        if response.status != 206:
            print(f"  aviso: o servidor respondeu {response.status}, sem suporte a Range")
        return header, total


def first_box(header: bytes) -> str | None:
    """Percorre as caixas de topo do MP4 e devolve a primeira entre moov e mdat."""
    offset = 0
    while offset + 8 <= len(header):
        (size,) = struct.unpack_from(">I", header, offset)
        kind = header[offset + 4 : offset + 8].decode("latin-1")
        if size == 1:
            if offset + 16 > len(header):
                return None
            (size,) = struct.unpack_from(">Q", header, offset + 8)
        elif size == 0:
            size = len(header) - offset
        if kind in ("moov", "mdat"):
            return kind
        if size < 8:
            return None
        offset += size
    return None


def check(source: str) -> bool:
    print(source)
    try:
        header, total = read_header(source)
    except OSError as error:
        print(f"  não foi possível ler: {error}")
        return False
    if total:
        print(f"  tamanho: {total / 1024 / 1024:.1f} MB")
    kind = first_box(header)
    if kind == "moov":
        print("  moov na frente: toca enquanto baixa")
        return True
    if kind == "mdat":
        print("  moov no fim: o navegador baixa o arquivo inteiro antes do primeiro quadro")
        print("  conserte com: ffmpeg -i entrada.mp4 -c copy -movflags +faststart saida.mp4")
        return False
    print("  não encontrei moov nem mdat nos primeiros kilobytes")
    return False


def ffmpeg_binary() -> str:
    binary = os.environ.get("FFMPEG_BIN") or shutil.which("ffmpeg")
    if not binary:
        raise SystemExit("ffmpeg não encontrado: instale o ffmpeg ou aponte FFMPEG_BIN")
    return binary


def build(source: Path, output_dir: Path, max_width: int, crf: int) -> None:
    binary = ffmpeg_binary()
    output_dir.mkdir(parents=True, exist_ok=True)
    video = output_dir / f"{source.stem}.mp4"
    poster = output_dir / f"{source.stem}-poster.webp"
    scale = f"scale='min({max_width},iw)':-2"

    subprocess.run(
        [
            binary, "-y", "-loglevel", "error", "-i", str(source),
            # A galeria toca os vídeos no mudo, então a trilha de áudio só ocupa banda.
            "-an",
            "-vf", scale,
            "-c:v", "libx264", "-profile:v", "high", "-preset", PRESET,
            "-crf", str(crf), "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            str(video),
        ],
        check=True,
    )
    subprocess.run(
        [
            binary, "-y", "-loglevel", "error", "-i", str(video),
            "-frames:v", "1", "-c:v", "libwebp", "-quality", str(POSTER_QUALITY),
            str(poster),
        ],
        check=True,
    )

    before = source.stat().st_size
    after = video.stat().st_size
    print(f"{video.name}: {before / 1024 / 1024:.1f} MB → {after / 1024 / 1024:.1f} MB")
    print(f"{poster.name}: {poster.stat().st_size // 1024} KB")
    check(str(video))
    print(f"  suba {video.name} para o blob e preencha Poster com /uploads/{poster.name}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)

    checker = commands.add_parser("check", help="diz se o MP4 toca enquanto baixa")
    checker.add_argument("sources", nargs="+", help="URLs ou arquivos")

    builder = commands.add_parser("build", help="grava o MP4 da web e o pôster")
    builder.add_argument("sources", nargs="+", type=Path, help="arquivos originais")
    builder.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    builder.add_argument("--max-width", type=int, default=MAX_WIDTH)
    # Menos CRF, mais qualidade e mais bytes. Suba para 23 quando o clipe tiver
    # muito movimento e o resultado ficar borrado.
    builder.add_argument("--crf", type=int, default=CRF)

    arguments = parser.parse_args()
    if arguments.command == "check":
        return 0 if all([check(source) for source in arguments.sources]) else 1
    for source in arguments.sources:
        build(source, arguments.output_dir, arguments.max_width, arguments.crf)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
