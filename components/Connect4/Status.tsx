'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { Player } from '@/lib/connect4-logic';
import type { FunMode } from '@/lib/connect4-logic';
import type { VariantState } from '@/hooks/use-connect4';
import { cn, toArabicNumerals } from '@/lib/utils';
import type { TranslationStrings } from '@/lib/translations';

interface StatusProps {
  currentPlayer: Player;
  gameActive: boolean;
  isAiThinking: boolean;
  timers: { 1: number; 2: number };
  timerDuration: number;
  funMode?: FunMode;
  variant?: VariantState;
  theme: { red: string; yellow: string };
  isDarkMode?: boolean;
  t: TranslationStrings;
  language?: string;
}

const GameStatusComponent = ({ 
  currentPlayer, 
  gameActive, 
  isAiThinking, 
  timers, 
  timerDuration,
  funMode = 'classic',
  variant,
  theme,
  isDarkMode,
  t,
  language
}: StatusProps) => {
  const isArabic = language === 'ar';
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    return toArabicNumerals(timeStr, isArabic);
  };

  const isRed = currentPlayer === 1;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className={cn(
        "flex items-center justify-between backdrop-blur-md border p-3 rounded-2xl shadow-sm transition-colors duration-500",
        isDarkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-200"
      )}>
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ 
              scale: gameActive ? [1, 1.1, 1] : 1,
              opacity: gameActive ? 1 : 0.5
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ backgroundColor: isRed ? theme.red : theme.yellow }}
            className="w-3 h-3 rounded-full shadow-sm"
          />
          <div className="flex flex-col">
            <span className={cn(
              "text-[11px] font-bold uppercase tracking-wider",
              isDarkMode ? "text-zinc-500" : "text-zinc-600"
            )}>
              {t.mode}
            </span>
            <span className={cn(
              "text-sm font-bold",
              isDarkMode ? "text-white" : "text-zinc-900"
            )}>
              {isAiThinking ? (
                <span className="flex items-center gap-1">
                  {t.aiDifficulty}...
                  <span className="flex gap-0.5">
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className={cn("w-1 h-1 rounded-full", isDarkMode ? "bg-zinc-600" : "bg-zinc-400")} />
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className={cn("w-1 h-1 rounded-full", isDarkMode ? "bg-zinc-600" : "bg-zinc-400")} />
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className={cn("w-1 h-1 rounded-full", isDarkMode ? "bg-zinc-600" : "bg-zinc-400")} />
                  </span>
                </span>
              ) : (
                `${isRed ? t.red : t.yellow}`
              )}
            </span>
          </div>
        </div>

        {timerDuration > 0 && (
          <div className="flex gap-2">
            <div className={cn(
              "flex flex-col items-center px-3 py-1 rounded-xl transition-colors",
              isRed && gameActive 
                ? (isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200") 
                : (isDarkMode ? "bg-zinc-950 border-zinc-900" : "bg-zinc-50 border-zinc-100")
            )}>
              <span className={cn(
                "text-[11px] font-bold uppercase",
                isDarkMode ? "text-zinc-500" : "text-zinc-600"
              )}>{t.red}</span>
              <span className={cn(
                "font-mono text-sm font-bold",
                isRed && timers[1] <= 10 ? "text-red-500 animate-pulse" : (isDarkMode ? "text-zinc-300" : "text-zinc-900")
              )} style={{ color: isRed && gameActive ? theme.red : undefined }}>
                {formatTime(timers[1])}
              </span>
            </div>
            <div className={cn(
              "flex flex-col items-center px-3 py-1 rounded-xl transition-colors",
              !isRed && gameActive 
                ? (isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200") 
                : (isDarkMode ? "bg-zinc-950 border-zinc-900" : "bg-zinc-50 border-zinc-100")
            )}>
              <span className={cn(
                "text-[11px] font-bold uppercase",
                isDarkMode ? "text-zinc-500" : "text-zinc-600"
              )}>{t.yellow}</span>
              <span className={cn(
                "font-mono text-sm font-bold",
                !isRed && timers[2] <= 10 ? "text-red-500 animate-pulse" : (isDarkMode ? "text-zinc-300" : "text-zinc-900")
              )} style={{ color: !isRed && gameActive ? theme.yellow : undefined }}>
                {formatTime(timers[2])}
              </span>
            </div>
          </div>
        )}
      </div>
      {funMode !== 'classic' && variant && (
        <div className={cn(
          "flex items-center justify-between border px-3 py-2 rounded-2xl text-xs font-black uppercase",
          isDarkMode ? "bg-zinc-900/70 border-zinc-800 text-zinc-300" : "bg-white/70 border-zinc-200 text-zinc-700"
        )}>
          <span>{t[funMode as keyof typeof t] || funMode}</span>
          <span>
            {funMode === 'gravity' && `${t.gravityDirection || 'Gravity'}: ${t[variant.gravityDirection as keyof typeof t] || variant.gravityDirection}`}
            {funMode === 'wildColumn' && `${t.wildColumnLabel || 'Wild Spots'} ${toArabicNumerals(variant.wildCells.length, isArabic)}`}
            {funMode === 'risingFloor' && `${t.floorRisesIn || 'Floor rises in'} ${toArabicNumerals(5 - variant.risingTurnCount, isArabic)}`}
            {funMode === 'connect5' && `${t.dropProgress || 'Drop'} ${toArabicNumerals(3 - variant.pendingDrops, isArabic)}/2`}
            {funMode === 'bomb' && `${t.bombAction || 'Bomb'} ${toArabicNumerals(variant.bombs[currentPlayer === 2 ? 2 : 1], isArabic)}`}
            {funMode === 'powerup' && `${t.usePower || 'Power'}: ${t[variant.powerSelections[currentPlayer === 2 ? 2 : 1] as keyof typeof t] || variant.powerSelections[currentPlayer === 2 ? 2 : 1]}`}
            {funMode === 'popout' && (t.popOutAction || 'Pop Out')}
          </span>
        </div>
      )}
    </div>
  );
};

export const GameStatus = memo(GameStatusComponent);
