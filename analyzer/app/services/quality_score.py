def calculate_quality_score(
    repository_metrics: dict,
    graph_analysis: dict,
) -> dict:

    # -------------------------
    # Complexity Score
    # -------------------------

    average_complexity = repository_metrics[
        "average_complexity"
    ]

    if average_complexity <= 5:
        complexity_score = 100
    elif average_complexity <= 10:
        complexity_score = 75
    elif average_complexity <= 20:
        complexity_score = 50
    else:
        complexity_score = 25

    # -------------------------
    # Code Smell Score
    # -------------------------

    total_files = repository_metrics["total_files"]
    total_smells = repository_metrics["total_code_smells"]

    if total_files == 0:
        smell_density = 0
    else:
        smell_density = total_smells / total_files

    if smell_density == 0:
        smell_score = 100
    elif smell_density <= 0.25:
        smell_score = 90
    elif smell_density <= 0.5:
        smell_score = 75
    elif smell_density <= 1:
        smell_score = 50
    else:
        smell_score = 25

    # -------------------------
    # Maintainability Score
    # -------------------------

    average_function_size = repository_metrics[
        "average_function_size"
    ]

    if average_function_size <= 20:
        maintainability_score = 100
    elif average_function_size <= 40:
        maintainability_score = 80
    elif average_function_size <= 60:
        maintainability_score = 60
    else:
        maintainability_score = 40

    # -------------------------
    # Architecture Score
    # -------------------------

    summary = graph_analysis["summary"]

    circular_dependencies = summary[
        "circular_dependencies"
    ]

    isolated_files = summary["isolated_files"]

    architecture_score = 100

    if circular_dependencies > 0:
        architecture_score -= min(
            circular_dependencies * 20,
            60,
        )

    if total_files > 0:
        isolated_ratio = isolated_files / total_files

        if isolated_ratio > 0.5:
            architecture_score -= 20
        elif isolated_ratio > 0.25:
            architecture_score -= 10

    architecture_score = max(
        architecture_score,
        0,
    )

    # -------------------------
    # Final Score
    # -------------------------

    overall_score = round(
        (
            complexity_score * 0.30
            + smell_score * 0.30
            + maintainability_score * 0.20
            + architecture_score * 0.20
        )
    )

    return {
        "overall_score": overall_score,

        "components": {
            "complexity": complexity_score,
            "code_smells": smell_score,
            "maintainability": maintainability_score,
            "architecture": architecture_score,
        },

        "details": {
            "average_complexity": average_complexity,
            "smell_density": round(
                smell_density,
                2,
            ),
            "average_function_size": average_function_size,
            "circular_dependencies": circular_dependencies,
            "isolated_files": isolated_files,
        },
    }