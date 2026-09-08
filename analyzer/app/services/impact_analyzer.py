from collections import deque


def analyze_symbol_impact(
    symbol_id: str,
    reverse_call_graph: dict,
) -> dict:
    """
    Analyze which symbols may be affected when a symbol changes.

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
    visited = {symbol_id}

    queue = deque(
        [
            (symbol_id, 0)
        ]
    )

    while queue:
        current_symbol, depth = queue.popleft()

        for dependent in adjacency.get(current_symbol, []):
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

    direct_count = sum(
        1
        for symbol in affected_symbols
        if symbol["depth"] == 1
    )

    indirect_count = sum(
        1
        for symbol in affected_symbols
        if symbol["depth"] > 1
    )

    return {
        "changed_symbol": symbol_id,
        "affected_count": len(affected_symbols),
        "direct_count": direct_count,
        "indirect_count": indirect_count,
        "affected_symbols": affected_symbols,
    }