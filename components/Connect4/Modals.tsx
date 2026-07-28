'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Player } from '@/lib/connect4-logic';
import { GameStats } from '@/hooks/use-connect4';
import { Trophy, RefreshCw, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';
import { cn, toArabicNumerals } from '@/lib/utils';
import type { TranslationStrings } from '@/lib/translations';

interface ModalsProps {
  winner: Player | 'draw' | null;
  show: boolean;
  onClose: () => void;
  onReset: () => void;
  stats: GameStats;
  isDarkMode?: boolean;
  t: TranslationStrings;
  language?: string;
}

export const GameModals = ({ winner, show, onClose, onReset, stats, isDarkMode, t, language }: ModalsProps) => {
  const isArabic = language === 'ar';
  const [shareFeedback, setShareFeedback] = useState('');

  useEffect(() => {
    if (show && winner && winner !== 'draw') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: winner === 1 ? ['#ef4444', '#f87171'] : ['#fbbf24', '#fcd34d']
      });
    }
  }, [show, winner]);

  const isDraw = winner === 'draw';
  const winnerName = winner === 1 ? t.red : t.yellow;
  const handleClose = () => {
    setShareFeedback('');
    onClose();
  };
  const handleReset = () => {
    setShareFeedback('');
    onReset();
  };

  return (
    <AnimatePresence>
      {show && winner && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            dir={isArabic ? 'rtl' : 'ltr'}
            className={cn(
              "rounded-[32px] p-6 sm:p-8 w-full max-w-sm shadow-2xl border text-center transition-colors duration-500 relative overflow-hidden",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
              <button type="button"
              onClick={handleClose}
              aria-label="Close dialog"
              className={cn(
                "absolute top-4 end-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="flex justify-center mb-6">
              <div className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner",
                isDarkMode ? "bg-zinc-950" : "bg-zinc-50"
              )}>
                {isDraw ? (
                  <RefreshCw size={40} className="text-zinc-400" />
                ) : (
                  <Trophy size={40} className={winner === 1 ? "text-red-500" : "text-yellow-500"} />
                )}
              </div>
            </div>

            <h2 className={cn(
              "text-3xl sm:text-4xl font-black tracking-tight mb-2",
              isDarkMode ? "text-white" : "text-zinc-900"
            )}>
              {isDraw ? t.draw : isArabic ? `${t.wins} ${winnerName}!` : `${winnerName} ${t.wins || 'Wins!'}`}
            </h2>
            <p className="text-zinc-500 font-medium mb-8">
              {isDraw ? t.drawSubtitle || "Well played by both sides." : t.winSubtitle || "An absolute masterclass in strategy."}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className={cn(
                "p-3 rounded-2xl border",
                isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-100"
              )}>
                <span className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">{t.red}</span>
                <span className={cn("text-lg font-black", isDarkMode ? "text-white" : "text-zinc-900")}>{toArabicNumerals(stats.redWins, isArabic)}</span>
              </div>
              <div className={cn(
                "p-3 rounded-2xl border",
                isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-100"
              )}>
                <span className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">{t.yellow}</span>
                <span className={cn("text-lg font-black", isDarkMode ? "text-white" : "text-zinc-900")}>{toArabicNumerals(stats.yellowWins, isArabic)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button type="button" data-testid="play-again"
                onClick={handleReset}
                className={cn(
                  "w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg",
                  isDarkMode ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
                )}
              >
                {t.playAgain || 'Play Again'}
              </button>
              <button type="button"
                onClick={() => {
                  const text = isDraw ? t.shareDraw || "We drew in Connect 4!" : `${t.shareWin || 'I won as'} ${winnerName} ${t.shareWinSuffix || 'in Connect 4!'}`;
                  if (navigator.share) {
                    navigator.share({ title: 'Connect 4 Result', text });
                    return;
                  }
                  navigator.clipboard?.writeText(text)
                    .then(() => setShareFeedback(t.copied || 'Result copied to clipboard!'))
                    .catch(() => setShareFeedback(text));
                }}
                className={cn(
                  "w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border",
                  isDarkMode ? "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800" : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                )}
              >
                <Share2 size={18} />
                {t.shareResult || 'Share Result'}
              </button>
              {shareFeedback && (
                <p className="text-xs font-medium text-zinc-500" aria-live="polite">
                  {shareFeedback}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
