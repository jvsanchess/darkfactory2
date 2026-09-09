export type ContentItem = {
  id: number;
  title: string;
  format: string;
  duration: string;
  status: "Aguardando aprovação" | "Em edição" | "Aprovado" | "Publicado";
  stage: string;
  score: number;
  source: string;
  updated: string;
  approved_at?: string | null;
};

export type Metric = {
  label: string;
  value: string;
  note: string;
};

export type PipelineStage = {
  name: string;
  value: number;
  color: string;
};

export type ServiceStatus = {
  name: string;
  detail: string;
  state: "Online" | "Processando" | "Offline";
};

export type DashboardSnapshot = {
  metrics: Metric[];
  stages: PipelineStage[];
  contents: ContentItem[];
  services: ServiceStatus[];
  render: {
    filename: string;
    progress: number;
  };
};

export type ApiMode = "connected" | "demo" | "offline";

function getApiBaseUrl(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  // Local desktop installs must still reach Docker when the bundler does not
  // expose NEXT_PUBLIC_API_URL. Never redirect a hosted site to a visitor's PC.
  if (typeof window !== "undefined" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) {
    return "http://localhost:8000/api/v1";
  }
  return undefined;
}

export const demoDashboard: DashboardSnapshot = {
  metrics: [
    { label: "No pipeline", value: "15", note: "+4 hoje" },
    { label: "Para aprovar", value: "03", note: "Requer atenção" },
    { label: "Publicados hoje", value: "02", note: "Próximo às 19:30" },
    { label: "Serviços online", value: "71%", note: "API não hospedada" },
  ],
  stages: [
    { name: "Pauta", value: 3, color: "violet" },
    { name: "Pesquisa", value: 2, color: "blue" },
    { name: "Roteiro", value: 2, color: "cyan" },
    { name: "Mídia", value: 1, color: "amber" },
    { name: "Narração", value: 1, color: "orange" },
    { name: "Edição", value: 2, color: "pink" },
    { name: "Revisão", value: 3, color: "red" },
    { name: "Publicação", value: 1, color: "green" },
  ],
  contents: [
    {
      id: 1,
      title: "O lance de Neymar que dividiu a internet",
      format: "Shorts · Futebol",
      duration: "00:47",
      status: "Aguardando aprovação",
      stage: "Revisão final",
      score: 92,
      source: "YouTube + notícias",
      updated: "há 8 min",
    },
    {
      id: 2,
      title: "Abel Ferreira e a decisão mais comentada da rodada",
      format: "Shorts · Futebol",
      duration: "00:54",
      status: "Aguardando aprovação",
      stage: "Revisão final",
      score: 87,
      source: "YouTube",
      updated: "há 21 min",
    },
    {
      id: 3,
      title: "A virada improvável que mudou o campeonato",
      format: "Shorts · História",
      duration: "00:42",
      status: "Em edição",
      stage: "Legendas e cortes",
      score: 81,
      source: "TVMaze + mídia livre",
      updated: "há 34 min",
    },
  ],
  services: [
    { name: "PostgreSQL", detail: "Aguardando backend", state: "Offline" },
    { name: "Redis / Celery", detail: "Aguardando backend", state: "Offline" },
    { name: "YouTube Data", detail: "Coleta de tendências", state: "Online" },
    { name: "TMDb", detail: "Metadados e referências", state: "Online" },
    { name: "TVMaze", detail: "Catálogo de séries", state: "Online" },
    { name: "FFmpeg", detail: "Renderização local", state: "Processando" },
    { name: "ElevenLabs", detail: "Narração", state: "Online" },
  ],
  render: { filename: "virada_improvavel_v3.mp4", progress: 68 },
};

export async function loadDashboard(): Promise<{
  snapshot: DashboardSnapshot;
  mode: ApiMode;
}> {
  const API_BASE_URL = getApiBaseUrl();
  if (!API_BASE_URL) {
    return { snapshot: demoDashboard, mode: "demo" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Dashboard request failed: ${response.status}`);
    return { snapshot: await response.json(), mode: "connected" };
  } catch {
    return { snapshot: demoDashboard, mode: "offline" };
  }
}

export async function approveRemoteContent(contentId: number): Promise<ContentItem | null> {
  const API_BASE_URL = getApiBaseUrl();
  if (!API_BASE_URL) return null;

  const response = await fetch(`${API_BASE_URL}/contents/${contentId}/approve`, {
    method: "PATCH",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Approval request failed: ${response.status}`);
  return response.json();
}
