from pathlib import Path


def detect_framework_relationships(
    file_results: list[dict],
    project_root: str,
) -> list[dict]:
    relationships = []

    root = Path(project_root)

    files = []

    for result in file_results:
        if "error" in result:
            continue

        path = Path(result["file"])

        try:
            relative_path = path.relative_to(root)
        except ValueError:
            continue

        files.append(
            {
                "absolute": path,
                "relative": relative_path,
            }
        )

    # --------------------------------------------------
    # Next.js App Router relationships
    # --------------------------------------------------

    app_files = [
        file
        for file in files
        if "app" in {
            part.lower()
            for part in file["relative"].parts
        }
    ]

    layouts = [
        file
        for file in app_files
        if file["absolute"].name.lower()
        in {
            "layout.tsx",
            "layout.ts",
            "layout.jsx",
            "layout.js",
        }
    ]

    pages = [
        file
        for file in app_files
        if file["absolute"].name.lower()
        in {
            "page.tsx",
            "page.ts",
            "page.jsx",
            "page.js",
        }
    ]

    for page in pages:
        page_relative = page["relative"]

        page_directory = page_relative.parent

        matching_layout = None

        for layout in layouts:
            if layout["relative"].parent == page_directory:
                matching_layout = layout
                break

        if matching_layout:
            relationships.append(
                {
                    "source": str(
                        matching_layout["relative"]
                    ),
                    "target": str(
                        page["relative"]
                    ),
                    "type": "framework",
                    "relationship": "wraps",
                    "framework": "nextjs",
                    "reason": (
                        "Next.js App Router layouts "
                        "wrap pages in the same route segment"
                    ),
                }
            )

    return relationships