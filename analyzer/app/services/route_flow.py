def build_route_flows(
    routes: list[dict],
    call_graph: dict,
) -> list[dict]:
    """
    Connect API routes to the symbols they directly call.
    """

    adjacency = call_graph.get("adjacency", {})

    flows = []

    for route in routes:
        handler_symbol = route.get("handler_symbol")

        if not handler_symbol:
            continue

        file_path = route.get("file")
        handler_name = handler_symbol.get("name")

        if not file_path or not handler_name:
            continue

        handler_id = f"{file_path}:{handler_name}"

        called_symbols = adjacency.get(
            handler_id,
            [],
        )

        flows.append(
            {
                "method": route.get("method"),
                "path": route.get("path"),
                "file": file_path,
                "handler": handler_name,
                "calls": called_symbols,
            }
        )

    return flows