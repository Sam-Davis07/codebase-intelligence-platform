LONG_FUNCTION_THRESHOLD = 50


def detect_long_functions(
    functions: list[dict],
) -> list[dict]:
    smells = []

    for function in functions:
        line_count = function["line_count"]

        if line_count > LONG_FUNCTION_THRESHOLD:
            smells.append(
                {
                    "type": "long_function",
                    "severity": "warning",
                    "message": (
                        f"Function exceeds "
                        f"{LONG_FUNCTION_THRESHOLD} lines"
                    ),
                    "function": function["name"],
                    "line": function["start_line"],
                    "line_count": line_count,
                }
            )

    return smells