from pathlib import Path

from app.parsers.typescript_parser import parse_file


def get_language(file_path: str) -> str | None:
    """
    Determine the Tree-sitter language from the file extension.
    """

    suffix = Path(file_path).suffix.lower()

    if suffix == ".ts":
        return "typescript"

    if suffix == ".tsx":
        return "tsx"

    return None


def get_node_name(node) -> str | None:
    """
    Extract an identifier name from a Tree-sitter node.
    """

    if node.type in {
        "identifier",
        "property_identifier",
        "private_property_identifier",
        "type_identifier",
    }:
        return node.text.decode("utf-8")

    return None


def find_enclosing_symbol(node, symbols: list[dict]) -> dict | None:
    """
    Find the symbol that contains a given AST node.

    A symbol is considered the owner of the node when
    the node's source location falls inside the symbol's
    start/end line range.
    """

    line = node.start_point.row + 1

    candidates = [
        symbol
        for symbol in symbols
        if symbol["start_line"] <= line <= symbol["end_line"]
    ]

    if not candidates:
        return None

    # Prefer the smallest enclosing symbol.
    return min(
        candidates,
        key=lambda symbol: (
            symbol["end_line"] - symbol["start_line"]
        ),
    )


def extract_call_references(
    node,
    file_result: dict,
    symbol_index: dict,
) -> list[dict]:
    """
    Extract function-call references from an AST.

    Example:

        cn("foo")

    becomes a reference to the symbol named "cn".
    """

    references = []

    if node.type == "call_expression":
        function_node = node.child_by_field_name("function")

        if function_node is not None:
            target_name = get_node_name(function_node)

            if target_name:
                source_symbol = find_enclosing_symbol(
                    node,
                    file_result.get("symbols", []),
                )

                if source_symbol:
                    candidates = symbol_index.get(target_name, [])

                    for candidate in candidates:
                        if candidate["file"] == file_result["file"]:
                            continue

                        references.append(
                            {
                                "source_file": file_result["file"],
                                "source_symbol": source_symbol["name"],
                                "target_file": candidate["file"],
                                "target_symbol": target_name,
                                "type": "call",
                                "line": node.start_point.row + 1,
                            }
                        )

    for child in node.children:
        references.extend(
            extract_call_references(
                child,
                file_result,
                symbol_index,
            )
        )

    return references


def build_symbol_references(
    file_results: list[dict],
    symbol_index: dict,
) -> list[dict]:
    """
    Build repository-wide symbol references.

    Each file is parsed again so that we can inspect
    its AST and identify actual symbol usage.
    """

    references = []

    for file_result in file_results:
        if "error" in file_result:
            continue

        file_path = file_result.get("file")

        if not file_path:
            continue

        language = get_language(file_path)

        if language is None:
            continue

        parsed = parse_file(
            file_path,
            language,
        )

        root_node = parsed["root_node"]

        file_references = extract_call_references(
            root_node,
            file_result,
            symbol_index,
        )

        references.extend(file_references)

    return references