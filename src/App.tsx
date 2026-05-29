import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { InputPanel } from './components/InputPanel';
import { TaskStatusLog } from './components/TaskStatusLog';
import { NodeGraph } from './components/NodeGraph';
import { NodeInspectionPanel } from './components/NodeInspectionPanel';
import { IntelligenceDossier } from './components/IntelligenceDossier';
import { SeedInput, TaskStatus, GraphNode, GraphEdge, TargetProfile } from './types';
import { scanStore } from './services/scanStore';
import { generateId } from './utils/mockData';

function App() {
  // State
  const [seeds, setSeeds] = useState<SeedInput[]>([
    { id: generateId(), value: 'john.smith@gmail.com', type: 'email', timestamp: new Date() },
    { id: generateId(), value: '@johnsmith_official', type: 'social', timestamp: new Date() },
  ]);
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [profile, setProfile] = useState<TargetProfile | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [inputPanelCollapsed, setInputPanelCollapsed] = useState(false);

  // Handlers
  const handleAddSeed = useCallback((seed: Omit<SeedInput, 'id' | 'timestamp'>) => {
    const newSeed: SeedInput = {
      ...seed,
      id: generateId(),
      timestamp: new Date(),
    };
    setSeeds((prev) => [...prev, newSeed]);
  }, []);

  const handleRemoveSeed = useCallback((id: string) => {
    setSeeds((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleScan = useCallback(async () => {
    if (isScanning || seeds.length === 0) return;

    setIsScanning(true);
    setShowDossier(false);
    setTasks([]);
    setGraphNodes([]);
    setGraphEdges([]);

    try {
      // Try to initialize scan via backend, falls back to demo if unavailable
      const scanId = await scanStore.initializeScan(seeds);

      // Subscribe to scan state updates
      const unsubscribe = scanStore.subscribe((state) => {
        setTasks(state.tasks);
        setGraphNodes(state.nodes);
        setGraphEdges(state.edges);
        setProfile(state.profile);

        if (state.status === 'completed') {
          setShowDossier(true);
          setIsScanning(false);
        } else if (state.status === 'failed') {
          setIsScanning(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Scan initialization failed, using demo mode:', error);
      setIsScanning(false);
    }
  }, [isScanning, seeds]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  // Close inspection panel when clicking outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                OSINT Orchestration Engine
              </h1>
              <p className="text-xs text-slate-500">Advanced Multi-Input Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <span className="text-xs text-slate-400">Build </span>
              <span className="text-xs text-cyan-400 font-medium">v2.4.1</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Task Sidebar */}
        <aside className="w-72 relative z-10">
          <TaskStatusLog tasks={tasks} />
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 relative z-10 p-4 flex flex-col overflow-hidden">
          {/* Input Panel */}
          <div className="mb-4">
            <AnimatePresence>
              {!inputPanelCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <InputPanel
                    seeds={seeds}
                    onAddSeed={handleAddSeed}
                    onRemoveSeed={handleRemoveSeed}
                    onScan={handleScan}
                    isScanning={isScanning}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapse Toggle */}
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setInputPanelCollapsed(!inputPanelCollapsed)}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors text-xs text-slate-400"
              >
                {inputPanelCollapsed ? (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show Input Panel
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide Input Panel
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Graph Workspace */}
          <div className="flex-1 relative overflow-hidden">
            <motion.div
              className={`h-full transition-all duration-500 ${
                showDossier ? 'mr-96' : ''
              }`}
            >
              <NodeGraph nodes={graphNodes} edges={graphEdges} onNodeClick={handleNodeClick} />
            </motion.div>

            {/* Node Inspection Panel */}
            <NodeInspectionPanel node={selectedNode} onClose={() => setSelectedNode(null)} />

            {/* Intelligence Dossier */}
            <div
              className={`absolute right-0 top-0 bottom-0 w-96 transition-all duration-500 ${
                showDossier ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <IntelligenceDossier profile={profile} isVisible={showDossier} />
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-2 border-t border-slate-800/50 backdrop-blur-xl bg-slate-900/60">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>{seeds.length} Seeds Active</span>
            <span>|</span>
            <span>{graphNodes.length} Entities Discovered</span>
            <span>|</span>
            <span>{graphEdges.length} Relationships Mapped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{isScanning ? 'Scan Active' : 'Ready'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
