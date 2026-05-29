import { useCallback, memo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  NodeProps,
  Position,
  MarkerType,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  User,
  MapPin,
  Link as LinkIcon,
  Lock,
  Image,
  Globe,
  Hash,
} from 'lucide-react';
import { GraphNode, GraphEdge } from '../types';
import { ENTITY_COLORS } from '../utils/mockData';

interface NodeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (node: GraphNode) => void;
}

const nodeIcons: Record<string, JSX.Element> = {
  seed: <Hash className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  social: <Globe className="w-5 h-5" />,
  person: <User className="w-5 h-5" />,
  location: <MapPin className="w-5 h-5" />,
  credential: <Lock className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
};

const CustomNode = memo(({ data, type }: NodeProps) => {
  const colors = ENTITY_COLORS[type || 'seed'];

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`relative px-4 py-3 rounded-xl ${colors.bg} ${colors.border} border backdrop-blur-xl cursor-pointer hover:scale-105 transition-transform shadow-lg ${colors.glow}`}
    >
      {/* Glow ring */}
      <div className={`absolute inset-0 rounded-xl ${colors.bg} opacity-50 blur-xl`} />

      <div className="relative flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${colors.bg}`}>
          <span className={colors.text}>{nodeIcons[type || 'seed']}</span>
        </div>
        <div className="max-w-[150px]">
          <p className="text-xs font-medium text-white truncate">{data.label as string}</p>
          {typeof data.confidence === 'number' && (
            <p className="text-[10px] text-slate-400">{(data.confidence * 100).toFixed(0)}% match</p>
          )}
        </div>
      </div>

      {/* Pulse effect for new nodes */}
      <motion.div
        className={`absolute inset-0 rounded-xl ${colors.border} border`}
        initial={{ scale: 1.2, opacity: 1 }}
        animate={{ scale: 1, opacity: 0 }}
        transition={{ duration: 1 }}
      />
    </motion.div>
  );
});

CustomNode.displayName = 'CustomNode';

const edgeTypes = {
  default: ({ data }: { data: { label: string; type: string } }) => (
    <div className="relative">
      <div
        className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-medium ${
          data.type === 'warning'
            ? 'bg-red-500/20 text-red-400 border border-red-500/50'
            : data.type === 'primary'
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
            : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
        } backdrop-blur-sm`}
      >
        {data.label}
      </div>
    </div>
  ),
};

export function NodeGraph({ nodes, edges, onNodeClick }: NodeGraphProps) {
  const initialNodes = nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: { x: Math.random() * 400 + 200, y: Math.random() * 400 + 100 },
    data: { label: node.label, ...node.data },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));

  const initialEdges = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'default',
    animated: edge.type === 'derived',
    style: {
      stroke: edge.type === 'warning' ? '#f87171' : edge.type === 'primary' ? '#00d4ff' : '#475569',
      strokeWidth: edge.type === 'primary' ? 2 : 1,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: edge.type === 'warning' ? '#f87171' : edge.type === 'primary' ? '#00d4ff' : '#475569',
    },
    data: { label: edge.label, type: edge.type },
  }));

  const [flowNodes, , onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClickHandler = useCallback(
    (_: React.MouseEvent, node: { id: string; data: Record<string, unknown> }) => {
      const graphNode = nodes.find((n) => n.id === node.id);
      if (graphNode) {
        onNodeClick(graphNode);
      }
    },
    [nodes, onNodeClick]
  );

  const nodeTypes = {
    seed: CustomNode,
    email: CustomNode,
    phone: CustomNode,
    social: CustomNode,
    person: CustomNode,
    location: CustomNode,
    credential: CustomNode,
    image: CustomNode,
  };

  return (
    <div className="h-full w-full bg-slate-950 rounded-xl overflow-hidden relative">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-slate-950"
      >
        <Background
          color="#334155"
          gap={24}
          size={1}
          className="bg-slate-950"
        />
        <Controls
          className="!bg-slate-900/80 !border-slate-700/50 !rounded-xl !shadow-xl backdrop-blur-xl"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Empty state overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-slate-950/20 to-transparent pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="p-4 rounded-full bg-slate-800/50 border border-slate-700/30 mb-4 mx-auto w-fit"
            >
              <LinkIcon className="w-8 h-8 text-slate-400" />
            </motion.div>
            <p className="text-slate-400 font-semibold">Entity Graph Workspace</p>
            <p className="text-slate-500 text-sm mt-1">Discovered entities will appear here</p>
            <p className="text-slate-600 text-xs mt-3">Initialize a scan to begin analysis</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
