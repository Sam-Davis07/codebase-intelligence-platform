from pathlib import Path

from app.services.route_analyzer import analyze_routes
from app.services.route_symbol_linker import link_routes_to_symbols

def test_route_analyzer():
    fixture = Path(__file__).parent / "fixtures" / "routes.ts"

    file_results = [
        {
            "file": str(fixture.resolve())
        }
    ]

    routes = analyze_routes(
        file_results,
        str(fixture.parent.parent.parent.resolve()),
    )

    print("\nDetected routes:")

    for route in routes:
        print(route)

    assert len(routes) == 2

    assert routes[0]["method"] == "GET"
    assert routes[0]["path"] == "/users"

    assert routes[1]["method"] == "POST"
    assert routes[1]["path"] == "/users"
    
def test_nextjs_routes():
    fixture = (
        Path(__file__).parent
        / "fixtures"
        / "app"
        / "api"
        / "users"
        / "route.ts"
    )

    file_results = [
        {
            "file": str(fixture.resolve())
        }
    ]

    project_root = (
        Path(__file__).parent
        / "fixtures"
    )

    routes = analyze_routes(
        file_results,
        str(project_root.resolve()),
    )

    print("\nDetected Next.js routes:")

    for route in routes:
        print(route)

    assert len(routes) == 2

    assert routes[0]["method"] == "GET"
    assert routes[0]["path"] == "/api/users"
    assert routes[0]["handler"] == "GET"

    assert routes[1]["method"] == "POST"
    assert routes[1]["path"] == "/api/users"
    assert routes[1]["handler"] == "POST"
    
def test_route_symbol_linking():
    routes = [
        {
            "method": "GET",
            "path": "/users",
            "file": "users.ts",
            "handler": "getUsers",
            "line": 14,
            "type": "express",
        },
        {
            "method": "POST",
            "path": "/users",
            "file": "users.ts",
            "handler": "createUser",
            "line": 15,
            "type": "express",
        },
    ]

    symbol_index = {
        "getUsers": [
            {
                "file": "users.ts",
                "type": "function",
                "start_line": 5,
                "end_line": 7,
            }
        ],
        "createUser": [
            {
                "file": "users.ts",
                "type": "function",
                "start_line": 9,
                "end_line": 12,
            }
        ],
    }

    linked_routes = link_routes_to_symbols(
        routes,
        symbol_index,
    )

    assert len(linked_routes) == 2

    assert linked_routes[0]["handler_symbol"]["name"] == "getUsers"
    assert linked_routes[0]["handler_symbol"]["type"] == "function"

    assert linked_routes[1]["handler_symbol"]["name"] == "createUser"
    assert linked_routes[1]["handler_symbol"]["start_line"] == 9