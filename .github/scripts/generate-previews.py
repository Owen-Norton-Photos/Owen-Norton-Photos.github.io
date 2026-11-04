#!/usr/bin/env python3

import argparse
import shutil
import subprocess
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
GALLERY_YEARS = ("2025", "2026")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("site_root", type=Path)
    parser.add_argument("preview_root", type=Path)
    args = parser.parse_args()
    imagemagick = shutil.which("magick") or shutil.which("convert")
    if not imagemagick:
        raise FileNotFoundError("ImageMagick is required to generate gallery previews.")

    for year in GALLERY_YEARS:
        image_directory = args.site_root / f"{year}pic"
        if not image_directory.is_dir():
            raise FileNotFoundError(f"Image directory not found: {image_directory}")

        for image_path in sorted(image_directory.rglob("*")):
            if not image_path.is_file() or image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue

            preview_path = (
                args.preview_root
                / year
                / image_path.relative_to(image_directory).with_suffix(".webp")
            )
            preview_path.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                [
                    imagemagick,
                    str(image_path),
                    "-auto-orient",
                    "-resize",
                    "50%",
                    "-strip",
                    "-quality",
                    "82",
                    str(preview_path),
                ],
                check=True,
            )


if __name__ == "__main__":
    main()
