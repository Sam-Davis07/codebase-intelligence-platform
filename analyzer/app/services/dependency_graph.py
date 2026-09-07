from collections import defaultdict


def build_dependency_graph(file_results: list[dict]) -> dict:
    nodes = []
    edges = []

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
            if dependency["type"] != "internal":
                continue

            resolved_file = dependency.get("resolved_file")

            if not resolved_file:
                continue

            # Only create an edge if the target is an analyzed file
            if resolved_file not in valid_files:
                continue

            edge = {
                "source": file_path,
                "target": resolved_file,
                "type": "import",
            }

            edges.append(edge)
            graph[file_path].append(resolved_file)

    return {
        "nodes": nodes,
        "edges": edges,
    }