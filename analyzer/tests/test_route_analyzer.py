from pathlib import Path

from app.services.route_analyzer import analyze_routes


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