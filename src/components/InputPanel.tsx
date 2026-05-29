import { useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  User,
  AtSign,
  Globe,
  Hash,
  Plus,
  X,
  Search,
  Loader2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { SeedInput, EntityType } from '../types';
import { ENTITY_COLORS } from '../utils/mockData';

interface InputPanelProps {
  seeds: SeedInput[];
  onAddSeed: (seed: Omit<SeedInput, 'id' | 'timestamp'>) => void;
  onRemoveSeed: (id: string) => void;
  onScan: () => void;
  isScanning: boolean;
}

const entityTypes: { value: EntityType; label: string; icon: JSX.Element }[] = [
  { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { value: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
  { value: 'username', label: 'Username', icon: <AtSign className="w-4 h-4" /> },
  { value: 'fullname', label: 'Full Name', icon: <User className="w-4 h-4" /> },
  { value: 'social', label: 'Social Handle', icon: <Hash className="w-4 h-4" /> },
  { value: 'domain', label: 'Domain', icon: <Globe className="w-4 h-4" /> },
];

export function InputPanel({ seeds, onAddSeed, onRemoveSeed, onScan, isScanning }: InputPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState<EntityType>('email');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddSeed({ value: inputValue.trim(), type: selectedType });
      setInputValue('');
    }
  };

  const selectedEntity = entityTypes.find(t => t.value === selectedType)!;
  const colors = ENTITY_COLORS[selectedType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-2xl"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 rounded-2xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Intelligence Seed Input</h2>
            <p className="text-sm text-slate-400">Enter target data points for OSINT analysis</p>
          </div>
        </div>

        {/* Input Row */}
        <div className="flex gap-2 mb-4">
          {/* Type Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${colors.bg} ${colors.border} border backdrop-blur-sm transition-all hover:scale-[1.02]`}
            >
              {selectedEntity.icon}
              <span className={`text-sm font-medium ${colors.text}`}>{selectedEntity.label}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 w-48 backdrop-blur-xl bg-slate-900/95 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  {entityTypes.map((type) => {
                    const typeColors = ENTITY_COLORS[type.value];
                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          setSelectedType(type.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-2.5 text-left hover:${typeColors.bg} transition-colors`}
                      >
                        <span className={typeColors.text}>{type.icon}</span>
                        <span className="text-sm text-slate-200">{type.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${selectedEntity.label.toLowerCase()}...`}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            {inputValue && (
              <button
                onClick={() => {
                  onAddSeed({ value: inputValue.trim(), type: selectedType });
                  setInputValue('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 transition-colors"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
              </button>
            )}
          </div>
        </div>

        {/* Seed Tags */}
        <AnimatePresence>
          {seeds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              {seeds.map((seed) => {
                const seedColors = ENTITY_COLORS[seed.type];
                return (
                  <motion.div
                    key={seed.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${seedColors.bg} ${seedColors.border} border shadow-lg ${seedColors.glow}`}
                  >
                    <span className={`text-sm font-medium ${seedColors.text}`}>{seed.value}</span>
                    <button
                      onClick={() => onRemoveSeed(seed.id)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <motion.button
          onClick={onScan}
          disabled={isScanning || seeds.length === 0}
          whileHover={!isScanning && seeds.length > 0 ? { scale: 1.02 } : {}}
          whileTap={!isScanning && seeds.length > 0 ? { scale: 0.98 } : {}}
          className={`relative w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 overflow-hidden transition-all ${
            seeds.length === 0
              ? 'bg-slate-700/50 cursor-not-allowed opacity-60'
              : isScanning
              ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 shadow-lg shadow-cyan-500/30'
              : 'bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 hover:from-cyan-400 hover:via-emerald-400 hover:to-cyan-400 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
          }`}
        >
          {isScanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Scan Active... Processing Intelligence</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Initialize Intelligence Scan</span>
            </>
          )}

          {isScanning && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </motion.button>

        {/* Helper Text */}
        {seeds.length === 0 && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs text-slate-500 mt-2"
          >
            Add at least one seed input to start
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
