const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;

export interface ScanInitRequest {
  seeds: Array<{
    value: string;
    entity_type: 'email' | 'phone' | 'username' | 'fullname' | 'social' | 'domain' | 'ip';
  }>;
  metadata?: Record<string, unknown>;
}

export interface ScanInitResponse {
  scan_id: string;
  status: string;
  message: string;
}

export interface ScanStatus {
  scan_id: string;
  status: string;
  progress: number;
  tasks_completed: number;
  total_tasks: number;
  nodes_discovered: number;
  edges_discovered: number;
  profile_ready: boolean;
}

export interface GraphNode {
  id: string;
  node_type: string;
  label: string;
  attributes: Record<string, unknown>;
  confidence: number;
}

export interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  metadata: Record<string, unknown>;
}

export interface TaskLog {
  id: string;
  module_name: string;
  status: string;
  message: string | null;
  progress: number;
  created_at: string;
}

export interface TargetProfile {
  id: string;
  primary_name: string | null;
  aliases: string[];
  emails: string[];
  phones: string[];
  social_profiles: Array<Record<string, unknown>>;
  locations: Array<Record<string, unknown>>;
  credentials: Array<Record<string, unknown>>;
  images: Array<Record<string, unknown>>;
  demographics: Record<string, unknown>;
  confidence_score: number;
}

export interface ScanResults {
  scan_id: string;
  status: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  tasks: TaskLog[];
  profile: TargetProfile | null;
  created_at: string;
}

class OSINTApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  async initializeScan(request: ScanInitRequest): Promise<ScanInitResponse> {
    const response = await fetch(`${this.baseUrl}/scan/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize scan: ${response.statusText}`);
    }

    return response.json();
  }

  async getScanStatus(scanId: string): Promise<ScanStatus> {
    const response = await fetch(`${this.baseUrl}/scan/${scanId}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get scan status: ${response.statusText}`);
    }

    return response.json();
  }

  async getScanResults(scanId: string): Promise<ScanResults> {
    const response = await fetch(`${this.baseUrl}/scan/results/${scanId}`);

    if (!response.ok) {
      throw new Error(`Failed to get scan results: ${response.statusText}`);
    }

    return response.json();
  }

  connectWebSocket(scanId: string, handlers: {
    onMessage?: (data: unknown) => void;
    onError?: (error: Error) => void;
    onClose?: () => void;
  }): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/api/v1/scan/stream/${scanId}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected to', wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handlers.onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message', error);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        const error = new Error(`WebSocket error on ${wsUrl}`);
        handlers.onError?.(error);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        handlers.onClose?.();
      };

      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      const err = new Error(`Failed to connect to WebSocket: ${error}`);
      handlers.onError?.(err);
      throw err;
    }
  }
}

export const apiClient = new OSINTApiClient();
