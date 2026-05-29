import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Shield, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { GraphNode } from '../types';
import { ENTITY_COLORS } from '../utils/mockData';

interface NodeInspectionPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

export function NodeInspectionPanel({ node, onClose }: NodeInspectionPanelProps) {
  if (!node) return null;

  const colors = ENTITY_COLORS[node.type];

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="absolute right-0 top-0 bottom-0 w-80 backdrop-blur-xl bg-slate-900/90 border-l border-slate-700/50 shadow-2xl z-20"
        >
          {/* Header */}
          <div className={`p-4 border-b border-slate-700/50 ${colors.bg}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                  <Info className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${colors.text}`}>{node.type.toUpperCase()}</p>
                  <p className="text-xs text-slate-400">Entity Details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Primary Label */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
              <p className="text-xs text-slate-400 mb-1">Primary Identifier</p>
              <p className="text-white font-medium">{node.label}</p>
            </div>

            {/* Confidence Score */}
            {node.confidence && (
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <p className="text-xs text-slate-400 mb-2">Confidence Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${node.confidence * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    {(node.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            {/* Data Attributes */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Attributes</p>
              {Object.entries(node.data).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/30 border border-slate-800/50"
                >
                  <span className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-slate-200">
                    {typeof value === 'boolean' ? (
                      value ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 text-slate-500" />
                      )
                    ) : typeof value === 'number' ? (
                      value.toLocaleString()
                    ) : (
                      String(value)
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Security Indicator */}
            {node.type === 'credential' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-red-400 font-medium">Compromised Credential</p>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  This credential was found in a data breach. Review security recommendations.
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Actions</p>
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:bg-slate-700/50 transition-colors text-left">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300">Open External Reference</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:bg-slate-700/50 transition-colors text-left">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300">Request Data Removal</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
