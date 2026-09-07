from pathlib import Path


SUPPORTED_EXTENSIONS = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
]


def resolve_import(
    source_file: str,
    import_source: str,
    project_root: str,
) -> dict:
    source_path = Path(source_file)
    root_path = Path(project_root)

    # External package
    if not import_source.startswith(".") and not import_source.startswith("@/"):
        return {
            "source": import_source,
            "type": "external",
            "resolved_file": None,
        }

    # @/ alias → project src/
    if import_source.startswith("@/"):
        target = root_path / "src" / import_source[2:]
    else:
        # Relative import
        target = source_path.parent / import_source

    resolved = find_file(target)

    return {
        "source": import_source,
        "type": "internal" if resolved else "unresolved",
        "resolved_file": (
            str(resolved.resolve())
            if resolved
            else None
        ),
    }


def find_file(path: Path) -> Path | None:
    # Exact file
    if path.is_file():
        return path

    # Try supported extensions
    for extension in SUPPORTED_EXTENSIONS:
        candidate = Path(f"{path}{extension}")

        if candidate.is_file():
            return candidate

    # Try index files
    if path.is_dir():
        for extension in SUPPORTED_EXTENSIONS:
            candidate = path / f"index{extension}"

            if candidate.is_file():
                return candidate

    return None