import { api } from "./api";

export interface DashboardMetrics {
  files: number;
  functions: number;
  qualityScore: number;
  codeSmells: number;
}

export interface QualityScore {
  overall_score: number;
  components: {
    complexity: number;
    code_smells: number;
    maintainability: number;
    architecture: number;
  };
}

export interface ArchitectureAnalysis {
  total_layers: number;
  layer_counts: Record<string, number>;
  layers: Record<string, string[]>;
}

export interface RepositoryStructure {
  total_directories: number;
  total_files: number;
  roles: Record<string, number>;
}

export interface EntryPointAnalysis {
  total_entry_points: number;
  entry_points: Array<{
    file: string;
    type: string;
    reason: string;
  }>;
}

export interface CrossLayerGraph {
  total_layers: number;
  layers: string[];
  total_relationships: number;
  relationships: Array<{
    source_layer: string;
    target_layer: string;
    dependency_count: number;
    files: Array<{
      source: string;
      target: string;
    }>;
  }>;
}

export interface AnalysisOverview {
  repository: {
    name: string;
  };

  metrics: DashboardMetrics;

  analysis: {
    quality_score?: QualityScore;
    architecture_analysis?: ArchitectureAnalysis;
    repository_structure?: RepositoryStructure;
    entry_point_analysis?: EntryPointAnalysis;
    cross_layer_graph?: CrossLayerGraph;
    [key: string]: unknown;
  };
}

export async function getAnalysisOverview(): Promise<AnalysisOverview> {
  const response = await api.get<AnalysisOverview>(
    "/analysis/overview"
  );

  return response.data;
}