def link_routes_to_symbols(
    routes: list[dict],
    symbol_index: dict,
) -> list[dict]:
    """
    Connect detected API routes to their corresponding symbols.
    """

    linked_routes = []

    for route in routes:
        handler = route.get("handler")

        linked_route = {
            **route,
            "handler_symbol": None,
        }

        if not handler:
            linked_routes.append(linked_route)
            continue

        candidates = symbol_index.get(handler, [])

        route_file = route.get("file")

        for candidate in candidates:
            if candidate.get("file") != route_file:
                continue

            linked_route["handler_symbol"] = {
                "name": handler,
                "type": candidate.get("type"),
                "start_line": candidate.get("start_line"),
                "end_line": candidate.get("end_line"),
            }

            break

        linked_routes.append(linked_route)

    return linked_routes