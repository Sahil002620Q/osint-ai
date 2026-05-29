import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Zap,
} from 'lucide-react';
import { TaskStatus } from '../types';

interface TaskStatusLogProps {
  tasks: TaskStatus[];
}

export function TaskStatusLog({ tasks }: TaskStatusLogProps) {
  const getStatusIcon = (status: TaskStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: TaskStatus['status']) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500/50 bg-emerald-500/10';
      case 'running':
        return 'border-cyan-500/50 bg-cyan-500/10';
      case 'failed':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-slate-700/50 bg-slate-800/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full backdrop-blur-xl bg-slate-900/60 border-r border-slate-700/50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Scraping Modules</h3>
            <p className="text-xs text-slate-400">Real-time task status</p>
          </div>
        </div>

        {/* Active Count */}
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-slate-300">
            {tasks.filter(t => t.status === 'running').length} Active Modules
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        <AnimatePresence>
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-3 rounded-xl border backdrop-blur-sm transition-all overflow-hidden ${getStatusColor(task.status)}`}
              >
                {/* Scanning line animation for running tasks */}
                {task.status === 'running' && (
                  <motion.div
                    className="absolute left-0 top-0 w-1 bg-gradient-to-b from-cyan-400 to-transparent"
                    animate={{ y: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ height: '100%' }}
                  />
                )}

                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">{getStatusIcon(task.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{task.module}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{task.message}</p>

                    {/* Progress bar */}
                    {task.progress > 0 && (
                      <div className="mt-2 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            task.status === 'completed'
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                              : task.status === 'running'
                              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                              : 'bg-slate-600/50'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}

                    {/* Progress text */}
                    <p className="text-[9px] text-slate-500 mt-1">{task.progress}%</p>
                  </div>
                </div>

                {/* Pulse effect for running tasks */}
                {task.status === 'running' && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border border-cyan-500/50"
                    animate={{ opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="p-3 rounded-full bg-slate-800/50 border border-slate-700/30 mb-3">
                <Activity className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-500">No active scans</p>
              <p className="text-xs text-slate-600 mt-1">Initialize scan to begin analysis</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
