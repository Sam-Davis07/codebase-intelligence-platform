from pathlib import Path

from app.parsers.typescript_parser import (
    extract_exports,
    extract_imports,
    parse_file,
)

from app.services.metrics import (
    calculate_cyclomatic_complexity,
    calculate_file_metrics,
    classify_complexity,
)

from app.services.dependency_service import resolve_import
from app.services.smell_detector import (
    detect_high_complexity,
    detect_long_functions,
    detect_too_many_parameters,
    detect_deep_nesting,
)

def get_language(file_path: str) -> str | None:
    suffix = Path(file_path).suffix.lower()

    if suffix == ".ts":
        return "typescript"

    if suffix == ".tsx":
        return "tsx"

    return None


def extract_functions(root_node):
    functions = []
    stack = [root_node]

    while stack:
        node = stack.pop()

        if node.type in {
            "function_declaration",
            "method_definition",
            "arrow_function",
        }:
            name = None
            parameter_count = 0

            for child in node.named_children:
                if child.type in {
                    "identifier",
                    "property_identifier",
                    "private_property_identifier",
                }:
                    if name is None:
                        name = child.text.decode("utf-8")

                elif child.type == "formal_parameters":
                    parameter_count = sum(
                        1
                        for parameter in child.named_children
                        if parameter.type != "comment"
                    )

            complexity = calculate_cyclomatic_complexity(node)

            functions.append(
                {
                    "name": name,
                    "type": node.type,
                    "start_line": node.start_point.row + 1,
                    "end_line": node.end_point.row + 1,
                    "line_count": (
                        node.end_point.row
                        - node.start_point.row
                        + 1
                    ),
                    "complexity": complexity,
                    "complexity_risk": classify_complexity(
                        complexity
                    ),
                    "parameter_count": parameter_count,
                }
            )

        stack.extend(reversed(node.named_children))

    return functions


def analyze_file(file_path: str, project_root: str) -> dict:
    language = get_language(file_path)

    if language is None:
        raise ValueError(f"Unsupported file type: {file_path}")

    result = parse_file(file_path, language)

    root_node = result["root_node"]

    functions = extract_functions(root_node)
    symbols = extract_symbols(root_node)
    smells = detect_long_functions(functions)
    smells.extend(detect_high_complexity(functions))
    smells.extend(detect_too_many_parameters(functions))
    smells.extend(detect_deep_nesting(root_node))
    imports = extract_imports(root_node)
    dependencies = [
        resolve_import(
            source_file=file_path,
            import_source=import_data["source"],
            project_root=project_root,
        )
        for import_data in imports
    ]
    exports = extract_exports(root_node)

    metrics = calculate_file_metrics(file_path)

    return {
        "file": result["file"],
        "language": result["language"],
        "metrics": metrics,
        "functions": functions,
        "symbols": symbols,
        "imports": imports,
        "exports": exports,
        "dependencies": dependencies,
        "smells": smells,
    }
    
def extract_symbols(root_node):
    symbols = []

    cursor = root_node.walk()

    while True:
        node = cursor.node

        if node.type == "function_declaration":
            name = None

            for child in node.named_children:
                if child.type == "identifier":
                    name = child.text.decode("utf-8")
                    break

            if name:
                symbols.append(
                    {
                        "name": name,
                        "type": "function",
                        "start_line": node.start_point.row + 1,
                        "end_line": node.end_point.row + 1,
                    }
                )

        elif node.type == "method_definition":
            name = None

            for child in node.named_children:
                if child.type in {
                    "property_identifier",
                    "private_property_identifier",
                    "identifier",
                }:
                    name = child.text.decode("utf-8")
                    break

            if name:
                symbols.append(
                    {
                        "name": name,
                        "type": "method",
                        "start_line": node.start_point.row + 1,
                        "end_line": node.end_point.row + 1,
                    }
                )

        elif node.type == "variable_declarator":
            name = None
            value = None

            for child in node.named_children:
                if child.type == "identifier":
                    name = child

                elif child.type == "arrow_function":
                    value = child

            if name and value:
                symbols.append(
                    {
                        "name": name.text.decode("utf-8"),
                        "type": "arrow_function",
                        "start_line": node.start_point.row + 1,
                        "end_line": node.end_point.row + 1,
                    }
                )

        elif node.type == "class_declaration":
            name = None

            for child in node.named_children:
                if child.type == "type_identifier":
                    name = child.text.decode("utf-8")
                    break

            if name:
                symbols.append(
                    {
                        "name": name,
                        "type": "class",
                        "start_line": node.start_point.row + 1,
                        "end_line": node.end_point.row + 1,
                    }
                )

        elif node.type == "interface_declaration":
            name = None

            for child in node.named_children:
                if child.type == "type_identifier":
                    name = child.text.decode("utf-8")
                    break

            if name:
                symbols.append(
                    {
                        "name": name,
                        "type": "interface",
                        "start_line": node.start_point.row + 1,
                        "end_line": node.end_point.row + 1,
                    }
                )

        elif node.type == "type_alias_declaration":
            name = None

            for child in node.named_children:
                if child.type == "type_identifier":
                    name = child.text.decode("utf-8")
                    break

            if name:
                symbols.append(
                    {
                        "name": name,
                        "type": "type",
                        "start_line": node.start_point.row + 1,
                        "end_line": node.end_point.row + 1,
                    }
                )

        # TreeCursor traversal
        if cursor.goto_first_child():
            continue

        while True:
            if cursor.goto_next_sibling():
                break

            if not cursor.goto_parent():
                return symbols