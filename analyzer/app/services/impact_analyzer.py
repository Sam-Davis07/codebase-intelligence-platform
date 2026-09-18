from collections import defaultdict, deque


def build_impact_analysis(
    file_results: list[dict],
    dependency_graph: dict,
    symbol_references: list[dict],
    route_analysis: list[dict],
    route_flows: list[dict],
    target_file: str,
    target_symbol: str | None = None,
) -> dict:
    """
    Analyze the potential impact of changing a file or symbol.

    Impact is calculated from:
    - reverse file dependencies
    - symbol references
    - route relationships
    - transitive dependents

    The analyzer does not determine whether a change is safe.
    It reports the repository relationships that may be affected.
    """

    target_file = normalize_path(target_file)

    # ---------------------------------------------------------------
    # Build reverse dependency graph
    #
    # Existing dependency graph:
    #
    # A -> B
    #
    # means A depends on B.
    #
    # If B changes, A may be affected.
    # ---------------------------------------------------------------

    reverse_dependencies = defaultdict(list)

    for edge in dependency_graph.get("edges", []):
        source = normalize_path(edge.get("source", ""))
        target = normalize_path(edge.get("target", ""))

        if not source or not target:
            continue

        reverse_dependencies[target].append(source)

    # ---------------------------------------------------------------
    # Build reverse symbol reference graph
    #
    # source_symbol -> target_symbol
    #
    # If target_symbol changes, source_symbol may be affected.
    # ---------------------------------------------------------------

    reverse_symbol_references = defaultdict(list)

    for reference in symbol_references:
        source_file = normalize_path(
            reference.get("source_file", "")
        )

        target_file_ref = normalize_path(
            reference.get("target_file", "")
        )

        source_symbol = reference.get(
            "source_symbol"
        )

        target_symbol_ref = reference.get(
            "target_symbol"
        )

        if not source_file or not target_file_ref:
            continue

        key = (
            target_file_ref,
            target_symbol_ref,
        )

        reverse_symbol_references[key].append(
            {
                "source_file": source_file,
                "source_symbol": source_symbol,
                "target_file": target_file_ref,
                "target_symbol": target_symbol_ref,
                "type": reference.get("type"),
                "line": reference.get("line"),
            }
        )

    # ---------------------------------------------------------------
    # Find directly affected files
    # ---------------------------------------------------------------

    direct_dependents = sorted(
        set(
            reverse_dependencies.get(
                target_file,
                []
            )
        )
    )

    # ---------------------------------------------------------------
    # Find transitive impact
    # ---------------------------------------------------------------

    affected_files = set()

    queue = deque()

    for dependent in direct_dependents:
        queue.append(
            (
                dependent,
                1,
            )
        )

    visited = set()

    while queue:
        current_file, depth = queue.popleft()

        current_file = normalize_path(
            current_file
        )

        if current_file in visited:
            continue

        visited.add(current_file)

        affected_files.add(current_file)

        for dependent in reverse_dependencies.get(
            current_file,
            [],
        ):
            if dependent not in visited:
                queue.append(
                    (
                        dependent,
                        depth + 1,
                    )
                )

    # ---------------------------------------------------------------
    # Symbol-level impact
    # ---------------------------------------------------------------

    affected_symbols = []

    if target_symbol:
        symbol_key = (
            target_file,
            target_symbol,
        )

        for reference in reverse_symbol_references.get(
            symbol_key,
            [],
        ):
            affected_symbols.append(
                {
                    "file": reference[
                        "source_file"
                    ],
                    "symbol": reference[
                        "source_symbol"
                    ],
                    "target_symbol": reference[
                        "target_symbol"
                    ],
                    "type": reference[
                        "type"
                    ],
                    "line": reference[
                        "line"
                    ],
                }
            )

    # Also include symbols belonging to impacted files.
    symbols_by_file = defaultdict(list)

    for file_result in file_results:
        file_path = normalize_path(
            file_result.get("file", "")
        )

        if not file_path:
            continue

        for symbol in file_result.get(
            "symbols",
            [],
        ):
            if symbol.get("name"):
                symbols_by_file[file_path].append(
                    symbol
                )

    impacted_file_symbols = []

    for file_path in sorted(affected_files):
        for symbol in symbols_by_file.get(
            file_path,
            [],
        ):
            impacted_file_symbols.append(
                {
                    "file": file_path,
                    "symbol": symbol.get(
                        "name"
                    ),
                    "type": symbol.get(
                        "type"
                    ),
                    "start_line": symbol.get(
                        "start_line"
                    ),
                    "end_line": symbol.get(
                        "end_line"
                    ),
                }
            )

    # ---------------------------------------------------------------
    # Route impact
    # ---------------------------------------------------------------

    impacted_routes = []

    impacted_file_set = set(
        affected_files
    )

    impacted_file_set.add(
        target_file
    )

    for route in route_analysis:
        route_file = normalize_path(
            route.get("file", "")
        )

        if route_file in impacted_file_set:
            impacted_routes.append(
                {
                    "method": route.get(
                        "method"
                    ),
                    "path": route.get(
                        "path"
                    ),
                    "file": route_file,
                    "handler": route.get(
                        "handler"
                    ),
                    "type": route.get(
                        "type"
                    ),
                    "route_type": route.get(
                        "route_type"
                    ),
                    "dynamic": route.get(
                        "dynamic",
                        False,
                    ),
                    "impact": (
                        "direct"
                        if route_file
                        == target_file
                        else "transitive"
                    ),
                }
            )

    # ---------------------------------------------------------------
    # Route flows
    # ---------------------------------------------------------------

    impacted_flows = []

    for flow in route_flows:
        flow_file = normalize_path(
            flow.get("file", "")
        )

        calls = flow.get(
            "calls",
            [],
        )

        if (
            flow_file in impacted_file_set
            or target_file in [
                normalize_path(
                    str(call)
                )
                for call in calls
            ]
        ):
            impacted_flows.append(
                {
                    "method": flow.get(
                        "method"
                    ),
                    "path": flow.get(
                        "path"
                    ),
                    "file": flow_file,
                    "handler": flow.get(
                        "handler"
                    ),
                    "calls": calls,
                }
            )

    # ---------------------------------------------------------------
    # Impact levels
    # ---------------------------------------------------------------

    direct_impact = [
        file_path
        for file_path in direct_dependents
    ]

    transitive_impact = sorted(
        affected_files
        - set(direct_dependents)
    )

    # ---------------------------------------------------------------
    # Summary
    # ---------------------------------------------------------------

    summary = {
        "target_file": target_file,
        "target_symbol": target_symbol,
        "direct_dependents": len(
            direct_impact
        ),
        "transitive_dependents": len(
            transitive_impact
        ),
        "affected_files": len(
            affected_files
        ),
        "affected_symbols": len(
            affected_file_symbols
        ),
        "affected_routes": len(
            impacted_routes
        ),
        "affected_flows": len(
            impacted_flows
        ),
    }

    return {
        "target": {
            "file": target_file,
            "symbol": target_symbol,
        },
        "summary": summary,
        "direct_impact": direct_impact,
        "transitive_impact": transitive_impact,
        "affected_files": sorted(
            affected_files
        ),
        "affected_symbols": (
            affected_symbols
            + impacted_file_symbols
        ),
        "affected_routes": impacted_routes,
        "affected_flows": impacted_flows,
    }


def normalize_path(path: str) -> str:
    return path.replace("\\", "/")

def analyze_symbol_impact(
    symbol: str,
    reverse_call_graph: dict,
) -> dict:
    """
    Analyze the impact of a symbol using the reverse call graph.

    Reverse call graph keys use the format:

        file_path:symbol

    while the API receives only:

        symbol

    Therefore we first resolve all reverse-graph nodes
    matching the requested symbol.
    """

    adjacency = reverse_call_graph.get(
        "adjacency",
        {}
    )

    if not isinstance(adjacency, dict):
        adjacency = {}

    # ---------------------------------------------------------------
    # Find reverse graph nodes belonging to the requested symbol
    # ---------------------------------------------------------------

    target_nodes = []

    for node_id in adjacency.keys():
        if not isinstance(node_id, str):
            continue

        if node_id.endswith(
            f":{symbol}"
        ):
            target_nodes.append(node_id)

    # ---------------------------------------------------------------
    # Direct impact
    # ---------------------------------------------------------------

    direct_impact = []

    for target_node in target_nodes:
        callers = adjacency.get(
            target_node,
            []
        )

        if not isinstance(callers, list):
            continue

        direct_impact.extend(callers)

    # Remove duplicates.
    direct_impact = unique_items(
        direct_impact
    )

    # ---------------------------------------------------------------
    # Transitive impact
    # ---------------------------------------------------------------

    transitive_impact = []

    visited = set(
        target_nodes
    )

    queue = list(
        direct_impact
    )

    while queue:
        current_node = queue.pop(0)

        if not isinstance(
            current_node,
            str,
        ):
            continue

        if current_node in visited:
            continue

        visited.add(
            current_node
        )

        callers = adjacency.get(
            current_node,
            []
        )

        if not isinstance(
            callers,
            list,
        ):
            continue

        for caller in callers:
            if caller not in direct_impact:
                transitive_impact.append(
                    caller
                )

            if caller not in visited:
                queue.append(
                    caller
                )

    transitive_impact = unique_items(
        transitive_impact
    )

    # ---------------------------------------------------------------
    # Convert graph node IDs into useful objects
    # ---------------------------------------------------------------

    direct_symbols = [
        parse_symbol_node(node)
        for node in direct_impact
    ]

    transitive_symbols = [
        parse_symbol_node(node)
        for node in transitive_impact
    ]

    # ---------------------------------------------------------------
    # Final result
    # ---------------------------------------------------------------

    return {
        "symbol": symbol,

        "summary": {
            "direct_dependents": len(
                direct_symbols
            ),
            "transitive_dependents": len(
                transitive_symbols
            ),
            "total_affected": (
                len(direct_symbols)
                + len(transitive_symbols)
            ),
        },

        "direct_impact": direct_symbols,

        "transitive_impact": (
            transitive_symbols
        ),

        "affected_symbols": (
            direct_symbols
            + transitive_symbols
        ),
    }


def parse_symbol_node(
    node_id: str,
) -> dict:
    """
    Convert:

        file.tsx:Component

    into:

        {
            "file": "file.tsx",
            "symbol": "Component"
        }
    """

    if not isinstance(
        node_id,
        str,
    ):
        return {
            "file": "",
            "symbol": str(node_id),
        }

    # rsplit is important because Windows paths
    # can contain ':' in some contexts.
    parts = node_id.rsplit(
        ":",
        1,
    )

    if len(parts) != 2:
        return {
            "file": node_id,
            "symbol": node_id,
        }

    return {
        "file": parts[0],
        "symbol": parts[1],
    }


def unique_items(
    items: list,
) -> list:
    """
    Remove duplicates while preserving order.
    """

    result = []
    seen = set()

    for item in items:
        key = str(item)

        if key in seen:
            continue

        seen.add(key)
        result.append(item)

    return result  
    