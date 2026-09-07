from pathlib import Path


def classify_architecture_layer(
    file_path: str,
    role: str,
    project_root: str,
) -> str:
    path = Path(file_path)
    root = Path(project_root)

    try:
        relative_path = path.relative_to(root)
    except ValueError:
        return "unknown"

    parts = {
        part.lower()
        for part in relative_path.parts
    }

    # -------------------------
    # Presentation layer
    # -------------------------

    if role in {
        "application_page",
        "application_layout",
        "component",
        "ui_component",
    }:
        return "presentation"

    if any(
        part in {
            "components",
            "component",
            "pages",
            "views",
            "screens",
        }
        for part in parts
    ):
        return "presentation"

    # -------------------------
    # API layer
    # -------------------------

    if role == "api_route":
        return "api"

    if any(
        part in {
            "routes",
            "route",
            "controllers",
            "controller",
            "api",
        }
        for part in parts
    ):
        return "api"

    # -------------------------
    # Application / service layer
    # -------------------------

    if role in {
        "service",
        "hook",
    }:
        return "application"

    if any(
        part in {
            "services",
            "service",
            "usecases",
            "usecase",
            "hooks",
        }
        for part in parts
    ):
        return "application"

    # -------------------------
    # Data / infrastructure layer
    # -------------------------

    if role in {
        "database",
        "database_schema",
    }:
        return "infrastructure"

    if any(
        part in {
            "database",
            "db",
            "prisma",
            "repositories",
            "repository",
            "models",
            "migrations",
        }
        for part in parts
    ):
        return "infrastructure"

    # -------------------------
    # Configuration
    # -------------------------

    if role == "configuration":
        return "configuration"

    # -------------------------
    # Utility layer
    # -------------------------

    if role in {
        "utility",
        "parser",
    }:
        return "shared"

    if any(
        part in {
            "utils",
            "utility",
            "helpers",
            "lib",
            "parsers",
            "parser",
        }
        for part in parts
    ):
        return "shared"

    return "unknown"


def analyze_architecture(
    file_results: list[dict],
    project_root: str,
) -> dict:
    layers: dict[str, list[str]] = {}

    for result in file_results:
        if "error" in result:
            continue

        role = result.get(
            "role",
            "unknown",
        )

        layer = classify_architecture_layer(
            result["file"],
            role,
            project_root,
        )

        result["architecture_layer"] = layer

        relative_path = Path(
            result["file"]
        ).relative_to(
            Path(project_root)
        )

        layers.setdefault(
            layer,
            [],
        ).append(
            str(relative_path)
        )

    layer_counts = {
        layer: len(files)
        for layer, files in layers.items()
    }

    return {
        "total_layers": len(layers),
        "layer_counts": layer_counts,
        "layers": layers,
    }