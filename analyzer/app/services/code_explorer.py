from collections import defaultdict


def build_code_explorer(
    file_results: list[dict],
    symbol_index: dict,
    symbol_references: list[dict],
) -> dict:
    """
    Build a repository-level representation for Code Explorer.

    Provides:
    - analyzed files
    - symbols per file
    - imports/dependencies
    - symbol references
    - incoming/outgoing references
    """

    files = []

    references_by_source = defaultdict(list)
    references_by_target = defaultdict(list)

    for reference in symbol_references:
        source_file = reference.get("source_file")
        target_file = reference.get("target_file")

        if source_file:
            references_by_source[source_file].append(
                reference
            )

        if target_file:
            references_by_target[target_file].append(
                reference
            )

    for file_result in file_results:
        if "error" in file_result:
            continue

        file_path = file_result.get("file")

        if not file_path:
            continue

        symbols = []

        for symbol in file_result.get("symbols", []):
            name = symbol.get("name")

            if not name:
                continue

            symbols.append(
                {
                    "name": name,
                    "type": symbol.get("type"),
                    "start_line": symbol.get(
                        "start_line"
                    ),
                    "end_line": symbol.get(
                        "end_line"
                    ),
                }
            )

        dependencies = []

        for dependency in file_result.get(
            "dependencies",
            [],
        ):
            dependencies.append(
                {
                    "source": dependency.get(
                        "source"
                    ),
                    "type": dependency.get(
                        "type"
                    ),
                    "resolved_file": dependency.get(
                        "resolved_file"
                    ),
                }
            )

        files.append(
            {
                "file": file_path,
                "symbols": symbols,
                "dependencies": dependencies,
                "incoming_references": len(
                    references_by_target.get(
                        file_path,
                        [],
                    )
                ),
                "outgoing_references": len(
                    references_by_source.get(
                        file_path,
                        [],
                    )
                ),
            }
        )

    return {
        "summary": {
            "total_files": len(files),
            "total_symbols": sum(
                len(file["symbols"])
                for file in files
            ),
            "total_references": len(
                symbol_references
            ),
        },
        "files": files,
        "symbol_index": symbol_index,
        "references": symbol_references,
    }