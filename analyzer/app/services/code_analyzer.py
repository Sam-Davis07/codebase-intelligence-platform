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
from app.services.smell_detector import detect_long_functions

def get_language(file_path: str) -> str | None:
    suffix = Path(file_path).suffix.lower()

    if suffix == ".ts":
        return "typescript"

    if suffix == ".tsx":
        return "tsx"

    return None


def extract_functions(node):
    functions = []

    if node.type in {
        "function_declaration",
        "method_definition",
        "arrow_function",
    }:
        name = None

        # Function declarations usually have an identifier child.
        for child in node.children:
            if child.type == "identifier":
                name = child.text.decode("utf-8")
                break

        complexity = calculate_cyclomatic_complexity(node)

        functions.append(
            {
                "name": name,
                "type": node.type,
                "start_line": node.start_point.row + 1,
                "end_line": node.end_point.row + 1,
                "line_count": node.end_point.row - node.start_point.row + 1,
                "complexity": complexity,
                "complexity_risk": classify_complexity(complexity),
            }
        )

    for child in node.children:
        functions.extend(extract_functions(child))

    return functions


def analyze_file(file_path: str, project_root: str) -> dict:
    language = get_language(file_path)

    if language is None:
        raise ValueError(f"Unsupported file type: {file_path}")

    result = parse_file(file_path, language)

    root_node = result["root_node"]

    functions = extract_functions(root_node)
    smells = detect_long_functions(functions)
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
        "imports": imports,
        "exports": exports,
        "dependencies": dependencies,
        "smells": smells,
    }