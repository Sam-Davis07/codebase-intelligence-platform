from pathlib import Path
import re

from app.parsers.typescript_parser import parse_file


SUPPORTED_LANGUAGES = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "javascript",
}


def get_language(file_path: str) -> str | None:
    suffix = Path(file_path).suffix.lower()
    return SUPPORTED_LANGUAGES.get(suffix)


def get_node_name(node) -> str | None:
    if node is None:
        return None

    if node.type in {
        "identifier",
        "property_identifier",
        "private_property_identifier",
        "type_identifier",
        "shorthand_property_identifier_pattern",
    }:
        return node.text.decode("utf-8")

    return None


def find_enclosing_symbol(
    node,
    symbols: list[dict],
) -> dict | None:
    line = node.start_point.row + 1

    candidates = [
        symbol
        for symbol in symbols
        if symbol.get("start_line", 0)
        <= line
        <= symbol.get("end_line", 0)
    ]

    if not candidates:
        return None

    return min(
        candidates,
        key=lambda symbol: (
            symbol.get("end_line", 0)
            - symbol.get("start_line", 0)
        ),
    )


def extract_import_bindings(
    file_path: str,
) -> dict[str, str]:
    """
    Build a map of local imported names to their module source.

    Example:

        import { getAnalysisOverview } from "@/lib/analysis";

    becomes:

        {
            "getAnalysisOverview": "@/lib/analysis"
        }

    Aliases are supported:

        import {
            getAnalysisOverview as getOverview
        } from "@/lib/analysis";

    becomes:

        {
            "getOverview": "@/lib/analysis"
        }
    """

    bindings: dict[str, str] = {}

    path = Path(file_path)

    try:
        source = path.read_text(
            encoding="utf-8"
        )
    except UnicodeDecodeError:
        source = path.read_text(
            encoding="utf-8",
            errors="ignore",
        )

    # ---------------------------------------------------------------
    # Named imports
    # ---------------------------------------------------------------

    named_import_pattern = re.compile(
        r'import\s*\{(?P<imports>.*?)\}\s*from\s*["\'](?P<source>[^"\']+)["\']',
        re.DOTALL,
    )

    for match in named_import_pattern.finditer(source):
        imports = match.group("imports")
        import_source = match.group("source")

        for item in imports.split(","):
            item = item.strip()

            if not item:
                continue

            if item.startswith("type "):
                item = item[5:].strip()

            if " as " in item:
                imported, local = re.split(
                    r"\s+as\s+",
                    item,
                    maxsplit=1,
                )

                imported = imported.strip()
                local = local.strip()

                if local:
                    bindings[local] = import_source

            else:
                imported = item.strip()

                if imported:
                    bindings[imported] = import_source

    # ---------------------------------------------------------------
    # Default imports
    # ---------------------------------------------------------------

    default_import_pattern = re.compile(
        r'import\s+(?!\{|\*)'
        r'(?P<name>[A-Za-z_$][\w$]*)'
        r'(?:\s*,\s*\{.*?\})?'
        r'\s+from\s*["\'](?P<source>[^"\']+)["\']',
        re.DOTALL,
    )

    for match in default_import_pattern.finditer(source):
        bindings[
            match.group("name")
        ] = match.group("source")

    # ---------------------------------------------------------------
    # Namespace imports
    # ---------------------------------------------------------------

    namespace_import_pattern = re.compile(
        r'import\s+\*\s+as\s+'
        r'(?P<name>[A-Za-z_$][\w$]*)'
        r'\s+from\s*["\'](?P<source>[^"\']+)["\']'
    )

    for match in namespace_import_pattern.finditer(source):
        bindings[
            match.group("name")
        ] = match.group("source")

    return bindings


def build_dependency_lookup(
    file_result: dict,
) -> dict[str, dict]:
    lookup = {}

    for dependency in file_result.get(
        "dependencies",
        [],
    ):
        source = dependency.get("source")

        if not source:
            continue

        lookup[source] = dependency

    return lookup


def resolve_import_target(
    local_name: str,
    import_bindings: dict[str, str],
    dependency_lookup: dict[str, dict],
) -> str | None:

    import_source = import_bindings.get(
        local_name
    )

    if not import_source:
        return None

    dependency = dependency_lookup.get(
        import_source
    )

    if not dependency:
        return None

    resolved_file = dependency.get(
        "resolved_file"
    )

    if not resolved_file:
        return None

    return str(
        Path(resolved_file).resolve()
    )


def find_symbol_candidates(
    target_name: str,
    target_file: str | None,
    symbol_index: dict,
) -> list[dict]:

    candidates = symbol_index.get(
        target_name,
        [],
    )

    if not candidates:
        return []

    # ---------------------------------------------------------------
    # IMPORTANT:
    #
    # If we know which file the symbol came from,
    # ONLY return symbols from that file.
    #
    # This prevents false relationships such as:
    #
    # getFileName -> every getFileName in repository
    # ---------------------------------------------------------------

    if target_file:

        exact_matches = [
            candidate
            for candidate in candidates
            if str(
                Path(
                    candidate.get(
                        "file",
                        "",
                    )
                ).resolve()
            )
            == target_file
        ]

        return exact_matches

    return []


def build_reference(
    file_result: dict,
    source_symbol: dict,
    target_name: str,
    target_file: str,
    node,
    reference_type: str = "call",
) -> dict:

    return {
        "source_file": file_result["file"],
        "source_symbol": source_symbol["name"],
        "target_file": target_file,
        "target_symbol": target_name,
        "type": reference_type,
        "line": node.start_point.row + 1,
    }


def extract_call_references(
    node,
    file_result: dict,
    symbol_index: dict,
    import_bindings: dict[str, str],
    dependency_lookup: dict[str, dict],
) -> list[dict]:

    references = []

    # ---------------------------------------------------------------
    # Function call
    #
    # getAnalysisOverview()
    # ---------------------------------------------------------------

    if node.type == "call_expression":

        function_node = node.child_by_field_name(
            "function"
        )

        if function_node is not None:

            target_name = get_node_name(
                function_node
            )

            if target_name:

                source_symbol = find_enclosing_symbol(
                    node,
                    file_result.get(
                        "symbols",
                        [],
                    ),
                )

                if source_symbol:

                    target_file = resolve_import_target(
                        target_name,
                        import_bindings,
                        dependency_lookup,
                    )

                    candidates = find_symbol_candidates(
                        target_name,
                        target_file,
                        symbol_index,
                    )

                    for candidate in candidates:

                        candidate_file = candidate.get(
                            "file"
                        )

                        if not candidate_file:
                            continue

                        current_file = str(
                            Path(
                                file_result["file"]
                            ).resolve()
                        )

                        resolved_candidate = str(
                            Path(
                                candidate_file
                            ).resolve()
                        )

                        if (
                            current_file
                            == resolved_candidate
                        ):
                            continue

                        references.append(
                            build_reference(
                                file_result,
                                source_symbol,
                                target_name,
                                resolved_candidate,
                                node,
                                "call",
                            )
                        )

            # -------------------------------------------------------
            # Member call
            #
            # utils.getAnalysisOverview()
            # -------------------------------------------------------

            elif function_node.type in {
                "member_expression",
                "optional_member_expression",
            }:

                property_node = (
                    function_node.child_by_field_name(
                        "property"
                    )
                )

                object_node = (
                    function_node.child_by_field_name(
                        "object"
                    )
                )

                property_name = get_node_name(
                    property_node
                )

                object_name = get_node_name(
                    object_node
                )

                if (
                    property_name
                    and object_name
                ):

                    source_symbol = find_enclosing_symbol(
                        node,
                        file_result.get(
                            "symbols",
                            [],
                        ),
                    )

                    if source_symbol:

                        target_file = resolve_import_target(
                            object_name,
                            import_bindings,
                            dependency_lookup,
                        )

                        candidates = find_symbol_candidates(
                            property_name,
                            target_file,
                            symbol_index,
                        )

                        for candidate in candidates:

                            candidate_file = candidate.get(
                                "file"
                            )

                            if not candidate_file:
                                continue

                            current_file = str(
                                Path(
                                    file_result[
                                        "file"
                                    ]
                                ).resolve()
                            )

                            resolved_candidate = str(
                                Path(
                                    candidate_file
                                ).resolve()
                            )

                            if (
                                current_file
                                == resolved_candidate
                            ):
                                continue

                            references.append(
                                build_reference(
                                    file_result,
                                    source_symbol,
                                    property_name,
                                    resolved_candidate,
                                    node,
                                    "call",
                                )
                            )

    # ---------------------------------------------------------------
    # Function reference
    #
    # This handles:
    #
    # queryFn: getAnalysisOverview
    #
    # callback:
    #
    # onClick: getAnalysisOverview
    #
    # const fn = getAnalysisOverview
    #
    # The symbol is not called here, but it is still a
    # dependency relationship.
    # ---------------------------------------------------------------

    if node.type == "identifier":

        target_name = get_node_name(node)

        if target_name in import_bindings:

            source_symbol = find_enclosing_symbol(
                node,
                file_result.get(
                    "symbols",
                    [],
                ),
            )

            if source_symbol:

                target_file = resolve_import_target(
                    target_name,
                    import_bindings,
                    dependency_lookup,
                )

                candidates = find_symbol_candidates(
                    target_name,
                    target_file,
                    symbol_index,
                )

                for candidate in candidates:

                    candidate_file = candidate.get(
                        "file"
                    )

                    if not candidate_file:
                        continue

                    current_file = str(
                        Path(
                            file_result["file"]
                        ).resolve()
                    )

                    resolved_candidate = str(
                        Path(
                            candidate_file
                        ).resolve()
                    )

                    if (
                        current_file
                        == resolved_candidate
                    ):
                        continue

                    # ------------------------------------------------
                    # Don't create a duplicate if this identifier is
                    # already part of a call expression.
                    # ------------------------------------------------

                    parent = node.parent

                    if (
                        parent is not None
                        and parent.type
                        == "call_expression"
                        and parent.child_by_field_name(
                            "function"
                        )
                        is node
                    ):
                        continue

                    references.append(
                        build_reference(
                            file_result,
                            source_symbol,
                            target_name,
                            resolved_candidate,
                            node,
                            "reference",
                        )
                    )

    # ---------------------------------------------------------------
    # Recursive traversal
    # ---------------------------------------------------------------

    for child in node.children:

        references.extend(
            extract_call_references(
                child,
                file_result,
                symbol_index,
                import_bindings,
                dependency_lookup,
            )
        )

    return references


def deduplicate_references(
    references: list[dict],
) -> list[dict]:

    unique = {}

    for reference in references:

        key = (
            reference.get("source_file"),
            reference.get("source_symbol"),
            reference.get("target_file"),
            reference.get("target_symbol"),
            reference.get("type"),
            reference.get("line"),
        )

        unique[key] = reference

    return list(
        unique.values()
    )


def build_symbol_references(
    file_results: list[dict],
    symbol_index: dict,
) -> list[dict]:

    references = []

    for file_result in file_results:

        if "error" in file_result:
            continue

        file_path = file_result.get(
            "file"
        )

        if not file_path:
            continue

        language = get_language(
            file_path
        )

        if language is None:
            continue

        try:

            parsed = parse_file(
                file_path,
                language,
            )

            root_node = parsed[
                "root_node"
            ]

        except Exception:

            continue

        import_bindings = extract_import_bindings(
            file_path
        )

        dependency_lookup = build_dependency_lookup(
            file_result
        )

        file_references = (
            extract_call_references(
                root_node,
                file_result,
                symbol_index,
                import_bindings,
                dependency_lookup,
            )
        )

        references.extend(
            file_references
        )

    return deduplicate_references(
        references
    )