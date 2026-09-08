from collections import defaultdict
from pathlib import Path


def build_cross_layer_graph(
    file_results: list[dict],
    project_root: str,
) -> dict:
    """
    Build a high-level dependency graph between architecture layers.

    File-level dependencies are grouped into relationships such as:

        presentation -> shared

    while preserving the underlying file-level dependencies.
    """

    root_path = Path(project_root).resolve()

    # ---------------------------------------------------------
    # 1. Build file -> architecture layer map
    # ---------------------------------------------------------

    file_layer_map: dict[str, str] = {}
    layers: set[str] = set()

    for file_result in file_results:
        if "error" in file_result:
            continue

        file_path = Path(file_result["file"]).resolve()

        layer = file_result.get(
            "architecture_layer",
            "unknown",
        )

        file_layer_map[str(file_path)] = layer
        layers.add(layer)

    # ---------------------------------------------------------
    # 2. Group cross-layer dependencies
    # ---------------------------------------------------------

    relationships = defaultdict(list)

    for file_result in file_results:
        if "error" in file_result:
            continue

        source_path = Path(file_result["file"]).resolve()

        source_layer = file_layer_map.get(str(source_path))

        if not source_layer:
            continue

        dependencies = file_result.get("dependencies", [])

        for dependency in dependencies:

            # We only care about dependencies that resolve
            # to another file inside the repository.
            if dependency.get("type") != "internal":
                continue

            resolved_file = dependency.get("resolved_file")

            if not resolved_file:
                continue

            target_path = Path(resolved_file).resolve()

            target_layer = file_layer_map.get(str(target_path))

            if not target_layer:
                continue

            # Same-layer dependencies are not cross-layer
            # architecture relationships.
            if source_layer == target_layer:
                continue

            relationship_key = (
                source_layer,
                target_layer,
            )

            # Convert absolute paths back to repository-relative paths.
            source_relative = str(
                source_path.relative_to(root_path)
            )

            target_relative = str(
                target_path.relative_to(root_path)
            )

            file_dependency = {
                "source": source_relative,
                "target": target_relative,
            }

            # Avoid duplicate edges.
            if file_dependency not in relationships[relationship_key]:
                relationships[relationship_key].append(
                    file_dependency
                )

    # ---------------------------------------------------------
    # 3. Build final relationship objects
    # ---------------------------------------------------------

    relationship_results = []

    for (
        source_layer,
        target_layer,
    ), files in relationships.items():

        relationship_results.append(
            {
                "source_layer": source_layer,
                "target_layer": target_layer,
                "dependency_count": len(files),
                "files": files,
            }
        )

    # ---------------------------------------------------------
    # 4. Return structured cross-layer graph
    # ---------------------------------------------------------

    return {
        "total_layers": len(layers),
        "layers": sorted(layers),
        "total_relationships": len(relationship_results),
        "relationships": relationship_results,
    }