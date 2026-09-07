from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.file_service import get_source_files
from app.services.code_analyzer import analyze_file
from app.services.dependency_graph import build_dependency_graph
from app.services.graph_analyzer import analyze_dependency_graph
from app.services.quality_metrics import (
    calculate_repository_metrics,
)
from app.services.quality_score import (
    calculate_quality_score,
)

router = APIRouter(prefix="/analyze", tags=["Analysis"])

class AnalyzeRequest(BaseModel):
    path: str


@router.post("")
def analyze(request: AnalyzeRequest):
    try:
        files = get_source_files(request.path)

        results = []

        for file in files:
            try:
                result = analyze_file(
                    str(file),
                    str(Path(request.path).resolve()),
                )
                results.append(result)

            except Exception as error:
                results.append(
                    {
                        "file": str(file),
                        "error": str(error),
                    }
                )
        graph = build_dependency_graph(results)
        graph_analysis = analyze_dependency_graph(graph)

        repository_metrics = calculate_repository_metrics(results)

        quality_score = calculate_quality_score(
            repository_metrics,
            graph_analysis,
        )
        
        return {
            "path": str(Path(request.path).resolve()),
            "file_count": len(files),
            "files": results,
            "repository_metrics": repository_metrics,
            "quality_score": quality_score,
            "dependency_graph": graph,
            "graph_analysis": graph_analysis,
        }

    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error))

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))