export interface Site {
  id: string;
  name: string;
  url: string;
  location: string;
  status: "online" | "offline";
  latency: number | null;
}

export interface monitoring_stream {
  id: string;
  name: string;
  url: string;
  status: "online" | "offline";
  thumbnail?: string;
}

export interface FreshserviceAnalytics {
  mock: boolean;
  summary: {
    open: number;
    pending: number;
    resolved: number;
    closed: number;
    overdue: number;
    avg_response_time: string;
  };
  agents: AgentPerformance[];
  trends: {
    name: string;
    tickets: number;
  }[];
}

export interface AgentPerformance {
  id: string;
  name: string;
  resolved: number;
  open: number;
  avatar: string;
}
