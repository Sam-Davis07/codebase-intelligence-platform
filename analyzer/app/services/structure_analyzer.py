from pathlib import Path


def classify_file_role(
    file_path: str,
    project_root: str,
) -> str:
    path = Path(file_path)
    root = Path(project_root)

    relative_path = path.relative_to(root)
    parts = [part.lower() for part in relative_path.parts]

    file_name = path.name.lower()
    suffix = path.suffix.lower()

    # -------------------------
    # Configuration
    # -------------------------

    if file_name in {
        "package.json",
        "tsconfig.json",
        "next.config.ts",
        "next.config.js",
        "vite.config.ts",
        "vite.config.js",
    }:
        return "configuration"

    # -------------------------
    # Database
    # -------------------------

    if "prisma" in parts:
        if file_name == "schema.prisma":
            return "database_schema"

        return "database"

    if any(
        part in {
            "migrations",
            "migration",
            "models",
        }
        for part in parts
    ):
        return "database"

    # -------------------------
    # API Routes
    # -------------------------

    if any(
        part in {
            "routes",
            "api",
            "controllers",
        }
        for part in parts
    ):
        return "api_route"

    # -------------------------
    # Services / Business Logic
    # -------------------------

    if any(
        part in {
            "services",
            "service",
        }
        for part in parts
    ):
        return "service"

    # -------------------------
    # Components
    # -------------------------

    if any(
        part in {
            "components",
            "component",
        }
        for part in parts
    ):
        if "ui" in parts:
            return "ui_component"

        return "component"

    # -------------------------
    # Utilities
    # -------------------------

    if any(
        part in {
            "utils",
            "utility",
            "helpers",
            "lib",
        }
        for part in parts
    ):
        return "utility"

    # -------------------------
    # Parsers
    # -------------------------

    if any(
        part in {
            "parsers",
            "parser",
        }
        for part in parts
    ):
        return "parser"

    # -------------------------
    # Middleware
    # -------------------------

    if any(
        part in {
            "middleware",
            "middlewares",
        }
        for part in parts
    ):
        return "middleware"

    # -------------------------
    # Hooks
    # -------------------------

    if any(
        part in {
            "hooks",
        }
        for part in parts
    ):
        return "hook"

    # -------------------------
    # Tests
    # -------------------------

    if (
        "tests" in parts
        or "test" in parts
        or file_name.endswith(".test.ts")
        or file_name.endswith(".test.tsx")
        or file_name.endswith(".spec.ts")
        or file_name.endswith(".spec.tsx")
    ):
        return "test"

    # -------------------------
    # Frontend App Pages
    # -------------------------

    if "app" in parts:
        if file_name in {
            "page.tsx",
            "page.ts",
            "page.jsx",
            "page.js",
        }:
            return "application_page"

        if file_name in {
            "layout.tsx",
            "layout.ts",
            "layout.jsx",
            "layout.js",
        }:
            return "application_layout"

    # -------------------------
    # Default
    # -------------------------

    if suffix in {
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".py",
    }:
        return "source"

    return "unknown"


def analyze_repository_structure(
    file_results: list[dict],
    project_root: str,
) -> dict:
    roles = {}

    directories = set()

    for result in file_results:
        if "error" in result:
            continue

        file_path = Path(result["file"])

        relative_path = file_path.relative_to(
            Path(project_root)
        )

        role = classify_file_role(
            result["file"],
            project_root,
        )

        result["role"] = role

        for parent in relative_path.parents:
            if str(parent) != ".":
                directories.add(str(parent))

        roles[role] = roles.get(role, 0) + 1

    return {
        "total_directories": len(directories),
        "total_files": len(file_results),
        "roles": roles,
    }