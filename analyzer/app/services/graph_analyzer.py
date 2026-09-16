from collections import defaultdict


ENTRY_POINT_NAMES = {
    "page.tsx",
    "page.ts",
    "layout.tsx",
    "layout.ts",
    "main.ts",
    "main.tsx",
    "index.ts",
    "index.tsx",
    "server.ts",
    "server.tsx",
    "app.ts",
    "app.tsx",
}


def analyze_dependency_graph(graph: dict) -> dict:
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    fan_in = defaultdict(int)
    fan_out = defaultdict(int)
    adjacency = defaultdict(list)

    internal_dependency_count = 0

    for edge in edges:
        source = edge["source"]
        target = edge["target"]

        fan_out[source] += 1
        fan_in[target] += 1

        adjacency[source].append(target)

        internal_dependency_count += 1

    file_metrics = []
    isolated_files = []
    entry_points = []

    for node in nodes:
        file_path = node["id"]

        incoming = fan_in[file_path]
        outgoing = fan_out[file_path]

        file_name = (
            file_path
            .replace("\\", "/")
            .split("/")[-1]
        )

        is_entry_point = file_name in ENTRY_POINT_NAMES

        is_isolated = (
            incoming == 0
            and outgoing == 0
            and not is_entry_point
        )

        metrics = {
            "file": file_path,
            "fan_in": incoming,
            "fan_out": outgoing,
            "dependency_count": outgoing,
            "dependent_count": incoming,
            "total_connections": incoming + outgoing,
            "isolated": is_isolated,
            "entry_point": is_entry_point,
        }

        file_metrics.append(metrics)

        if is_isolated:
            isolated_files.append(file_path)

        if is_entry_point:
            entry_points.append(file_path)

    # Files most depended upon
    most_depended_on = sorted(
        file_metrics,
        key=lambda item: (
            item["fan_in"],
            item["fan_out"],
        ),
        reverse=True,
    )

    most_depended_on = [
        {
            "file": item["file"],
            "fan_in": item["fan_in"],
            "fan_out": item["fan_out"],
            "total_connections": item["total_connections"],
        }
        for item in most_depended_on
        if item["fan_in"] > 0
    ]

    # Files with the most outgoing dependencies
    most_dependent_on = sorted(
        file_metrics,
        key=lambda item: (
            item["fan_out"],
            item["fan_in"],
        ),
        reverse=True,
    )

    most_dependent_on = [
        {
            "file": item["file"],
            "fan_in": item["fan_in"],
            "fan_out": item["fan_out"],
            "total_connections": item["total_connections"],
        }
        for item in most_dependent_on
        if item["fan_out"] > 0
    ]

    cycles = find_cycles(adjacency)

    external_dependencies = graph.get(
        "external_dependencies",
        [],
    )

    unresolved_dependencies = graph.get(
        "unresolved_dependencies",
        [],
    )

    unique_external_packages = sorted(
        {
            dependency["package"]
            for dependency in external_dependencies
            if dependency.get("package")
        }
    )

    total_files = len(nodes)

    connected_files = sum(
        1
        for item in file_metrics
        if item["fan_in"] > 0 or item["fan_out"] > 0
    )

    connected_percentage = (
        round((connected_files / total_files) * 100)
        if total_files
        else 0
    )

    summary = {
        "total_files": total_files,
        "internal_dependencies": internal_dependency_count,
        "external_dependencies": len(external_dependencies),
        "external_packages": len(unique_external_packages),
        "unresolved_dependencies": len(
            unresolved_dependencies
        ),
        "isolated_files": len(isolated_files),
        "entry_points": len(entry_points),
        "circular_dependencies": len(cycles),
        "connected_files": connected_files,
        "connected_percentage": connected_percentage,
    }

    return {
        "summary": summary,
        "files": file_metrics,
        "hotspots": most_depended_on,
        "most_depended_on": most_depended_on,
        "most_dependent_on": most_dependent_on,
        "isolated_files": isolated_files,
        "entry_points": entry_points,
        "cycles": cycles,
        "external_dependencies": external_dependencies,
        "external_packages": unique_external_packages,
        "unresolved_dependencies": unresolved_dependencies,
    }


def find_cycles(adjacency: dict) -> list[list[str]]:
    cycles = []
    visited = set()
    recursion_stack = []

    def dfs(node):
        if node in recursion_stack:
            cycle_start = recursion_stack.index(node)

            cycle = (
                recursion_stack[cycle_start:]
                + [node]
            )

            if cycle not in cycles:
                cycles.append(cycle)

            return

        if node in visited:
            return

        visited.add(node)
        recursion_stack.append(node)

        for neighbor in adjacency.get(node, []):
            dfs(neighbor)

        recursion_stack.pop()

    for node in adjacency:
        dfs(node)

    return cycles