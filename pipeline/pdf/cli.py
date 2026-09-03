"""CLI utility for processing PDFs, viewing extracted text, and testing cached rendering."""

import argparse
import json
from pathlib import Path
import sys

from pipeline.pdf.processor import PDFProcessor


def main():
    parser = argparse.ArgumentParser(description="VigilBid PDF Processor & Renderer CLI")
    parser.add_argument("pdf_path", type=Path, help="Path to input PDF file")
    parser.add_argument("--render", action="store_true", help="Render page images")
    parser.add_argument("--cache-dir", type=Path, default=Path("data/storage/cache"), help="Cache directory for rendered pages")
    parser.add_argument("--json", action="store_true", help="Output full JSON result")

    args = parser.parse_args()

    if not args.pdf_path.exists():
        print(f"Error: PDF file does not exist at '{args.pdf_path}'", file=sys.stderr)
        sys.exit(1)

    processor = PDFProcessor()
    result = processor.process(
        pdf_source=args.pdf_path,
        render_pages=args.render,
        cache_dir=args.cache_dir,
    )

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
        return

    print("=" * 60)
    print("VIGILBID PDF PROCESSING SUMMARY")
    print("=" * 60)
    print(f"Valid:           {result.is_valid}")
    if not result.is_valid:
        print(f"Error:           {result.error_message}")
        return

    print(f"Page Count:      {result.page_count}")
    print(f"Text Source:     {result.overall_text_source}")
    print(f"Title:           {result.doc_metadata.title or 'N/A'}")
    print(f"Author:          {result.doc_metadata.author or 'N/A'}")
    print(f"Producer:        {result.doc_metadata.producer or 'N/A'}")
    print(f"Forensic Flags:  {result.forensic.suspicious_flags or 'None'}")
    print("-" * 60)

    for p in result.pages:
        meta = p.metadata
        print(f"Page {p.page_no}:")
        print(f"  Dimensions:    {meta.width} x {meta.height} pt (Rot: {meta.rotation}°)")
        print(f"  Text Source:   {meta.text_source} (Chars: {meta.char_count}, Words: {meta.word_count})")
        if p.png_path:
            print(f"  Rendered PNG:  {p.png_path}")
        sample = p.text.strip().replace("\n", " ")[:120]
        if sample:
            print(f"  Sample Text:   \"{sample}...\"")
        print("-" * 40)


if __name__ == "__main__":
    main()
