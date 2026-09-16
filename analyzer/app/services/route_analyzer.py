from pathlib import Path
import re


HTTP_METHODS = {
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "options",
    "head",
}

SUPPORTED_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
}

NEXT_ROUTE_FILES = {
    "route.ts",
    "route.tsx",
    "route.js",
    "route.jsx",
}

NEXT_PAGE_FILES = {
    "page.ts",
    "page.tsx",
    "page.js",
    "page.jsx",
}


def analyze_routes(
    file_results: list[dict],
    project_root: str,
) -> list[dict]:
    """
    Detect application routes across the repository.

    Supported:
    - Next.js App Router API routes
    - Next.js App Router page routes
    - Express-style API routes
    """

    routes = []

    root = str(Path(project_root).resolve())
    
    print("\n========== ROUTE ANALYZER DEBUG ==========")
    print("PROJECT ROOT:", project_root)
    print("TOTAL FILE RESULTS:", len(file_results))

    for file_result in file_results:
        file_path = file_result.get("file")
        
        if file_path and Path(file_path).name.startswith("page."):
            print("PAGE FILE FOUND:", file_path)
        
        print("ANALYZER FILE:", file_result.get("file"))
        if "error" in file_result:
            continue

        file_path = file_result.get("file")

        if not file_path:
            continue

        suffix = Path(file_path).suffix.lower()

        if suffix not in SUPPORTED_EXTENSIONS:
            continue

        try:
            source_code = Path(file_path).read_text(
                encoding="utf-8"
            )
        except (
            OSError,
            UnicodeDecodeError,
        ):
            continue

        routes.extend(
            detect_routes(
                source_code,
                file_path,
                root,
            )
        )
    print("==========================================\n")

    return deduplicate_routes(routes)


def detect_routes(
    source_code: str,
    file_path: str,
    project_root: str,
) -> list[dict]:
    """
    Detect:
    - Express routes
    - Next.js App Router API routes
    - Next.js App Router page routes
    """

    file_name = Path(file_path).name

    routes = []

    # ---------------------------------------------------------
    # Express routes
    # ---------------------------------------------------------

    routes.extend(
        detect_express_routes(
            source_code,
            file_path,
        )
    )

    # ---------------------------------------------------------
    # Next.js App Router API route
    # ---------------------------------------------------------

    if file_name in NEXT_ROUTE_FILES:
        routes.extend(
            detect_next_api_routes(
                source_code,
                file_path,
                project_root,
            )
        )

    # ---------------------------------------------------------
    # Next.js App Router page route
    # ---------------------------------------------------------

    if file_name in NEXT_PAGE_FILES:
        page_route = detect_next_page_route(
            file_path,
            project_root,
        )

        if page_route:
            routes.append(page_route)

    return routes


# =============================================================
# Express
# =============================================================


def detect_express_routes(
    source_code: str,
    file_path: str,
) -> list[dict]:
    """
    Detect Express-style routes.

    Examples:

    router.get("/users", getUsers)
    router.post("/users", createUser)
    app.get("/health", healthCheck)
    """

    routes = []

    lines = source_code.splitlines()

    pattern = re.compile(
        r"""
        (?:
            router
            |
            app
        )
        \.
        (?P<method>get|post|put|patch|delete|options|head)
        \s*
        \(
        \s*
        (?P<quote>["'`])
        (?P<path>.*?)
        (?P=quote)
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    for index, line in enumerate(lines):
        match = pattern.search(line)

        if not match:
            continue

        method = match.group(
            "method"
        ).upper()

        path = match.group("path")

        handler = extract_express_handler(
            line,
            match.end(),
        )

        routes.append(
            {
                "method": method,
                "path": path,
                "file": str(
                    Path(file_path).resolve()
                ),
                "handler": handler,
                "line": index + 1,
                "type": "express",
                "route_type": "api",
                "dynamic": contains_dynamic_parameter(
                    path
                ),
            }
        )

    return routes


def extract_express_handler(
    line: str,
    route_end: int,
) -> str | None:
    """
    Extract the first handler after the route path.

    Example:

    router.get("/users", getUsers)

    returns:

    getUsers
    """

    remainder = line[route_end:]

    if "," not in remainder:
        return None

    handler_part = remainder.split(
        ",",
        1,
    )[1]

    handler = (
        handler_part
        .split(")", 1)[0]
        .strip()
    )

    if not handler:
        return None

    # Remove trailing semicolon.
    handler = handler.rstrip(";").strip()

    # If middleware exists before the final handler,
    # keep the first meaningful token for now.
    if "," in handler:
        handler = handler.split(",", 1)[0].strip()

    return handler or None


# =============================================================
# Next.js API Routes
# =============================================================


def detect_next_api_routes(
    source_code: str,
    file_path: str,
    project_root: str,
) -> list[dict]:
    """
    Detect Next.js App Router HTTP handlers.

    Example:

    export async function GET() {}
    export function POST() {}
    """

    routes = []

    lines = source_code.splitlines()

    route_path = infer_next_route_path(
        file_path,
        project_root,
    )

    pattern = re.compile(
        r"""
        export
        \s+
        (?:
            async
            \s+
        )?
        function
        \s+
        (?P<method>GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)
        \b
        """,
        re.VERBOSE,
    )

    for index, line in enumerate(lines):
        match = pattern.search(line)

        if not match:
            continue

        method = match.group(
            "method"
        ).upper()

        routes.append(
            {
                "method": method,
                "path": route_path,
                "file": str(
                    Path(file_path).resolve()
                ),
                "handler": method,
                "line": index + 1,
                "type": "nextjs",
                "route_type": "api",
                "dynamic": contains_dynamic_parameter(
                    route_path
                ),
            }
        )

    return routes


# =============================================================
# Next.js Pages
# =============================================================


def detect_next_page_route(
    file_path: str,
    project_root: str,
) -> dict | None:
    """
    Detect a Next.js App Router page.

    Examples:

    app/page.tsx
        -> /

    app/dashboard/page.tsx
        -> /dashboard

    app/users/[id]/page.tsx
        -> /users/[id]

    app/docs/[...slug]/page.tsx
        -> /docs/[...slug]
    """

    route_path = infer_next_page_path(
        file_path,
        project_root,
    )

    if route_path is None:
        return None

    return {
        "method": "GET",
        "path": route_path,
        "file": str(
            Path(file_path).resolve()
        ),
        "handler": "page",
        "line": 1,
        "type": "nextjs",
        "route_type": "page",
        "dynamic": contains_dynamic_parameter(
            route_path
        ),
    }


# =============================================================
# Next.js Path Resolution
# =============================================================


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

    try:
        app_index = parts.index("app")
    except ValueError:
        return "/"

    route_parts = parts[app_index + 1 :]

    if route_parts:
        route_parts.pop()

    route_parts = normalize_next_route_parts(
        route_parts
    )

    if not route_parts:
        return "/"

    return "/" + "/".join(route_parts)


def infer_next_page_path(
    file_path: str,
    project_root: str,
) -> str | None:
    root = Path(project_root).resolve()
    path = Path(file_path).resolve()

    try:
        relative = path.relative_to(root)
    except ValueError:
        return None

    parts = list(relative.parts)

    try:
        app_index = parts.index("app")
    except ValueError:
        return None

    page_parts = parts[app_index + 1 :]

    if page_parts:
        page_parts.pop()

    page_parts = normalize_next_route_parts(
        page_parts
    )

    if not page_parts:
        return "/"

    return "/" + "/".join(page_parts)

def normalize_next_route_parts(
    parts: list[str],
) -> list[str]:
    """
    Normalize Next.js App Router segments.

    Removes route groups:

        (dashboard)

    Keeps dynamic segments:

        [id]

    Keeps catch-all:

        [...slug]

    Keeps optional catch-all:

        [[...slug]]
    """

    normalized = []

    for part in parts:
        if not part:
            continue

        # Route groups do not appear in URLs.
        if (
            part.startswith("(")
            and part.endswith(")")
        ):
            continue

        # Parallel routes do not appear as URL segments.
        if part.startswith("@"):
            continue

        normalized.append(part)

    return normalized


# =============================================================
# Utilities
# =============================================================


def contains_dynamic_parameter(
    path: str,
) -> bool:
    return "[" in path and "]" in path


def deduplicate_routes(
    routes: list[dict],
) -> list[dict]:
    """
    Prevent duplicate route records.
    """

    unique = {}

    for route in routes:
        key = (
            route.get("method"),
            route.get("path"),
            route.get("file"),
            route.get("line"),
        )

        unique[key] = route

    return list(unique.values())