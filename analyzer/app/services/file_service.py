from pathlib import Path


SUPPORTED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
}


def get_source_files(root_path: str) -> list[Path]:
    root = Path(root_path)

    if not root.exists():
        raise FileNotFoundError(f"Directory not found: {root_path}")

    if not root.is_dir():
        raise ValueError(f"Path is not a directory: {root_path}")

    files = []

    for path in root.rglob("*"):
        if not path.is_file():
            continue

        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        # Ignore common dependency/build directories.
        if path.name in {
            "next-env.d.ts",
        }:
            continue

        if any(
            part in {
                "node_modules",
                ".git",
                "venv",
                "__pycache__",
                "dist",
                "build",
                ".next",
            }
            for part in path.parts
        ):
            continue

        files.append(path)

    return files