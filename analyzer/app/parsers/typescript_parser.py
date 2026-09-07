from pathlib import Path

from tree_sitter import Language, Parser
import tree_sitter_typescript


TS_LANGUAGE = Language(tree_sitter_typescript.language_typescript())
TSX_LANGUAGE = Language(tree_sitter_typescript.language_tsx())


def create_parser(language: str) -> Parser:
    parser = Parser()

    if language == "typescript":
        parser.language = TS_LANGUAGE
    elif language == "tsx":
        parser.language = TSX_LANGUAGE
    else:
        raise ValueError(f"Unsupported language: {language}")

    return parser


def parse_file(file_path: str, language: str) -> dict:
    path = Path(file_path)

    source_code = path.read_bytes()

    parser = create_parser(language)

    tree = parser.parse(source_code)

    return {
        "file": str(path),
        "language": language,
        "root_node": tree.root_node,
    }


def extract_imports(root_node) -> list[dict]:
    imports = []

    for node in root_node.children:
        if node.type != "import_statement":
            continue

        source = None

        for child in node.children:
            if child.type == "string":
                source = child.text.decode("utf-8").strip("'\"")
                break

        if source:
            imports.append(
                {
                    "source": source,
                    "line": node.start_point.row + 1,
                }
            )

    return imports


def extract_exports(root_node) -> list[dict]:
    exports = []

    for node in root_node.children:
        if node.type != "export_statement":
            continue

        exports.append(
            {
                "line": node.start_point.row + 1,
                "text": node.text.decode("utf-8")[:200],
            }
        )

    return exports