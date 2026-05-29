import { SeedInput, TaskStatus, GraphNode, GraphEdge, TargetProfile } from '../types';
import { apiClient, ScanInitRequest } from './api';

export interface ScanState {
  scanId: string | null;
  status: 'idle' | 'initializing' | 'processing' | 'completed' | 'failed';
  seeds: SeedInput[];
  tasks: TaskStatus[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  profile: TargetProfile | null;
  error: string | null;
  progress: number;
  ws: WebSocket | null;
}

const initialState: ScanState = {
  scanId: null,
  status: 'idle',
  seeds: [],
  tasks: [],
  nodes: [],
  edges: [],
  profile: null,
  error: null,
  progress: 0,
  ws: null,
};

class ScanStore {
  private state: ScanState = { ...initialState };
  private listeners: Set<(state: ScanState) => void> = new Set();

  subscribe(listener: (state: ScanState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): ScanState {
    return { ...this.state };
  }

  private setState(updates: Partial<ScanState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  async initializeScan(seeds: SeedInput[]) {
    try {
      this.setState({ status: 'initializing', seeds, error: null });

      const request: ScanInitRequest = {
        seeds: seeds.map(s => ({
          value: s.value,
          entity_type: s.type,
        })),
      };

      try {
        const response = await apiClient.initializeScan(request);
        const scanId = response.scan_id;

        this.setState({
          scanId,
          status: 'processing',
          tasks: [],
          nodes: [],
          edges: [],
          profile: null,
        });

        // Connect WebSocket for real-time updates
        this.connectWebSocket(scanId);

        // Poll for status updates
        this.startStatusPolling(scanId);

        return scanId;
      } catch (apiError) {
        console.warn('Backend API failed, using demo mode:', apiError);
        // Fall back to demo mode
        return this.initializeDemoScan(seeds);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize scan';
      this.setState({ status: 'failed', error: errorMessage });
      throw error;
    }
  }

  private initializeDemoScan(seeds: SeedInput[]): string {
    const scanId = `demo-${Math.random().toString(36).substring(7)}`;

    this.setState({
      scanId,
      status: 'processing',
      seeds,
      tasks: [],
      nodes: [],
      edges: [],
      profile: null,
    });

    // Simulate task execution with demo data
    const modules = [
      'Email Breach Aggregator',
      'Phone Number OSINT Lookup',
      'Social Username Enumerator',
      'Breach Database Querier',
      'Facial Recognition Matcher',
      'Domain WHOIS Analyzer',
      'Public Records Crawler',
      'Cross-Reference Correlator',
    ];

    let taskIndex = 0;
    const interval = setInterval(() => {
      if (taskIndex >= modules.length) {
        clearInterval(interval);
        this.completeDemoScan();
        return;
      }

      const module = modules[taskIndex];
      const task: TaskStatus = {
        id: `task-${taskIndex}`,
        module,
        status: 'completed',
        message: 'Completed',
        progress: 100,
        timestamp: new Date(),
      };

      this.setState(state => ({
        tasks: [...state.tasks.filter(t => t.module !== module), task],
      }));

      taskIndex++;
    }, 800);

    return scanId;
  }

  private completeDemoScan() {
    const demoProfile = {
      id: 'demo-profile',
      primaryName: 'John Smith',
      aliases: ['J. Smith', 'John D. Smith'],
      emails: ['john@example.com', 'john.smith@work.com'],
      phones: ['+1-555-123-4567'],
      social_profiles: [
        { platform: 'Instagram', username: 'johnsmith_official', url: 'https://instagram.com/johnsmith_official', followers: 12500 },
        { platform: 'Twitter', username: 'jsmith2024', url: 'https://twitter.com/jsmith2024', followers: 3400 },
      ],
      locations: [
        { city: 'San Francisco', country: 'USA', coordinates: { lat: 37.7749, lng: -122.4194 }, type: 'current', confidence: 0.92 },
      ],
      credentials: [
        { email: 'john@example.com', password: '***', breach: 'LinkedIn 2021', date: '2021-06-22' },
      ],
      images: [
        { url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150', source: 'Instagram', confidence: 0.94, isPrimary: true },
      ],
      demographics: {
        age: 34,
        gender: 'Male',
        nationality: 'American',
        occupation: 'Software Engineer',
        education: 'BS Computer Science',
      },
      confidence_score: 0.85,
    };

    const demoNodes: GraphNode[] = [
      { id: 'n1', type: 'email', label: 'john@example.com', data: { verified: true }, confidence: 0.95 },
      { id: 'n2', type: 'person', label: 'John Smith', data: { age: 34 }, confidence: 0.9 },
      { id: 'n3', type: 'social', label: '@johnsmith_official', data: { platform: 'Instagram', followers: 12500 }, confidence: 0.88 },
      { id: 'n4', type: 'location', label: 'San Francisco, CA', data: { type: 'current' }, confidence: 0.92 },
      { id: 'n5', type: 'credential', label: 'LinkedIn 2021', data: { breach: 'LinkedIn' }, confidence: 1.0 },
    ];

    const demoEdges: GraphEdge[] = [
      { id: 'e1', source: 'n1', target: 'n2', label: 'REGISTERED_TO', type: 'relation' },
      { id: 'e2', source: 'n1', target: 'n3', label: 'LINKED_TO', type: 'relation' },
      { id: 'e3', source: 'n2', target: 'n4', label: 'RESIDES_IN', type: 'primary' },
      { id: 'e4', source: 'n1', target: 'n5', label: 'COMPROMISED_IN', type: 'warning' },
    ];

    this.setState({
      status: 'completed',
      nodes: demoNodes,
      edges: demoEdges,
      profile: demoProfile,
    });
  }

  private connectWebSocket(scanId: string) {
    const ws = apiClient.connectWebSocket(scanId, {
      onMessage: (data: unknown) => this.handleWebSocketMessage(data),
      onError: (error: Error) => this.setState({ error: error.message }),
      onClose: () => this.setState({ ws: null }),
    });

    this.setState({ ws });
  }

  private handleWebSocketMessage(data: unknown) {
    const message = data as Record<string, unknown>;
    const type = message.type as string;

    switch (type) {
      case 'task_log': {
        const task = message as TaskStatus;
        this.updateTaskLog(task);
        break;
      }
      case 'node_discovered': {
        const node = (message as { node: GraphNode }).node;
        this.addNode(node);
        break;
      }
      case 'edge_discovered': {
        const edge = (message as { edge: GraphEdge }).edge;
        this.addEdge(edge);
        break;
      }
      case 'profile_updated': {
        const profile = (message as { profile: TargetProfile }).profile;
        this.setState({ profile });
        break;
      }
    }
  }

  private updateTaskLog(task: TaskStatus) {
    const tasks = this.state.tasks.map(t =>
      t.id === task.id ? task : t
    );

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completedCount / tasks.length) * 100) || 0;

    // Add task if it doesn't exist
    if (!this.state.tasks.find(t => t.id === task.id)) {
      tasks.push(task);
    }

    this.setState({ tasks, progress });
  }

  private addNode(node: GraphNode) {
    if (!this.state.nodes.find(n => n.id === node.id)) {
      this.setState({
        nodes: [...this.state.nodes, node],
      });
    }
  }

  private addEdge(edge: GraphEdge) {
    if (!this.state.edges.find(e => e.id === edge.id)) {
      this.setState({
        edges: [...this.state.edges, edge],
      });
    }
  }

  private startStatusPolling(scanId: string) {
    const interval = setInterval(async () => {
      try {
        const status = await apiClient.getScanStatus(scanId);

        this.setState({
          progress: status.progress,
          status: status.profile_ready ? 'completed' : 'processing',
        });

        if (status.profile_ready) {
          clearInterval(interval);
          const results = await apiClient.getScanResults(scanId);
          this.setState({
            profile: results.profile,
            nodes: results.nodes,
            edges: results.edges,
            tasks: results.tasks,
            status: 'completed',
          });
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 1000);

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  }

  reset() {
    if (this.state.ws) {
      this.state.ws.close();
    }
    this.setState(initialState);
  }
}

export const scanStore = new ScanStore();
