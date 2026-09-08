from collections import defaultdict


def build_symbol_index(file_results: list[dict]) -> dict:
    """
    Build a repository-wide index of symbols.

    Symbols are grouped by name, while each occurrence keeps
    its file, type, and source location.

    Example:

        {
            "cn": [
                {
                    "file": "src/lib/utils.ts",
                    "type": "function",
                    "start_line": 4,
                    "end_line": 6
                }
            ]
        }
    """

    index = defaultdict(list)

    for file_result in file_results:
        # Skip files that failed during analysis.
        if "error" in file_result:
            continue

        file_path = file_result.get("file")

        if not file_path:
            continue

        symbols = file_result.get("symbols", [])

        for symbol in symbols:
            name = symbol.get("name")

            if not name:
                continue

            index[name].append(
                {
                    "file": file_path,
                    "type": symbol.get("type"),
                    "start_line": symbol.get("start_line"),
                    "end_line": symbol.get("end_line"),
                }
            )

    return dict(index)