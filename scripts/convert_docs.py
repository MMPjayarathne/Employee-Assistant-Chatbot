import os
import glob
from typing import List

import pdfplumber

PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_SOURCES_DIR = os.path.join(PROJECT_ROOT, "Data Sources")
PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")


def extract_text_from_pdf(pdf_path: str) -> str:
    text_parts: List[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            text_parts.append(text)
    return "\n".join(text_parts)


def main() -> None:
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    pdfs = sorted(glob.glob(os.path.join(DATA_SOURCES_DIR, "*.pdf")))
    if not pdfs:
        print("No PDFs found in 'Data Sources' directory.")
        return

    for pdf in pdfs:
        base = os.path.splitext(os.path.basename(pdf))[0]
        out_txt = os.path.join(PROCESSED_DIR, f"{base}.txt")
        try:
            text = extract_text_from_pdf(pdf)
            with open(out_txt, "w", encoding="utf-8") as f:
                f.write(text)
            print(f"Processed: {pdf} -> {out_txt}")
        except Exception as e:
            print(f"Failed to process {pdf}: {e}")


if __name__ == "__main__":
    main()
