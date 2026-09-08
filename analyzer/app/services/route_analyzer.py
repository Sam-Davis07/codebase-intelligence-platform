from pathlib import Path


HTTP_METHODS = {
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "options",
    "head",
}


def analyze_routes(
    file_results: list[dict],
    project_root: str,
) -> list[dict]:
    """
    Detect API routes and HTTP handlers across the repository.
    """

    routes = []

    for file_result in file_results:
        if "error" in file_result:
            continue

        file_path = file_result.get("file")

        if not file_path:
            continue

        suffix = Path(file_path).suffix.lower()

        if suffix not in {".ts", ".tsx", ".js", ".jsx"}:
            continue

        try:
            source_code = Path(file_path).read_text(
                encoding="utf-8"
            )
        except (OSError, UnicodeDecodeError):
            continue

        routes.extend(
            detect_routes(
                source_code,
                file_path,
                project_root,
            )
        )

    return routes


def detect_routes(
    source_code: str,
    file_path: str,
    project_root: str,
) -> list[dict]:
    """
    Detect Express-style routes and Next.js App Router handlers.
    """
    
    is_next_route = Path(file_path).name in {
        "route.ts",
        "route.tsx",
        "route.js",
        "route.jsx",
    }

    routes = []

    lines = source_code.splitlines()

    for index, line in enumerate(lines):
        stripped = line.strip()

        # Express:
        # router.get("/users", handler)
        # router.post("/users", createUser)
        # app.get("/users", handler)

        for method in HTTP_METHODS:
            marker = f".{method}("

            if marker in stripped:
                route = extract_express_route(
                    stripped,
                    method,
                    file_path,
                    index + 1,
                )

                if route:
                    routes.append(route)

        # Next.js App Router:
        # export async function GET()
        # export function POST()

        if is_next_route:
            for method in HTTP_METHODS:
                if (
                    stripped.startswith(
                        f"export async function {method.upper()}"
                    )
                    or stripped.startswith(
                        f"export function {method.upper()}"
                    )
                ):
                    routes.append(
                        {
                            "method": method.upper(),
                            "path": infer_next_route_path(
                                file_path,
                                project_root,
                            ),
                            "file": str(
                                Path(file_path).resolve()
                            ),
                            "handler": method.upper(),
                            "line": index + 1,
                            "type": "nextjs",
                        }
                    )

    return routes


def extract_express_route(
    line: str,
    method: str,
    file_path: str,
    line_number: int,
) -> dict | None:

    marker = f".{method}("

    start = line.find(marker)

    if start == -1:
        return None

    remainder = line[
        start + len(marker):
    ]

    if not remainder.startswith(("\"", "'", "`")):
        return None

    quote = remainder[0]

    end = remainder.find(
        quote,
        1,
    )

    if end == -1:
        return None

    path = remainder[
        1:end
    ]

    handler = None

    after_path = remainder[
        end + 1:
    ]

    if "," in after_path:
        handler_part = after_path.split(
            ",",
            1,
        )[1]

        handler = (
            handler_part
            .split(")", 1)[0]
            .strip()
        )

    return {
        "method": method.upper(),
        "path": path,
        "file": str(
            Path(file_path).resolve()
        ),
        "handler": handler,
        "line": line_number,
        "type": "express",
    }


def infer_next_route_path(
    file_path: str,
    project_root: str,
) -> str:

    root = Path(project_root).resolve()
    path = Path(file_path).resolve()

    try:
        relative = path.relative_to(root)
    except ValueError:
        return "/"

    parts = list(relative.parts)

    if "app" not in parts:
        return "/"

    app_index = parts.index("app")

    route_parts = parts[
        app_index + 1:
    ]

    if route_parts and route_parts[-1] == "route.ts":
        route_parts.pop()

    elif route_parts and route_parts[-1] == "route.tsx":
        route_parts.pop()

    elif route_parts and route_parts[-1] == "route.js":
        route_parts.pop()

    elif route_parts and route_parts[-1] == "route.jsx":
        route_parts.pop()

    return "/" + "/".join(route_parts)