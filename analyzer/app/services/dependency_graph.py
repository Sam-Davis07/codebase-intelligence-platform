from collections import defaultdict


def build_dependency_graph(file_results: list[dict]) -> dict:
    nodes = []
    edges = []

    external_dependencies = []
    unresolved_dependencies = []

    graph = defaultdict(list)

    # Only files successfully analyzed become graph nodes
    valid_files = {
        file_result["file"]
        for file_result in file_results
        if "error" not in file_result
    }

    for file_result in file_results:
        if "error" in file_result:
            continue

        file_path = file_result["file"]

        nodes.append(
            {
                "id": file_path,
                "label": file_path,
                "type": "file",
            }
        )

        for dependency in file_result.get("dependencies", []):
            dependency_type = dependency.get("type")
            resolved_file = dependency.get("resolved_file")
            import_source = dependency.get("source")

            # Internal dependency
            if dependency_type == "internal":
                if not resolved_file:
                    continue

                if resolved_file not in valid_files:
                    continue

                edge = {
                    "source": file_path,
                    "target": resolved_file,
                    "type": "import",
                }

                edges.append(edge)
                graph[file_path].append(resolved_file)

            # External npm/package dependency
            elif dependency_type == "external":
                external_dependencies.append(
                    {
                        "file": file_path,
                        "package": import_source,
                    }
                )

            # Import could not be resolved
            elif dependency_type == "unresolved":
                unresolved_dependencies.append(
                    {
                        "file": file_path,
                        "source": import_source,
                    }
                )

    return {
        "nodes": nodes,
        "edges": edges,
        "external_dependencies": external_dependencies,
        "unresolved_dependencies": unresolved_dependencies,
    }