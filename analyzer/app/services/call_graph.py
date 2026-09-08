from collections import defaultdict


def build_call_graph(symbol_references: list[dict]) -> dict:
    """
    Build a symbol-level call graph from symbol references.

    Each symbol becomes a node and each call relationship
    becomes a directed edge.

    Example:

        Button -> cn

    becomes:

        {
            "nodes": [
                {
                    "id": "file.tsx:Button",
                    "name": "Button",
                    "file": "file.tsx"
                },
                {
                    "id": "utils.ts:cn",
                    "name": "cn",
                    "file": "utils.ts"
                }
            ],
            "edges": [
                {
                    "source": "file.tsx:Button",
                    "target": "utils.ts:cn",
                    "type": "call"
                }
            ]
        }
    """

    nodes = {}
    edges = []
    edge_set = set()

    for reference in symbol_references:
        if reference.get("type") != "call":
            continue

        source_file = reference.get("source_file")
        source_symbol = reference.get("source_symbol")

        target_file = reference.get("target_file")
        target_symbol = reference.get("target_symbol")

        if not source_file or not source_symbol:
            continue

        if not target_file or not target_symbol:
            continue

        source_id = f"{source_file}:{source_symbol}"
        target_id = f"{target_file}:{target_symbol}"

        if source_id not in nodes:
            nodes[source_id] = {
                "id": source_id,
                "name": source_symbol,
                "file": source_file,
            }

        if target_id not in nodes:
            nodes[target_id] = {
                "id": target_id,
                "name": target_symbol,
                "file": target_file,
            }

        edge_key = (
            source_id,
            target_id,
            reference.get("type", "call"),
        )

        if edge_key not in edge_set:
            edges.append(
                {
                    "source": source_id,
                    "target": target_id,
                    "type": reference.get("type", "call"),
                }
            )

            edge_set.add(edge_key)

    adjacency = defaultdict(list)

    for edge in edges:
        adjacency[edge["source"]].append(edge["target"])

    return {
        "node_count": len(nodes),
        "edge_count": len(edges),
        "nodes": list(nodes.values()),
        "edges": edges,
        "adjacency": dict(adjacency),
    }