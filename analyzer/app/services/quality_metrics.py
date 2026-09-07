def calculate_repository_metrics(
    file_results: list[dict],
) -> dict:
    valid_files = [
        result
        for result in file_results
        if "error" not in result
    ]

    total_files = len(valid_files)

    total_lines = sum(
        result["metrics"]["total_lines"]
        for result in valid_files
    )

    total_blank_lines = sum(
        result["metrics"]["blank_lines"]
        for result in valid_files
    )

    total_non_empty_lines = sum(
        result["metrics"]["non_empty_lines"]
        for result in valid_files
    )

    all_functions = [
        function
        for result in valid_files
        for function in result.get("functions", [])
    ]

    total_functions = len(all_functions)

    if total_functions:
        average_function_size = (
            sum(
                function["line_count"]
                for function in all_functions
            )
            / total_functions
        )

        average_complexity = (
            sum(
                function["complexity"]
                for function in all_functions
            )
            / total_functions
        )

        max_complexity = max(
            function["complexity"]
            for function in all_functions
        )

    else:
        average_function_size = 0
        average_complexity = 0
        max_complexity = 0

    all_smells = [
        smell
        for result in valid_files
        for smell in result.get("smells", [])
    ]

    files_with_smells = sum(
        1
        for result in valid_files
        if result.get("smells")
    )

    return {
        "total_files": total_files,
        "total_lines": total_lines,
        "total_blank_lines": total_blank_lines,
        "total_non_empty_lines": total_non_empty_lines,
        "total_functions": total_functions,
        "average_function_size": round(
            average_function_size,
            2,
        ),
        "average_complexity": round(
            average_complexity,
            2,
        ),
        "max_complexity": max_complexity,
        "total_code_smells": len(all_smells),
        "files_with_smells": files_with_smells,
    }