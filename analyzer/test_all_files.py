from pathlib import Path

from app.services.file_service import get_source_files
from app.services.code_analyzer import analyze_file


ROOT = Path(
    "D:/2026/Next.js Projects/codebase-intelligence-platform/frontend"
).resolve()


files = get_source_files(str(ROOT))

print(f"Testing {len(files)} files...\n")

for index, file in enumerate(files, start=1):
    print(f"[{index}/{len(files)}] {file.relative_to(ROOT)}", end=" ... ")

    try:
        result = analyze_file(
            str(file),
            str(ROOT),
        )

        print(
            f"OK | "
            f"functions={len(result['functions'])} | "
            f"symbols={len(result['symbols'])} | "
            f"imports={len(result['imports'])}"
        )

    except Exception as error:
        print("FAILED")
        print(f"    {type(error).__name__}: {error}")
        raise

print("\nALL FILES SUCCESS")