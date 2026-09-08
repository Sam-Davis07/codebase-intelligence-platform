from collections import defaultdict


def build_reverse_call_graph(call_graph: dict) -> dict:
    """
    Build a reverse call graph.

    The normal call graph answers:

        Who does this symbol call?

    The reverse call graph answers:

        Who calls this symbol?
    """

    reverse_adjacency = defaultdict(list)

    for edge in call_graph.get("edges", []):
        source = edge.get("source")
        target = edge.get("target")

        if not source or not target:
            continue

        if source not in reverse_adjacency[target]:
            reverse_adjacency[target].append(source)

    return {
        "node_count": call_graph.get("node_count", 0),
        "edge_count": call_graph.get("edge_count", 0),
        "adjacency": dict(reverse_adjacency),
    }