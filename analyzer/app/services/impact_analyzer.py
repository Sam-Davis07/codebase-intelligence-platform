from collections import deque


def analyze_symbol_impact(
    symbol_id: str,
    reverse_call_graph: dict,
) -> dict:
    """
    Analyze the symbols that may be affected when a symbol changes.

    The reverse call graph tells us which symbols depend on
    a given symbol.

    Example:

        cn
        ↑
        Button

    If cn changes, Button is potentially affected.
    """

    adjacency = reverse_call_graph.get("adjacency", {})

    affected_symbols = []
    visited = set()

    queue = deque()

    queue.append((symbol_id, 0))
    visited.add(symbol_id)

    while queue:
        current_symbol, depth = queue.popleft()

        dependents = adjacency.get(current_symbol, [])

        for dependent in dependents:
            if dependent in visited:
                continue

            visited.add(dependent)

            affected_symbols.append(
                {
                    "symbol": dependent,
                    "depth": depth + 1,
                }
            )

            queue.append(
                (
                    dependent,
                    depth + 1,
                )
            )

    return {
        "changed_symbol": symbol_id,
        "affected_count": len(affected_symbols),
        "affected_symbols": affected_symbols,
    }