from collections import defaultdict

from app.services.file_intelligence import (
    build_file_intelligence,
)


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
    - file intelligence
    """

    files = []

    references_by_source = defaultdict(list)
    references_by_target = defaultdict(list)

    # ------------------------------------------------------------------
    # Index symbol references by source and target file
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Build file-level Code Explorer information
    # ------------------------------------------------------------------

    for file_result in file_results:
        # Skip files that failed during analysis.
        if "error" in file_result:
            continue

        file_path = file_result.get("file")

        if not file_path:
            continue

        # --------------------------------------------------------------
        # Symbols
        # --------------------------------------------------------------

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

        # --------------------------------------------------------------
        # Dependencies
        # --------------------------------------------------------------

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

        # --------------------------------------------------------------
        # File intelligence
        # --------------------------------------------------------------

        intelligence = build_file_intelligence(
            file_result
        )

        # --------------------------------------------------------------
        # References
        # --------------------------------------------------------------

        incoming_references = references_by_target.get(
            file_path,
            [],
        )

        outgoing_references = references_by_source.get(
            file_path,
            [],
        )

        # --------------------------------------------------------------
        # Final file representation
        # --------------------------------------------------------------

        files.append(
            {
                "file": file_path,

                "symbols": symbols,

                "dependencies": dependencies,

                "incoming_references": len(
                    incoming_references
                ),

                "outgoing_references": len(
                    outgoing_references
                ),

                "intelligence": intelligence,
            }
        )

    # ------------------------------------------------------------------
    # Repository summary
    # ------------------------------------------------------------------

    total_symbols = sum(
        len(file["symbols"])
        for file in files
    )

    return {
        "summary": {
            "total_files": len(files),
            "total_symbols": total_symbols,
            "total_references": len(
                symbol_references
            ),
        },

        "files": files,

        "symbol_index": symbol_index,

        "references": symbol_references,
    }