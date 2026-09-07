LONG_FUNCTION_THRESHOLD = 50
HIGH_COMPLEXITY_THRESHOLD = 10
TOO_MANY_PARAMETERS_THRESHOLD = 5

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


def detect_high_complexity(
    functions: list[dict],
) -> list[dict]:
    smells = []

    for function in functions:
        complexity = function["complexity"]

        if complexity > HIGH_COMPLEXITY_THRESHOLD:
            risk = function["complexity_risk"]

            severity = (
                "critical"
                if risk == "critical"
                else "warning"
            )

            smells.append(
                {
                    "type": "high_complexity",
                    "severity": severity,
                    "message": (
                        f"Function has complexity "
                        f"of {complexity}"
                    ),
                    "function": function["name"],
                    "line": function["start_line"],
                    "complexity": complexity,
                    "complexity_risk": risk,
                }
            )

    return smells



def detect_too_many_parameters(
    functions: list[dict],
) -> list[dict]:
    smells = []

    for function in functions:
        parameter_count = function.get("parameter_count", 0)

        if parameter_count > TOO_MANY_PARAMETERS_THRESHOLD:
            smells.append(
                {
                    "type": "too_many_parameters",
                    "severity": "warning",
                    "message": (
                        f"Function has {parameter_count} parameters"
                    ),
                    "function": function["name"],
                    "line": function["start_line"],
                    "parameter_count": parameter_count,
                }
            )

    return smells