from pathlib import Path


# Higher-level layers may depend on lower-level layers.
#
# Example:
#
# presentation
#      ↓
# application
#      ↓
# infrastructure
#
# Shared code should generally remain independent.
#
ALLOWED_DEPENDENCIES = {
    "presentation": {
        "presentation",
        "application",
        "shared",
    },
    "application": {
        "application",
        "infrastructure",
        "shared",
    },
    "api": {
        "application",
        "infrastructure",
        "shared",
    },
    "infrastructure": {
        "infrastructure",
        "shared",
    },
    "shared": {
        "shared",
    },
    "configuration": {
        "configuration",
        "shared",
    },
}


def build_file_layer_map(
    file_results: list[dict],
    project_root: str,
) -> dict[str, str]:
    file_layers = {}

    root = Path(project_root)

    for result in file_results:
        if "error" in result:
            continue

        file_path = Path(result["file"])

        try:
            relative_path = file_path.relative_to(root)
        except ValueError:
            continue

        layer = result.get(
            "architecture_layer",
            "unknown",
        )

        file_layers[str(relative_path)] = layer

    return file_layers


def resolve_dependency_layer(
    dependency: dict,
    file_layers: dict[str, str],
) -> str | None:
    if dependency.get("type") != "internal":
        return None

    resolved_file = dependency.get(
        "resolved_file"
    )

    if not resolved_file:
        return None

    resolved_path = Path(resolved_file)

    for file_path, layer in file_layers.items():
        if resolved_file.endswith(file_path):
            return layer

    return None


def analyze_architecture_rules(
    file_results: list[dict],
    project_root: str,
) -> dict:
    file_layers = build_file_layer_map(
        file_results,
        project_root,
    )

    violations = []
    valid_dependencies = []

    for result in file_results:
        if "error" in result:
            continue

        source_file = Path(
            result["file"]
        )

        try:
            source_relative = source_file.relative_to(
                Path(project_root)
            )
        except ValueError:
            continue

        source_layer = result.get(
            "architecture_layer",
            "unknown",
        )

        allowed_layers = ALLOWED_DEPENDENCIES.get(
            source_layer,
            set(),
        )

        for dependency in result.get(
            "dependencies",
            [],
        ):
            target_layer = resolve_dependency_layer(
                dependency,
                file_layers,
            )

            if target_layer is None:
                continue

            target_file = dependency.get(
                "resolved_file"
            )

            if not target_file:
                continue

            target_relative = None

            for file_path in file_layers:
                if target_file.endswith(file_path):
                    target_relative = file_path
                    break

            if target_relative is None:
                continue

            dependency_record = {
                "source": str(source_relative),
                "target": target_relative,
                "source_layer": source_layer,
                "target_layer": target_layer,
            }

            if target_layer in allowed_layers:
                valid_dependencies.append(
                    dependency_record
                )
                continue

            violations.append(
                {
                    **dependency_record,
                    "severity": "warning",
                    "type": "architecture_violation",
                    "message": (
                        f"{source_layer} layer depends on "
                        f"{target_layer} layer"
                    ),
                }
            )

    return {
        "total_dependencies_checked": (
            len(valid_dependencies)
            + len(violations)
        ),
        "valid_dependencies": valid_dependencies,
        "violations": violations,
        "total_violations": len(violations),
    }