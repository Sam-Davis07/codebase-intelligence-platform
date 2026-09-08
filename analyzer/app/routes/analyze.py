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
from app.services.structure_analyzer import (
    analyze_repository_structure,
)
from app.services.framework_relationship_analyzer import (
    detect_framework_relationships,
)
from app.services.architecture_analyzer import (
    analyze_architecture,
)
from app.services.architecture_rules import (
    analyze_architecture_rules,
)
from app.services.cross_layer_graph import (
    build_cross_layer_graph,
)
from app.services.symbol_reference import (
    build_symbol_references,
)
from app.services.reverse_call_graph import (
    build_reverse_call_graph,
)
from app.services.impact_analyzer import (
    analyze_symbol_impact,
)

from app.services.symbol_index import build_symbol_index

from app.services.entry_point_analyzer import analyze_entry_points
from app.services.execution_flow import build_execution_flow
from app.services.call_graph import build_call_graph


router = APIRouter(prefix="/analyze", tags=["Analysis"])

class AnalyzeRequest(BaseModel):
    path: str

class ImpactRequest(BaseModel):
    path: str
    symbol: str
    
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
        
        repository_structure = analyze_repository_structure(
            results,
            str(Path(request.path).resolve()),
        )
        architecture_analysis = analyze_architecture(
            results,
            str(Path(request.path).resolve()),
        )
        architecture_rules = analyze_architecture_rules(
            results,
            str(Path(request.path).resolve()),
        )
        cross_layer_graph = build_cross_layer_graph(
            results,
            str(Path(request.path).resolve()),
        )
        symbol_index = build_symbol_index(results)
        symbol_references = build_symbol_references(
            results,
            symbol_index,
        )
        call_graph = build_call_graph(
            symbol_references,
        )
        reverse_call_graph = build_reverse_call_graph(
            call_graph,
        )
        entry_point_analysis = analyze_entry_points(
            results,
            str(Path(request.path).resolve()),
        )
        
        execution_flow = build_execution_flow(
            entry_point_analysis,
            graph,
        )
        
        framework_relationships = (
            detect_framework_relationships(
                results,
                str(Path(request.path).resolve()),
            )
        )

        quality_score = calculate_quality_score(
            repository_metrics,
            graph_analysis,
        )
        
        return {
            "path": str(Path(request.path).resolve()),
            "file_count": len(files),
            "files": results,
            "repository_metrics": repository_metrics,
            "repository_structure": repository_structure,
            "architecture_analysis": architecture_analysis,
            "architecture_rules": architecture_rules,
            "cross_layer_graph": cross_layer_graph,
            "entry_point_analysis": entry_point_analysis,
            "framework_relationships": framework_relationships,
            "execution_flow": execution_flow,
            "quality_score": quality_score,
            "dependency_graph": graph,
            "graph_analysis": graph_analysis,
            "symbol_index": symbol_index,
            "symbol_index": symbol_index,
            "symbol_references": symbol_references,
            "call_graph": call_graph,
            "reverse_call_graph": reverse_call_graph,
        }

    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error))

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    
    
@router.post("/impact")
def analyze_impact(request: ImpactRequest):
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

        symbol_index = build_symbol_index(results)

        symbol_references = build_symbol_references(
            results,
            symbol_index,
        )

        call_graph = build_call_graph(
            symbol_references,
        )

        reverse_call_graph = build_reverse_call_graph(
            call_graph,
        )

        impact = analyze_symbol_impact(
            request.symbol,
            reverse_call_graph,
        )

        return {
            "path": str(
                Path(request.path).resolve()
            ),
            "impact": impact,
        }

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )