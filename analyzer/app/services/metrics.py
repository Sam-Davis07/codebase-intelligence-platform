from pathlib import Path


def calculate_file_metrics(file_path: str) -> dict:
    path = Path(file_path)

    source = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    lines = source.splitlines()

    total_lines = len(lines)

    blank_lines = sum(
        1
        for line in lines
        if not line.strip()
    )

    non_empty_lines = total_lines - blank_lines

    return {
        "total_lines": total_lines,
        "blank_lines": blank_lines,
        "non_empty_lines": non_empty_lines,
    }


def calculate_cyclomatic_complexity(node) -> int:
    """
    Calculate an approximate cyclomatic complexity
    from a Tree-sitter AST node.

    Complexity starts at 1.

    Additional complexity is added for:
    - if statements
    - for loops
    - while loops
    - switch cases
    - catch clauses
    - logical && / || conditions
    - ternary expressions
    """

    complexity = 1

    decision_nodes = {
        "if_statement",
        "for_statement",
        "for_in_statement",
        "while_statement",
        "do_statement",
        "switch_case",
        "catch_clause",
        "ternary_expression",
    }

    logical_operators = {
        "&&",
        "||",
    }

    def walk(current_node):
        nonlocal complexity

        if current_node.type in decision_nodes:
            complexity += 1

        if current_node.type in logical_operators:
            complexity += 1

        for child in current_node.children:
            walk(child)

    for child in node.children:
        walk(child)

    return complexity

def classify_complexity(complexity: int) -> str:
    if complexity <= 5:
        return "low"

    if complexity <= 10:
        return "moderate"

    if complexity <= 20:
        return "high"

    return "critical"