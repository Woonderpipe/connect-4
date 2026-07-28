'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useConnect4 } from '@/hooks/use-connect4';
import { GameBoard } from './Board';
import { GameStatus } from './Status';
import { GameControls } from './Controls';
import { GameModals } from './Modals';
import { MoveHistory } from './MoveHistory';
import { SeoSection } from './SeoSection';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from 'next-themes';
import { cn, toArabicNumerals } from '@/lib/utils';
import type { FunMode } from '@/lib/connect4-logic';
import { LanguageMenu } from '@/components/LanguageMenu';
import { getLocalePath, isRtlLocale, type AppLocale } from '@/lib/locales';
import { getTranslation, type TranslationStrings } from '@/lib/translations';

interface Connect4Props {
  initialLanguage?: AppLocale;
}

const POWER_DESCRIPTION_KEYS = [
  'doubleDropDescription',
  'columnLockDescription',
  'swapPairDescription',
  'colorFlipDescription',
  'airDropDescription',
  'clearTopDescription',
  'shieldDescription',
  'extraBombDescription'
] as const;

export const Connect4 = ({ initialLanguage = 'en' }: Connect4Props) => {
  const isMobileApp = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile';
  const {
    board,
    currentPlayer,
    gameActive,
    winner,
    winningLine,
    gameMode,
    difficulty,
    history,
    isAiThinking,
    timers,
    timerDuration,
    isPaused,
    stats,
    theme,
    language,
    isTabletopMode,
    onlineGameId,
    onlinePlayerRole,
    opponentConnected,
    isOnline,
    funMode,
    variant,
    selectedAction,
    activeDirection,
    activeWildCells,
    lastEffect,
    canUseFunModes,
    setGameMode,
    setDifficulty,
    setTimerDuration,
    setIsPaused,
    setTheme,
    setLanguage,
    setIsTabletopMode,
    setFunMode,
    setVariantSettings,
    setSelectedAction,
    setPlayerPower,
    makeMove,
    makeCellAction,
    resetGame,
    undoMove,
    jumpToMove,
    startOnlineGame,
    joinOnlineGame
  } = useConnect4(initialLanguage);

  const router = useRouter();
  const pathname = usePathname();
  const { theme: colorTheme, resolvedTheme, setTheme: setColorTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const isDarkMode = themeMounted && resolvedTheme === 'dark';

  useEffect(() => {
    setThemeMounted(true);
  }, []);
  const t = getTranslation(language);
  const isRtl = isRtlLocale(language);
  const privacyPath = language === 'de' ? '/de/privacy' : '/privacy';
  const openSourcePath = language === 'de' ? '/de/open-source' : '/open-source';
  const footerText = process.env.NEXT_PUBLIC_FOOTER_TEXT?.trim() || 'Connect 4';
  const wildAccentColor = isDarkMode ? '#22d3ee' : '#7c3aed';
  const handleLanguageChange = (nextLanguage: AppLocale) => {
    setLanguage(nextLanguage);
    const query = typeof window !== 'undefined' ? window.location.search : '';
    const nextPath = getLocalePath(nextLanguage);
    if (pathname !== nextPath) router.replace(`${nextPath}${query}`);
  };
  const ruleKeyByMode: Record<FunMode, keyof TranslationStrings> = {
    classic: 'classicRule',
    popout: 'popoutRule',
    gravity: 'gravityRule',
    bomb: 'bombRule',
    wildColumn: 'wildColumnRule',
    powerup: 'powerupRule',
    risingFloor: 'risingFloorRule',
    connect5: 'connect5Rule'
  };

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Delay winner modal to allow piece drop animation to finish
  useEffect(() => {
    if (winner) {
      const timer = setTimeout(() => setShowWinnerModal(true), 1500);
      return () => clearTimeout(timer);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowWinnerModal(false);
    }
  }, [winner]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive || isAiThinking || isPaused) return;
      const key = parseInt(e.key);
      if (key >= 1 && key <= 7) {
        makeMove(key - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive, isAiThinking, isPaused, makeMove]);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        "relative min-h-screen w-full flex flex-col items-center transition-colors duration-500 selection:bg-zinc-900 selection:text-white overflow-x-hidden",
        isMobileApp && "mobile-app-shell",
        isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"
      )}
    >
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] blur-[120px] rounded-full" style={{ backgroundColor: `${theme.red}15` }} />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] blur-[120px] rounded-full" style={{ backgroundColor: `${theme.yellow}15` }} />
      </div>

      <div className={cn(
        "relative z-10 w-full max-w-xl flex flex-col",
        isMobileApp ? "px-4 pt-6 pb-8 gap-6 md:gap-8 mobile-safe-content" : "px-6 py-12 gap-8 md:gap-12"
      )}>
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4">
            <div className="flex flex-col">
                <h1 className={cn(
                  "text-4xl md:text-5xl font-black tracking-tighter",
                  isDarkMode ? "text-white" : "text-zinc-900"
                )}>
                  {t.title.split(' ')[0]}<span className={isDarkMode ? "text-zinc-500" : "text-zinc-400"}>{toArabicNumerals(t.title.split(' ')[1] || '4', isRtl)}</span>
                </h1>
              <p className={cn(
                "text-sm font-bold uppercase tracking-[0.2em]",
                isDarkMode ? "text-zinc-500" : "text-zinc-600"
              )}>
                {t.subtitle}
              </p>
            </div>
            <div className={cn(
              "flex flex-col",
              isRtl ? "items-start sm:items-end" : "items-start sm:items-end"
            )}>
              <span className={cn(
                "text-[11px] font-black uppercase tracking-widest mb-1",
                isDarkMode ? "text-zinc-500" : "text-zinc-600"
              )}>{t.globalStats}</span>
              <div className="flex items-center gap-3">
                <div className="flex gap-6 sm:gap-4">
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-xl font-black leading-none" style={{ color: theme.red }}>{toArabicNumerals(stats.redWins, isRtl)}</span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    isDarkMode ? "text-zinc-500" : "text-zinc-600"
                  )}>{t.red}</span>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-xl font-black leading-none" style={{ color: theme.yellow }}>{toArabicNumerals(stats.yellowWins, isRtl)}</span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    isDarkMode ? "text-zinc-500" : "text-zinc-600"
                  )}>{t.yellow}</span>
                </div>
                </div>
                <LanguageMenu locale={language} onChange={handleLanguageChange} isDarkMode={isDarkMode} />
              </div>
            </div>
          </div>
        </header>

        {/* Game Area */}
        <main className="flex flex-col gap-8 transition-all duration-500 relative">
          <GameStatus
            currentPlayer={currentPlayer}
            gameActive={gameActive}
            isAiThinking={isAiThinking}
            timers={timers}
            timerDuration={timerDuration}
            funMode={funMode}
            variant={variant}
            theme={theme}
            isDarkMode={isDarkMode}
            t={t}
            language={language}
          />

          <GameBoard
            board={board}
            onMove={makeMove}
            onCellAction={makeCellAction}
            gameActive={gameActive && !isPaused}
            currentPlayer={currentPlayer}
            winningLine={winningLine}
            isAiThinking={isAiThinking}
            theme={theme}
            isPaused={isPaused}
            isDarkMode={isDarkMode}
            isTabletopMode={isTabletopMode}
            funMode={funMode}
            selectedAction={selectedAction}
            activeDirection={activeDirection}
            variant={variant}
            wildCells={activeWildCells}
            wildAccentColor={wildAccentColor}
            shieldCells={variant.shieldCells}
            lastEffect={lastEffect}
            t={t}
          />
        </main>

        <GameControls
          gameMode={gameMode}
          difficulty={difficulty}
          timerDuration={timerDuration}
          currentPlayer={currentPlayer}
          funMode={funMode}
          variant={variant}
          selectedAction={selectedAction}
          canUseFunModes={canUseFunModes}
          isPaused={isPaused}
          canUndo={history.length > 0}
          onUndo={undoMove}
          onReset={resetGame}
          onTogglePause={() => setIsPaused(!isPaused)}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onToggleHistory={() => {
            setIsPaused(true);
            setShowHistory(true);
          }}
          setGameMode={setGameMode}
          setDifficulty={setDifficulty}
          setTimerDuration={setTimerDuration}
          setFunMode={setFunMode}
          setVariantSettings={setVariantSettings}
          setSelectedAction={setSelectedAction}
          setPlayerPower={setPlayerPower}
          showSettings={showSettings}
          theme={theme}
          setTheme={setTheme}
          language={language}
          isDarkMode={isDarkMode}
          colorTheme={colorTheme || 'system'}
          setColorTheme={setColorTheme}
          isTabletopMode={isTabletopMode}
          setIsTabletopMode={setIsTabletopMode}
          onlineGameId={onlineGameId}
          onlinePlayerRole={onlinePlayerRole}
          opponentConnected={opponentConnected}
          isOnline={isOnline}
          startOnlineGame={startOnlineGame}
          joinOnlineGame={joinOnlineGame}
          t={t}
        />

        {/* Footer Info */}
        <footer className={cn("flex flex-col items-center gap-4", isMobileApp ? "py-4" : "py-8")}>
          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isDarkMode ? "text-zinc-500" : "text-zinc-600"
              )}>{t.difficulty}</span>
              <span className={cn(
                "text-xs font-black capitalize",
                isDarkMode ? "text-white" : "text-zinc-900"
              )}>{t[difficulty as keyof typeof t] || difficulty}</span>
            </div>
            <div className={cn("w-px h-8", isDarkMode ? "bg-zinc-800" : "bg-zinc-200")} />
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isDarkMode ? "text-zinc-500" : "text-zinc-600"
              )}>{t.mode}</span>
              <span className={cn(
                "text-xs font-black uppercase",
                isDarkMode ? "text-white" : "text-zinc-900"
              )}>{t[gameMode as keyof typeof t] || gameMode}</span>
            </div>
            <div className={cn("w-px h-8", isDarkMode ? "bg-zinc-800" : "bg-zinc-200")} />
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isDarkMode ? "text-zinc-500" : "text-zinc-600"
              )}>{t.funMode || 'Fun Mode'}</span>
              <span className={cn(
                "text-xs font-black uppercase",
                isDarkMode ? "text-white" : "text-zinc-900"
              )}>{t[funMode as keyof typeof t] || funMode}</span>
            </div>
          </div>
          {!isMobileApp && (
            <SeoSection
              isDarkMode={isDarkMode}
              isRtl={isRtl}
              t={t}
            />
          )}
          <div className={cn(
            "w-full rounded-2xl border px-4 py-3 text-center",
            isDarkMode ? "bg-zinc-900/70 border-zinc-800" : "bg-white/80 border-zinc-200"
          )}>
            <span className={cn(
              "block text-[10px] font-black uppercase tracking-widest mb-1",
              isDarkMode ? "text-zinc-500" : "text-zinc-600"
            )}>
              {t.rulesGuide || 'Rules Guide'} · {t[funMode as keyof typeof t] || funMode}
            </span>
            <p className={cn(
              "text-xs font-semibold leading-relaxed",
              isDarkMode ? "text-zinc-300" : "text-zinc-700"
            )}>
              {toArabicNumerals(t[ruleKeyByMode[funMode]] || t.classicRule, isRtl)}
              {funMode === 'powerup' && (
                <span className="mt-2 block">
                  {POWER_DESCRIPTION_KEYS.map(key => t[key] || '').filter(Boolean).join(' ')}
                </span>
              )}
            </p>
          </div>
          <p className={cn(
            "text-[11px] font-medium text-center max-w-[240px] leading-relaxed",
            isDarkMode ? "text-zinc-500" : "text-zinc-600"
          )}>
            {toArabicNumerals(t.instruction, isRtl)}
          </p>
          <div className={cn(
            "mt-6 flex flex-col items-center gap-1.5",
            isDarkMode ? "text-zinc-700" : "text-zinc-400"
          )}>
            <Link
              href={privacyPath}
              className={cn(
                "mb-2 text-[11px] font-bold underline underline-offset-4 transition-colors",
                isDarkMode ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-950"
              )}
            >
              {language === 'de' ? 'Datenschutz' : 'Privacy Policy'}
            </Link>
            <Link
              href={openSourcePath}
              className={cn(
                "mb-2 text-[11px] font-bold underline underline-offset-4 transition-colors",
                isDarkMode ? "text-zinc-400 hover:text-white" : "text-zinc-600 hover:text-zinc-950"
              )}
            >
              {language === 'de' ? 'Open-Source-Lizenzen' : 'Open Source Licenses'}
            </Link>
            <span className="text-[11px] font-black tracking-widest uppercase">© {footerText}</span>

          </div>
        </footer>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <MoveHistory
              history={history}
              onClose={() => setShowHistory(false)}
              onJump={(i) => {
                jumpToMove(i);
                setShowHistory(false);
              }}
              theme={theme}
              isDarkMode={isDarkMode}
              t={t}
              language={language}
            />
          </>
        )}
      </AnimatePresence>

      <GameModals
        winner={winner}
        show={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
        onReset={() => {
          setShowWinnerModal(false);
          resetGame();
        }}
        stats={stats}
        isDarkMode={isDarkMode}
        t={t}
        language={language}
      />
    </div>
  );
};
