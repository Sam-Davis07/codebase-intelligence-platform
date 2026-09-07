from collections import defaultdict


def build_adjacency_graph(
    dependency_graph: dict,
) -> dict[str, list[str]]:
    adjacency = defaultdict(list)

    for edge in dependency_graph.get("edges", []):
        source = edge["source"]
        target = edge["target"]

        adjacency[source].append(target)

    return dict(adjacency)


def find_reachable_files(
    start_file: str,
    adjacency: dict[str, list[str]],
) -> list[str]:
    visited = set()
    queue = [start_file]

    while queue:
        current = queue.pop(0)

        if current in visited:
            continue

        visited.add(current)

        for dependency in adjacency.get(current, []):
            if dependency not in visited:
                queue.append(dependency)

    return list(visited)


def build_execution_flow(
    entry_points: dict,
    dependency_graph: dict,
) -> dict:
    adjacency = build_adjacency_graph(
        dependency_graph
    )

    flows = []

    for entry_point in entry_points.get(
        "entry_points",
        [],
    ):
        file_path = entry_point["file"]

        # Entry-point paths are currently relative
        # while dependency graph paths are absolute.
        #
        # Match them using the ending path component.
        matching_file = None

        for node in dependency_graph.get(
            "nodes",
            [],
        ):
            node_path = node["id"]

            if node_path.endswith(file_path):
                matching_file = node_path
                break

        if matching_file is None:
            flows.append(
                {
                    "entry_point": file_path,
                    "reason": entry_point["reason"],
                    "reachable_files": [],
                    "depth": 0,
                }
            )
            continue

        reachable = find_reachable_files(
            matching_file,
            adjacency,
        )

        flows.append(
            {
                "entry_point": file_path,
                "reason": entry_point["reason"],
                "reachable_files": [
                    file
                    for file in reachable
                    if file != matching_file
                ],
                "depth": calculate_flow_depth(
                    matching_file,
                    adjacency,
                ),
            }
        )

    return {
        "total_flows": len(flows),
        "flows": flows,
    }


def calculate_flow_depth(
    start_file: str,
    adjacency: dict[str, list[str]],
) -> int:
    if start_file not in adjacency:
        return 0

    max_depth = 0

    queue = [
        (start_file, 0)
    ]

    visited = set()

    while queue:
        current, depth = queue.pop(0)

        if current in visited:
            continue

        visited.add(current)

        max_depth = max(
            max_depth,
            depth,
        )

        for dependency in adjacency.get(
            current,
            [],
        ):
            queue.append(
                (
                    dependency,
                    depth + 1,
                )
            )

    return max_depth