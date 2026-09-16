from pathlib import Path


def get_file_name(file_path: str) -> str:
    return Path(file_path).name


def detect_file_role(
    file_path: str,
    symbols: list[dict],
) -> str:
    normalized = file_path.replace("\\", "/")
    file_name = get_file_name(normalized)

    if file_name in {"page.tsx", "page.ts"}:
        return "Next.js Page"

    if file_name in {"layout.tsx", "layout.ts"}:
        return "Next.js Layout"

    if "/routes/" in normalized:
        return "API Route"

    if file_name in {
        "index.ts",
        "index.tsx",
        "main.ts",
        "main.tsx",
    }:
        return "Application Entry Point"

    if any(
        symbol.get("type") == "component"
        for symbol in symbols
    ):
        return "React Component"

    if any(
        symbol.get("type") == "function"
        for symbol in symbols
    ):
        return "Utility / Service"

    return "Source File"


def detect_layer(file_path: str) -> str:
    normalized = file_path.replace("\\", "/").lower()

    if "/app/" in normalized:
        return "Presentation"

    if "/components/" in normalized:
        return "Presentation"

    if "/routes/" in normalized:
        return "API"

    if "/services/" in normalized:
        return "Service"

    if "/lib/" in normalized:
        return "Shared"

    if "/utils/" in normalized:
        return "Shared"

    return "Other"


def detect_entry_point(
    file_path: str,
) -> bool:
    file_name = get_file_name(file_path)

    return file_name in {
        "page.tsx",
        "page.ts",
        "layout.tsx",
        "layout.ts",
        "main.ts",
        "main.tsx",
        "index.ts",
        "index.tsx",
        "app.ts",
        "app.tsx",
    }


def build_file_intelligence(
    file_result: dict,
) -> dict:
    file_path = file_result.get("file")

    if not file_path:
        return {}

    symbols = file_result.get(
        "symbols",
        [],
    )

    dependencies = file_result.get(
        "dependencies",
        [],
    )

    role = detect_file_role(
        file_path,
        symbols,
    )

    layer = detect_layer(file_path)

    entry_point = detect_entry_point(
        file_path,
    )

    return {
        "role": role,
        "layer": layer,
        "entry_point": entry_point,
        "symbol_count": len(symbols),
        "dependency_count": len(dependencies),
    }