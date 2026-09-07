from pathlib import Path


ENTRY_POINT_FILES = {
    # Next.js App Router
    "page.tsx": "Next.js App Router page entry point",
    "page.ts": "Next.js App Router page entry point",
    "page.jsx": "Next.js App Router page entry point",
    "page.js": "Next.js App Router page entry point",

    "layout.tsx": "Next.js App Router layout entry point",
    "layout.ts": "Next.js App Router layout entry point",
    "layout.jsx": "Next.js App Router layout entry point",
    "layout.js": "Next.js App Router layout entry point",

    "route.ts": "Next.js App Router API route entry point",
    "route.js": "Next.js App Router API route entry point",

    # Node / Express
    "server.ts": "Node.js server entry point",
    "server.js": "Node.js server entry point",
    "main.ts": "Application main entry point",
    "main.js": "Application main entry point",
    "index.ts": "Application entry point",
    "index.js": "Application entry point",

    # Python
    "main.py": "Python application entry point",
    "app.py": "Python application entry point",
}


def analyze_entry_points(
    file_results: list[dict],
    project_root: str,
) -> dict:
    entry_points = []

    root = Path(project_root)

    for result in file_results:
        if "error" in result:
            continue

        file_path = Path(result["file"])

        try:
            relative_path = file_path.relative_to(root)
        except ValueError:
            continue

        file_name = file_path.name.lower()
        parts = {
            part.lower()
            for part in relative_path.parts
        }

        reason = None
        entry_type = None

        # -------------------------
        # Next.js App Router
        # -------------------------

        if "app" in parts and file_name in {
            "page.tsx",
            "page.ts",
            "page.jsx",
            "page.js",
        }:
            reason = "Next.js App Router page entry point"
            entry_type = "framework_entry_point"

        elif "app" in parts and file_name in {
            "layout.tsx",
            "layout.ts",
            "layout.jsx",
            "layout.js",
        }:
            reason = "Next.js App Router layout entry point"
            entry_type = "framework_entry_point"

        elif "app" in parts and file_name in {
            "route.ts",
            "route.js",
        }:
            reason = "Next.js App Router API route entry point"
            entry_type = "framework_entry_point"

        # -------------------------
        # Node / Express
        # -------------------------

        elif file_name in {
            "server.ts",
            "server.js",
        }:
            reason = "Node.js server entry point"
            entry_type = "application_entry_point"

        elif file_name in {
            "main.ts",
            "main.js",
        }:
            reason = "Application main entry point"
            entry_type = "application_entry_point"

        # -------------------------
        # Python
        # -------------------------

        elif file_name == "main.py":
            reason = "Python application entry point"
            entry_type = "application_entry_point"

        elif file_name == "app.py":
            reason = "Python application entry point"
            entry_type = "application_entry_point"

        # -------------------------
        # Generic index files
        # -------------------------

        elif file_name in {
            "index.ts",
            "index.js",
        }:
            reason = "Application entry point"
            entry_type = "application_entry_point"

        if reason:
            entry_points.append(
                {
                    "file": str(relative_path),
                    "type": entry_type,
                    "reason": reason,
                }
            )

    return {
        "total_entry_points": len(entry_points),
        "entry_points": entry_points,
    }