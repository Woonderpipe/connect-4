'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Move } from '@/hooks/use-connect4';
import { X, ChevronRight } from 'lucide-react';
import { cn, toArabicNumerals } from '@/lib/utils';
import type { TranslationStrings } from '@/lib/translations';

interface HistoryProps {
  history: Move[];
  onClose: () => void;
  onJump: (index: number) => void;
  theme: { red: string; yellow: string };
  isDarkMode?: boolean;
  t: TranslationStrings;
  language?: string;
}

export const MoveHistory = ({ history, onClose, onJump, theme, isDarkMode, t, language }: HistoryProps) => {
  const isArabic = language === 'ar';
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn(
        "fixed inset-y-0 right-0 w-full max-w-xs shadow-2xl z-50 flex flex-col border-l transition-colors duration-500",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}
    >
      <div className={cn(
        "p-6 border-b flex items-center justify-between",
        isDarkMode ? "border-zinc-800" : "border-zinc-100"
      )}>
        <h3 className={cn(
          "text-xl font-black",
          isDarkMode ? "text-white" : "text-zinc-900"
        )}>{t.history}</h3>
        <button 
          onClick={onClose}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full transition-all",
            isDarkMode ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          )}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              isDarkMode ? "bg-zinc-800" : "bg-zinc-50"
            )}>
              <X size={24} />
            </div>
            <p className="text-sm font-medium">{t.noMoves || 'No moves yet'}</p>
          </div>
        ) : (
          history.map((move, i) => (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={cn(
                "w-full group flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                isDarkMode 
                  ? "bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700" 
                  : "bg-zinc-50 border-zinc-100 hover:bg-white hover:border-zinc-300"
              )}
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-zinc-300 w-4">
                  {toArabicNumerals(i + 1, isArabic)}
                </span>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-sm font-bold flex items-center gap-2",
                    isDarkMode ? "text-white" : "text-zinc-900"
                  )}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: move.player === 1 ? theme.red : theme.yellow }} />
                    {move.player === 1 ? t.red : t.yellow}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">
                    {move.label ? `${t[move.label as keyof typeof t] || move.label} • ` : ''}
                    {t.col || 'Col'} {toArabicNumerals(move.col + 1, isArabic)}, {t.row || 'Row'} {toArabicNumerals(move.row + 1, isArabic)}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
            </button>
          ))
        )}
      </div>

      <div className={cn(
        "p-6 border-t",
        isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-100"
      )}>
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-center">
          {t.historyInstruction || 'Click a move to jump back'}
        </p>
      </div>
    </motion.div>
  );
};
