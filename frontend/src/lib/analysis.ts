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

export interface ArchitectureViolation {
  source: string;
  target: string;
  source_layer: string;
  target_layer: string;
  severity: string;
  type: string;
  message: string;
}

export interface ArchitectureDependency {
  source: string;
  target: string;
  source_layer: string;
  target_layer: string;
}

export interface ArchitectureRules {
  total_dependencies_checked: number;
  valid_dependencies: ArchitectureDependency[];
  violations: ArchitectureViolation[];
  total_violations: number;
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


export interface DependencyNode {
  id: string;
  label: string;
  type: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: string;
}

export interface DependencyFileMetric {
  file: string;
  fan_in: number;
  fan_out: number;
  dependency_count: number;
  dependent_count: number;
  total_connections: number;
  isolated: boolean;
  entry_point: boolean;
}

export interface DependencyAnalysis {
  summary: {
    total_files: number;
    internal_dependencies: number;
    external_dependencies: number;
    external_packages: number;
    unresolved_dependencies: number;
    isolated_files: number;
    entry_points: number;
    circular_dependencies: number;
    connected_files: number;
    connected_percentage: number;
  };

  files: DependencyFileMetric[];

  hotspots: Array<{
    file: string;
    fan_in: number;
    fan_out: number;
    total_connections: number;
  }>;

  most_depended_on: Array<{
    file: string;
    fan_in: number;
    fan_out: number;
    total_connections: number;
  }>;

  most_dependent_on: Array<{
    file: string;
    fan_in: number;
    fan_out: number;
    total_connections: number;
  }>;

  isolated_files: string[];

  entry_points: string[];

  cycles: string[][];

  external_dependencies: Array<{
    file: string;
    package: string;
  }>;

  external_packages: string[];

  unresolved_dependencies: Array<{
    file: string;
    source: string;
  }>;
}

export interface DependencyOverview {
  repository: {
    name: string;
  };

  graph: {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
  };

  dependency_analysis: DependencyAnalysis;
}

export interface RouteRecord {
  method: string;
  path: string;
  file: string;
  handler?: string | null;
  line?: number;
  type: string;
  route_type: "api" | "page";
  dynamic: boolean;

  handler_symbol?: {
    name: string;
    type?: string;
    start_line?: number;
    end_line?: number;
  } | null;
}

export interface RouteSummary {
  total_routes: number;
  api_routes: number;
  page_routes: number;
  dynamic_routes: number;
  express_routes: number;
  nextjs_routes: number;
  methods: Record<string, number>;
}

export interface RouteFlow {
  method: string;
  path: string;
  file: string;
  handler: string;
  type?: string;
  route_type?: string;
  dynamic?: boolean;
  calls: string[];
}

export interface RouteOverview {
  repository: {
    name: string;
  };

  summary: RouteSummary;

  routes: RouteRecord[];

  flows: RouteFlow[];
}

export interface CodeExplorerSymbol {
  name: string;
  type?: string;
  start_line?: number;
  end_line?: number;
}

export interface CodeExplorerDependency {
  source?: string;
  type?: string;
  resolved_file?: string | null;
}

export interface CodeExplorerReference {
  source_file: string;
  source_symbol: string;
  target_file: string;
  target_symbol: string;
  type: string;
  line: number;
}

export interface CodeExplorerAnalysis {
  summary: {
    total_files: number;
    total_symbols: number;
    total_references: number;
  };
  files: CodeExplorerFile[];
  symbol_index: Record<string, CodeExplorerSymbol[]>;
  references: CodeExplorerReference[];
}

export interface AnalysisOverview {
  repository: { name: string };
  metrics: DashboardMetrics;
  analysis: {
    quality_score?: QualityScore;
    architecture_analysis?: ArchitectureAnalysis;
    repository_structure?: RepositoryStructure;
    entry_point_analysis?: EntryPointAnalysis;
    cross_layer_graph?: CrossLayerGraph;
    code_explorer?: CodeExplorerAnalysis;
    [key: string]: unknown;
  };
}

export interface CodeExplorerFile {
  file: string;

  symbols: CodeExplorerSymbol[];

  dependencies: CodeExplorerDependency[];

  incoming_references: number;

  outgoing_references: number;

  intelligence?: {
    role: string;
    layer: string;
    entry_point: boolean;
    symbol_count: number;
    dependency_count: number;
  };
}

export interface ImpactSummary {
  target_file: string;
  target_symbol: string | null;
  direct_dependents: number;
  transitive_dependents: number;
  affected_files: number;
  affected_symbols: number;
  affected_routes: number;
  affected_flows: number;
}

export interface ImpactSymbol {
  file: string;
  symbol: string;
  target_symbol?: string;
  type?: string;
  start_line?: number;
  end_line?: number;
}

export interface ImpactRoute {
  method: string;
  path: string;
  file: string;
  handler?: string | null;
  type?: string;
  route_type?: string;
  dynamic?: boolean;
  impact: "direct" | "transitive";
}

export interface ImpactFlow {
  method: string;
  path: string;
  file: string;
  handler: string;
  calls: string[];
}

export interface ImpactAnalysis {
  path: string;

  impact: {
    symbol: string;

    summary: {
      direct_dependents: number;
      transitive_dependents: number;
      total_affected: number;
    };

    direct_impact: ImpactSymbol[];

    transitive_impact: ImpactSymbol[];

    affected_symbols: ImpactSymbol[];

    // Keep these optional for the richer
    // Impact Analyzer response we will add next.
    affected_files?: string[];

    affected_routes?: ImpactRoute[];

    affected_flows?: ImpactFlow[];
  };
}

export async function getImpactAnalysis(
  symbol: string
): Promise<ImpactAnalysis> {
  const response =
    await api.post<ImpactAnalysis>(
      "/impact/analyze",
      {
        symbol,
      }
    );

  return response.data;
}

export async function getCodeExplorer(): Promise<CodeExplorerAnalysis> {
  const response = await api.get<AnalysisOverview>(
    "/analysis/overview"
  );

  return response.data.analysis.code_explorer ?? {
    summary: {
      total_files: 0,
      total_symbols: 0,
      total_references: 0,
    },
    files: [],
    symbol_index: {},
    references: [],
  };
}
export async function getAnalysisOverview(): Promise<AnalysisOverview> {
  const response = await api.get<AnalysisOverview>(
    "/analysis/overview"
  );

  return response.data;
}

export async function getDependencyOverview(): Promise<DependencyOverview> {
  const response = await api.get<DependencyOverview>(
    "/dependencies/overview"
  );

  return response.data;
}

export async function getRouteOverview(): Promise<RouteOverview> {
  const response =
    await api.get<RouteOverview>(
      "/routes/overview"
    );

  return response.data;
}