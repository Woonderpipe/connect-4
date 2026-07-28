'use client';

import { useState, type CSSProperties } from 'react';
import {
  RotateCcw,
  Undo2,
  Settings2,
  History,
  Pause,
  Play,
  User,
  Cpu,
  Globe,
  Palette,
  X,
  Copy,
  Check,
  Link,
  Share2,
  Bomb,
  Sparkles,
  ArrowDownUp,
  Shield,
  Shuffle,
  Clock3,
  Monitor,
  Moon,
  Minus,
  Plus,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HexColorPicker } from 'react-colorful';
import { GameMode, Difficulty, TurnAction, VariantState, PowerPreference } from '@/hooks/use-connect4';
import { FUN_MODES, POWER_UPS, FunMode, Player, PowerUp } from '@/lib/connect4-logic';
import { cn, toArabicNumerals } from '@/lib/utils';
import { type AppLocale, isRtlLocale } from '@/lib/locales';
import type { TranslationStrings } from '@/lib/translations';
import { buildWebInviteUrl } from '@/lib/invite-links';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { NumberPicker } from './NumberPicker';

const GAME_MODE_OPTIONS = ['pvp', 'pve', 'online'] as const;
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const;
const PRESET_TIMER_DURATIONS = [0, 60, 120];
const TIMER_OPTIONS = [0, 60, 120, 'custom'] as const;
const CONTROL_SEGMENT_GAP_REM = 0.25;
const segmentTransition = { type: 'spring', bounce: 0.2, duration: 0.6 } as const;

const segmentSize = (count: number) => `calc((100% - ${(count - 1) * CONTROL_SEGMENT_GAP_REM}rem) / ${count})`;

const NumberStepper = ({ label, value, min, max, onChange, testId, isDarkMode }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  testId: string;
  isDarkMode: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
    <div className={cn('flex h-10 items-center overflow-hidden rounded-xl border', isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-50')}>
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-full w-10 place-items-center text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-white"><Minus size={15} /></button>
      <output data-testid={testId} className="grid h-full flex-1 place-items-center border-x border-zinc-200 text-sm font-black tabular-nums dark:border-zinc-800">{value}</output>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-full w-10 place-items-center text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-white"><Plus size={15} /></button>
    </div>
  </div>
);
const segmentTranslate = (index: number, isRtl = false) => {
  const direction = isRtl ? -1 : 1;
  const signedPercent = index * 100 * direction;
  const signedGap = index * CONTROL_SEGMENT_GAP_REM * direction;
  const gapOperator = signedGap < 0 ? '-' : '+';
  return `calc(${signedPercent}% ${gapOperator} ${Math.abs(signedGap)}rem)`;
};

const inlineStartStyle = (isRtl: boolean): CSSProperties => isRtl ? { right: 0 } : { left: 0 };

interface SegmentedIndicatorProps {
  index: number;
  count: number;
  isDarkMode: boolean;
  isRtl?: boolean;
}

const SegmentedIndicator = ({ index, count, isDarkMode, isRtl = false }: SegmentedIndicatorProps) => {
  if (index < 0) return null;

  return (
    <div className="absolute inset-1 pointer-events-none">
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ x: segmentTranslate(index, isRtl) }}
        transition={segmentTransition}
        className={cn("absolute top-0 bottom-0 rounded-lg z-0", isDarkMode ? "bg-zinc-100" : "bg-zinc-900")}
        style={{ width: segmentSize(count), ...inlineStartStyle(isRtl) }}
      />
    </div>
  );
};

interface SegmentedGridIndicatorProps {
  index: number;
  columns: number;
  isDarkMode: boolean;
  isRtl?: boolean;
  className?: string;
}

const SegmentedGridIndicatorLayer = ({ index, columns, isDarkMode, isRtl = false, className }: SegmentedGridIndicatorProps) => {
  if (index < 0) return null;

  const rows = Math.ceil(FUN_MODES.length / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);

  return (
    <div className={cn("absolute inset-1 pointer-events-none", className)}>
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ x: segmentTranslate(column, isRtl), y: segmentTranslate(row) }}
        transition={segmentTransition}
        className={cn("absolute rounded-lg z-0", isDarkMode ? "bg-zinc-100" : "bg-zinc-900")}
        style={{ width: segmentSize(columns), height: segmentSize(rows), top: 0, ...inlineStartStyle(isRtl) }}
      />
    </div>
  );
};

const SegmentedGridIndicator = ({ index, isDarkMode, isRtl = false }: Omit<SegmentedGridIndicatorProps, 'columns' | 'className'>) => (
  <>
    <SegmentedGridIndicatorLayer index={index} columns={2} isDarkMode={isDarkMode} isRtl={isRtl} className="sm:hidden" />
    <SegmentedGridIndicatorLayer index={index} columns={4} isDarkMode={isDarkMode} isRtl={isRtl} className="hidden sm:block" />
  </>
);
interface ControlsProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  timerDuration: number;
  currentPlayer: Player;
  funMode: FunMode;
  variant: VariantState;
  selectedAction: TurnAction;
  canUseFunModes: boolean;
  isPaused: boolean;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onTogglePause: () => void;
  onToggleSettings: () => void;
  onToggleHistory: () => void;
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (diff: Difficulty) => void;
  setTimerDuration: (dur: number) => void;
  setFunMode: (mode: FunMode) => void;
  setVariantSettings: (settings: Partial<VariantState['settings']>) => void;
  setSelectedAction: (action: TurnAction) => void;
  setPlayerPower: (player: 1 | 2, power: PowerPreference) => void;
  showSettings: boolean;
  theme: { red: string; yellow: string };
  setTheme: (theme: { red: string; yellow: string }) => void;
  language: AppLocale;
  isDarkMode: boolean;
  colorTheme: string;
  setColorTheme: (theme: 'system' | 'light' | 'dark') => void;
  isTabletopMode: boolean;
  setIsTabletopMode: (mode: boolean) => void;
  onlineGameId: string | null;
  onlinePlayerRole: number | null;
  opponentConnected: boolean;
  isOnline: boolean;
  startOnlineGame: () => Promise<string | null>;
  joinOnlineGame: (id: string) => Promise<boolean>;
  t: TranslationStrings;
}

export const GameControls = ({
  gameMode,
  difficulty,
  timerDuration,
  currentPlayer,
  funMode,
  variant,
  selectedAction,
  canUseFunModes,
  isPaused,
  canUndo,
  onUndo,
  onReset,
  onTogglePause,
  onToggleSettings,
  onToggleHistory,
  setGameMode,
  setDifficulty,
  setTimerDuration,
  setFunMode,
  setVariantSettings,
  setSelectedAction,
  setPlayerPower,
  showSettings,
  theme,
  setTheme,
  language,
  isDarkMode,
  colorTheme,
  setColorTheme,
  isTabletopMode,
  setIsTabletopMode,
  onlineGameId,
  onlinePlayerRole,
  opponentConnected,
  isOnline,
  startOnlineGame,
  joinOnlineGame,
  t
}: ControlsProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [isManualTimer, setIsManualTimer] = useState(false);
  const [openPowerPicker, setOpenPowerPicker] = useState<1 | 2 | null>(null);

  const isCustomSelected = theme.red !== '#ef4444' && theme.red !== '#06b6d4' && theme.red !== '#f97316';
  const isRtl = isRtlLocale(language);
  const currentPlayerKey = currentPlayer === 2 ? 2 : 1;
  const selectedPower = variant.powerSelections[currentPlayerKey];
  const powerUsed = variant.powerUsed[currentPlayerKey];
  const powerOptions: PowerPreference[] = ['random', ...POWER_UPS];
  const getPowerLabel = (power: PowerPreference) => power === 'random' ? (t.randomPower || 'Random') : (t[power as keyof typeof t] || power);
  const getPowerDescription = (power: PowerPreference) => {
    const key = power === 'random' ? 'randomPowerDescription' : `${power}Description`;
    return t[key as keyof typeof t] || '';
  };

  const colors = [
    { red: '#ef4444', yellow: '#fbbf24', label: t.classic },
    { red: '#06b6d4', yellow: '#10b981', label: t.ocean },
    { red: '#f97316', yellow: '#6366f1', label: t.sunset },
  ];
  const gameModeIndex = GAME_MODE_OPTIONS.indexOf(gameMode);
  const difficultyIndex = DIFFICULTY_OPTIONS.indexOf(difficulty);
  const funModeIndex = FUN_MODES.indexOf(funMode);
  const selectedTimerIndex = TIMER_OPTIONS.findIndex((option) => option === 'custom' ? !PRESET_TIMER_DURATIONS.includes(timerDuration) : timerDuration === option);
  const inviteUrl = onlineGameId ? buildWebInviteUrl(onlineGameId, { locale: language }) : '';

  const funModeIcon = (mode: FunMode) => {
    if (mode === 'bomb') return <Bomb size={14} />;
    if (mode === 'gravity') return <ArrowDownUp size={14} />;
    if (mode === 'powerup') return <Sparkles size={14} />;
    if (mode === 'popout') return <Shuffle size={14} />;
    return <Shield size={14} />;
  };

  const handleToggleSettings = () => {
    onToggleSettings();
  };

  const markCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    markCopied();
  };

  const shareInvite = async () => {
    if (!onlineGameId || !inviteUrl) return;
    trackAnalyticsEvent({ name: 'share_invite_clicked' });

    const shareTitle = t.onlineInviteTitle || 'Connect 4 Online Match';
    const shareText = t.onlineInviteText || 'Join my Connect 4 match:';

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: inviteUrl
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    await copyToClipboard(inviteUrl);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            "flex-1 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-sm",
            isDarkMode
              ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50",
            "disabled:opacity-30 disabled:cursor-not-allowed"
          )}
          title={t.undo}
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={onToggleHistory}
          className={cn(
            "flex-1 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-sm",
            isDarkMode
              ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          )}
          title={t.history}
        >
          <History size={18} />
        </button>
        <button
          data-testid="pause-toggle"
          onClick={onTogglePause}
          className={cn(
            "flex-1 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-sm text-white",
            isPaused ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          )}
          title={isPaused ? t.resume : t.pause}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
        </button>
        <button
          data-testid="settings-toggle"
          onClick={handleToggleSettings}
          className={cn(
            "flex-1 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-sm",
            showSettings
              ? (isDarkMode ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-white")
              : (isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50")
          )}
          title={t.settings}
        >
          <Settings2 size={18} />
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{
          gridTemplateRows: showSettings ? '1fr' : '0fr',
          opacity: showSettings ? 1 : 0,
          y: showSettings ? 0 : -8
        }}
        transition={{ type: 'spring', bounce: 0.14, duration: 0.42 }}
        className="grid overflow-hidden"
        style={{
          pointerEvents: showSettings ? 'auto' : 'none',
          marginTop: showSettings ? 0 : '-0.75rem',
          willChange: 'grid-template-rows, opacity, transform'
        }}
        aria-hidden={!showSettings}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={cn(
            "border rounded-2xl p-4 shadow-sm",
            isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-widest",
                  isDarkMode ? "text-zinc-500" : "text-zinc-600"
                )}>{t.gameMode}</span>
                <div className={cn(
                  "grid grid-cols-3 gap-1 p-1 rounded-xl relative",
                  isDarkMode ? "bg-zinc-950" : "bg-zinc-100"
                )}>
                  <SegmentedIndicator index={gameModeIndex} count={GAME_MODE_OPTIONS.length} isDarkMode={isDarkMode} isRtl={isRtl} />
                  {GAME_MODE_OPTIONS.map((mode) => (
                    <button
                      key={mode}
                      data-testid={`mode-${mode}`}
                      aria-pressed={gameMode === mode}
                      onClick={() => setGameMode(mode)}
                      className={cn(
                        "relative z-10 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
                        gameMode === mode
                          ? (isDarkMode ? "text-zinc-900" : "text-white")
                          : (isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-600 hover:text-zinc-900")
                      )}
                    >
                      {mode === 'pvp' ? <User size={14} /> : mode === 'pve' ? <Cpu size={14} /> : <Globe size={14} />}
                      {t[mode as keyof typeof t] || mode.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {gameMode === 'online' && (
                <div className="flex flex-col gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  {!onlineGameId ? (
                    <>
                      <div className="flex flex-col gap-1">
                        <button
                          data-testid="online-create-game"
                          onClick={async () => {
                            setIsCreating(true);
                            setCreateError('');
                            const id = await startOnlineGame();
                            setIsCreating(false);
                            if (!id) {
                              setCreateError(t.failedToCreateGame || 'Failed to create game. Database might not be configured.');
                            }
                          }}
                          disabled={isCreating}
                          className={cn(
                            "w-full py-2.5 rounded-lg font-bold text-sm transition-all text-white shadow-sm",
                            isDarkMode ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-900 hover:bg-zinc-800",
                            isCreating && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isCreating ? (t.creating || 'Creating...') : (t.createNewGame || 'Create New Game')}
                        </button>
                        {createError && (
                          <span className="text-xs text-red-500 font-medium px-1 text-center">{createError}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                        <span className="text-[10px] font-bold uppercase text-zinc-400">{t.or || 'OR'}</span>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            data-testid="online-join-code"
                            placeholder={t.enterGameCode || 'Enter Game Code'}
                            value={joinCode}
                            onChange={(e) => {
                              setJoinCode(e.target.value);
                              setJoinError('');
                            }}
                            className={cn(
                              "flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-zinc-500",
                              isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900",
                              joinError && "border-red-500 focus:ring-red-500"
                            )}
                          />
                          <button
                            data-testid="online-join-game"
                            onClick={async () => {
                              if (!joinCode.trim()) return;
                              setIsJoining(true);
                              setJoinError('');
                              const success = await joinOnlineGame(joinCode.trim());
                              setIsJoining(false);
                              if (!success) {
                                setJoinError(t.invalidCode || 'Invalid code or game full');
                              }
                            }}
                            disabled={isJoining || !joinCode.trim()}
                            className={cn(
                              "px-4 py-2 rounded-lg font-bold text-sm transition-all text-white shadow-sm",
                              isDarkMode ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-900 hover:bg-zinc-800",
                              (isJoining || !joinCode.trim()) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {isJoining ? (t.joining || 'Joining...') : (t.join || 'Join')}
                          </button>
                        </div>
                        {joinError && (
                          <span className="text-xs text-red-500 font-medium px-1">{joinError}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[11px] font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-500" : "text-zinc-600")}>
                          {t.gameCode || 'Game Code'}
                        </span>
                        <span data-testid="online-opponent-status" data-connected={opponentConnected ? 'true' : 'false'} className={cn("text-xs font-medium px-2 py-0.5 rounded-full", opponentConnected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
                          {opponentConnected ? (t.opponentConnected || 'Opponent Connected') : (t.waitingForOpponent || 'Waiting for Opponent...')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div data-testid="online-game-code" className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-sm font-mono flex items-center border overflow-hidden text-ellipsis whitespace-nowrap",
                          isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        )}>
                          {onlineGameId}
                        </div>
                        <button
                          data-testid="online-copy-code"
                          onClick={() => copyToClipboard(onlineGameId)}
                          title={t.copyCode || 'Copy Code'}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg transition-colors border flex-shrink-0",
                            isDarkMode ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900"
                          )}
                        >
                          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                        <button
                          data-testid="online-copy-link"
                          onClick={() => copyToClipboard(inviteUrl)}
                          title={t.copyLink || 'Copy Link'}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg transition-colors border flex-shrink-0",
                            isDarkMode ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900"
                          )}
                        >
                          <Link size={16} />
                        </button>
                        <button
                          data-testid="online-share-invite"
                          onClick={shareInvite}
                          title={t.shareInvite || 'Share Invite'}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg transition-colors border flex-shrink-0",
                            isDarkMode ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900"
                          )}
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {gameMode === 'pve' && (
                <div className="flex flex-col gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isDarkMode ? "text-zinc-500" : "text-zinc-600"
                  )}>{t.aiDifficulty}</span>
                  <div className={cn(
                    "grid grid-cols-3 gap-1 p-1 rounded-xl relative",
                    isDarkMode ? "bg-zinc-950" : "bg-zinc-100"
                  )}>
                    <SegmentedIndicator index={difficultyIndex} count={DIFFICULTY_OPTIONS.length} isDarkMode={isDarkMode} isRtl={isRtl} />
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "relative z-10 py-2 rounded-lg text-xs font-medium capitalize transition-colors",
                          difficulty === d
                            ? (isDarkMode ? "text-zinc-900" : "text-white")
                            : (isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-600 hover:text-zinc-900")
                        )}
                      >
                        {t[d as keyof typeof t] || d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-widest",
                  isDarkMode ? "text-zinc-500" : "text-zinc-600"
                )}>{t.funMode || 'Fun Mode'}</span>
                <div className={cn(
                  "grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl relative",
                  isDarkMode ? "bg-zinc-950" : "bg-zinc-100"
                )}>
                  <SegmentedGridIndicator index={funModeIndex} isDarkMode={isDarkMode} isRtl={isRtl} />
                  {FUN_MODES.map((mode) => {
                    const disabled = mode !== 'classic' && !canUseFunModes;
                    return (
                      <button
                        key={mode}
                        data-testid={'fun-mode-' + mode}
                        onClick={() => !disabled && setFunMode(mode)}
                        disabled={disabled}
                        title={disabled ? (t.funModeUnavailable || 'Fun modes are available in PVP and serverless online only') : undefined}
                        className={cn(
                          "relative z-10 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[11px] font-bold transition-colors",
                          funMode === mode
                            ? (isDarkMode ? "text-zinc-900" : "text-white")
                            : (isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-600 hover:text-zinc-900"),
                          disabled && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {funModeIcon(mode)}
                        <span className="truncate">{t[mode as keyof typeof t] || mode}</span>
                      </button>
                    );
                  })}
                </div>
                {!canUseFunModes && funMode === 'classic' && (
                  <span className="text-[11px] font-medium text-zinc-400">{t.funModeUnavailable || 'Fun modes are available in PVP and serverless online only'}</span>
                )}
              </div>

              {funMode !== 'classic' && (
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
                  {(funMode === 'risingFloor' || funMode === 'gravity') && <NumberStepper label={funMode === 'risingFloor' ? (t.floorInterval || 'Row every') : (t.gravityInterval || 'Shift every')} value={funMode === 'risingFloor' ? variant.settings.risingFloorInterval : variant.settings.gravityShiftInterval} min={2} max={20} testId={funMode === 'risingFloor' ? 'rising-floor-interval' : 'gravity-shift-interval'} isDarkMode={isDarkMode} onChange={(value) => setVariantSettings(funMode === 'risingFloor' ? { risingFloorInterval: value } : { gravityShiftInterval: value })} />}
                  {funMode === 'wildColumn' && <NumberStepper label={t.wildColumnLabel || 'Wild fields'} value={variant.settings.wildCellCount} min={1} max={42} testId="wild-cell-count" isDarkMode={isDarkMode} onChange={(value) => setVariantSettings({ wildCellCount: value })} />}
                  {funMode === 'bomb' && <NumberStepper label={t.bombAction || 'Bombs'} value={variant.settings.bombsPerPlayer} min={0} max={10} testId="bomb-count" isDarkMode={isDarkMode} onChange={(value) => setVariantSettings({ bombsPerPlayer: value })} />}
                  {funMode === 'connect5' && <><NumberStepper label={t.connectLength || 'Connect length'} value={variant.settings.connectLength} min={4} max={7} testId="connect-length" isDarkMode={isDarkMode} onChange={(value) => setVariantSettings({ connectLength: value })} /><NumberStepper label={t.dropsPerTurn || 'Drops per turn'} value={variant.settings.dropsPerTurn} min={1} max={3} testId="drops-per-turn" isDarkMode={isDarkMode} onChange={(value) => setVariantSettings({ dropsPerTurn: value })} /></>}
                </div>
              )}

              {funMode === 'powerup' && (
                <div className="flex flex-col gap-2">
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-widest",
                    isDarkMode ? "text-zinc-500" : "text-zinc-600"
                  )}>{t.powerSetup || 'Power Setup'}</span>
                  {[1, 2].map((player) => (
                    <div key={player} className="grid grid-cols-[72px_1fr] gap-2 items-start">
                      <span className="text-xs font-bold text-zinc-400">{player === 1 ? t.red : t.yellow}</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenPowerPicker(openPowerPicker === player ? null : player as 1 | 2)}
                          className={cn(
                            "w-full rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all",
                            isDarkMode ? "bg-zinc-950 border-zinc-800 text-white hover:border-zinc-600" : "bg-white border-zinc-200 text-zinc-900 hover:border-zinc-400"
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate">{getPowerLabel(variant.powerPreferences[player as 1 | 2])}</span>
                            <Sparkles size={14} className="shrink-0 text-violet-400" />
                          </span>
                          {variant.powerPreferences[player as 1 | 2] === 'random' && (
                            <span className="mt-1 block truncate text-[10px] font-semibold text-zinc-500">
                              {t.currentPower || 'Current'}: {getPowerLabel(variant.powerSelections[player as 1 | 2])}
                            </span>
                          )}
                        </button>
                        <AnimatePresence>
                          {openPowerPicker === player && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
                              className={cn(
                                "absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border p-1 shadow-2xl",
                                isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
                              )}
                            >
                              {powerOptions.map((power) => (
                                <button
                                  key={power}
                                  type="button"
                                  onClick={() => {
                                    setPlayerPower(player as 1 | 2, power);
                                    setOpenPowerPicker(null);
                                  }}
                                  className={cn(
                                    "w-full rounded-lg px-2 py-2 text-left transition-colors",
                                    variant.powerPreferences[player as 1 | 2] === power
                                      ? (isDarkMode ? "bg-zinc-100 text-zinc-950" : "bg-zinc-900 text-white")
                                      : (isDarkMode ? "text-zinc-300 hover:bg-zinc-900" : "text-zinc-800 hover:bg-zinc-100")
                                  )}
                                >
                                  <span className="block text-xs font-black">{getPowerLabel(power)}</span>
                                  <span className={cn(
                                    "mt-0.5 block text-[10px] font-semibold leading-snug",
                                    variant.powerPreferences[player as 1 | 2] === power ? "opacity-80" : "text-zinc-500"
                                  )}>
                                    {getPowerDescription(power)}
                                  </span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-widest",
                  isDarkMode ? "text-zinc-500" : "text-zinc-600"
                )}>{t.theme}</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {colors.map((c, i) => {
                    const isSelected = theme.red === c.red;
                    return (
                      <button
                        key={i}
                        onClick={() => setTheme({ red: c.red, yellow: c.yellow })}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                          isSelected ? (isDarkMode ? "bg-zinc-800" : "bg-zinc-100") : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        )}
                      >
                        <div className="flex -space-x-2">
                          <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c.red }} />
                          <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c.yellow }} />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase text-center leading-tight",
                          isDarkMode ? "text-zinc-500" : "text-zinc-600"
                        )}>{c.label}</span>
                      </button>
                    );
                  })}
                  <div className="relative w-full h-full min-h-[64px]">
                    <motion.button
                      layoutId="custom-color-modal"
                      onClick={() => setShowColorPicker(true)}
                      className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 transition-all",
                        isCustomSelected ? (isDarkMode ? "bg-zinc-800" : "bg-zinc-100") : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                      style={{
                        borderRadius: 12,
                        opacity: showColorPicker ? 0 : 1,
                        pointerEvents: showColorPicker ? 'none' : 'auto'
                      }}
                    >
                      <motion.div className="w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                        <Palette size={14} className={isDarkMode ? "text-zinc-400" : "text-zinc-600"} />
                      </motion.div>
                      <motion.span className={cn(
                        "text-[10px] font-bold uppercase text-center leading-tight",
                        isDarkMode ? "text-zinc-500" : "text-zinc-600"
                      )}>{t.custom}</motion.span>
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-widest",
                  isDarkMode ? "text-zinc-500" : "text-zinc-600"
                )}>{t.timerDuration}</span>
                <div className={cn(
                  "grid grid-cols-4 gap-1 p-1 rounded-xl relative",
                  isDarkMode ? "bg-zinc-950" : "bg-zinc-100"
                )}>
                  <SegmentedIndicator index={selectedTimerIndex} count={TIMER_OPTIONS.length} isDarkMode={isDarkMode} isRtl={isRtl} />
                  {TIMER_OPTIONS.map((d) => {
                    const isSelected = d === 'custom' ? ![0, 60, 120].includes(timerDuration) : timerDuration === d;
                    return (
                      <motion.button
                        key={d}
                        layoutId={d === 'custom' ? "custom-timer-modal" : undefined}
                        onClick={() => {
                          if (d === 'custom') {
                            setShowCustomTimer(true);
                          } else {
                            setTimerDuration(d as number);
                          }
                        }}
                        className={cn(
                          "relative z-10 py-2 rounded-lg text-xs font-medium transition-colors",
                          isSelected
                            ? (isDarkMode ? "text-zinc-900" : "text-white")
                            : (isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-600 hover:text-zinc-900")
                        )}
                      >
                        {d === 0 ? t.off : d === 'custom' ? (<span className="inline-flex items-center justify-center gap-1" title={t.custom || 'Custom timer'} aria-label={t.custom || 'Custom timer'}><Clock3 size={16} aria-hidden="true" />{![0, 60, 120].includes(timerDuration) && <span>{toArabicNumerals(Math.floor(timerDuration / 60), isRtl) + 'm ' + toArabicNumerals(timerDuration % 60, isRtl) + 's'}</span>}</span>) : (toArabicNumerals((d as number) / 60, isRtl) + 'm')}
                      </motion.button>
                    );
                  })}
                </div>
              </div>


              <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-widest",
                  isDarkMode ? "text-zinc-500" : "text-zinc-600"
                )}>{t.darkMode}</span>
                <div className={cn('grid grid-cols-3 gap-1 rounded-xl p-1', isDarkMode ? 'bg-zinc-950' : 'bg-zinc-100')} role="group" aria-label={t.darkMode}>
                  {[
                    { value: 'system', label: 'System appearance', icon: Monitor, testId: 'theme-system' },
                    { value: 'light', label: 'Light appearance', icon: Sun, testId: 'theme-light' },
                    { value: 'dark', label: 'Dark appearance', icon: Moon, testId: 'theme-dark' },
                  ].map(({ value, label, icon: Icon, testId }) => (
                    <button
                      type="button"
                      key={value}
                      data-testid={testId}
                      aria-label={label}
                      aria-pressed={colorTheme === value}
                      onClick={() => setColorTheme(value as 'system' | 'light' | 'dark')}
                      className={cn(
                        'grid h-8 w-8 place-items-center rounded-lg transition-colors',
                        colorTheme === value
                          ? (isDarkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white')
                          : (isDarkMode ? 'text-zinc-500 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900')
                      )}
                    >
                      <Icon size={15} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>

              {gameMode === 'pvp' && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-widest",
                    isDarkMode ? "text-zinc-500" : "text-zinc-600"
                  )}>{t.tabletopMode}</span>
                  <button
                    onClick={() => setIsTabletopMode(!isTabletopMode)}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors relative",
                      isTabletopMode ? "bg-green-500" : (isDarkMode ? "bg-zinc-800" : "bg-zinc-200")
                    )}
                  >
                    <motion.div
                      animate={{ x: isTabletopMode ? (isRtl ? -24 : 24) : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {canUseFunModes && funMode !== 'classic' && (
        <div className={cn(
          "border rounded-2xl p-3 flex flex-col gap-3 shadow-sm",
          isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
        )}>
          <div className="flex items-center justify-between gap-3">
            <span className={cn("text-[11px] font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-500" : "text-zinc-600")}>
              {t[funMode as keyof typeof t] || funMode}
            </span>
            <span className="text-xs font-black" style={{ color: currentPlayer === 1 ? theme.red : theme.yellow }}>
              {currentPlayer === 1 ? t.red : t.yellow}
            </span>
          </div>

          {funMode === 'popout' && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {(['drop', 'popout'] as TurnAction[]).map(action => (
                  <button
                    key={action}
                    onClick={() => setSelectedAction(action)}
                    className={cn(
                      "h-10 rounded-xl text-xs font-black uppercase transition-all",
                      selectedAction === action
                        ? (isDarkMode ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-white")
                        : (isDarkMode ? "bg-zinc-950 text-zinc-400" : "bg-zinc-100 text-zinc-600")
                    )}
                  >
                    {action === 'drop' ? (t.drop || 'Drop') : (t.popOutAction || 'Pop Out')}
                  </button>
                ))}
              </div>
              {selectedAction === 'popout' && (
                <span className="text-[11px] font-semibold text-zinc-500">{t.popOutHint || 'Click a bottom handle under a column with your own disc.'}</span>
              )}
            </div>
          )}

          {funMode === 'bomb' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedAction('drop')}
                className={cn("h-10 rounded-xl text-xs font-black uppercase", selectedAction === 'drop' ? (isDarkMode ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-white") : (isDarkMode ? "bg-zinc-950 text-zinc-400" : "bg-zinc-100 text-zinc-600"))}
              >
                {t.drop || 'Drop'}
              </button>
              <button
                onClick={() => setSelectedAction('bomb')}
                disabled={variant.bombs[currentPlayerKey] <= 0}
                className={cn("h-10 rounded-xl text-xs font-black uppercase disabled:opacity-40", selectedAction === 'bomb' ? "bg-red-500 text-white" : (isDarkMode ? "bg-zinc-950 text-zinc-400" : "bg-zinc-100 text-zinc-600"))}
              >
                <span className="inline-flex items-center gap-1"><Bomb size={14} /> {t.bombAction || 'Bomb'} ({toArabicNumerals(variant.bombs[currentPlayerKey], isRtl)})</span>
              </button>
            </div>
          )}

          {funMode === 'powerup' && (
            <button
              data-testid="use-power-toggle" onClick={() => setSelectedAction(selectedAction === 'power' ? 'drop' : 'power')}
              disabled={powerUsed}
              className={cn(
                "h-12 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 disabled:opacity-40",
                selectedAction === 'power'
                  ? "bg-violet-500 text-white"
                  : (isDarkMode ? "bg-zinc-950 text-zinc-300" : "bg-zinc-100 text-zinc-700")
              )}
            >
              <Sparkles size={16} />
              {powerUsed ? (t.powerUsed || 'Power used') : `${t.usePower || 'Use Power'}: ${t[selectedPower as keyof typeof t] || selectedPower}`}
            </button>
          )}

          {funMode === 'gravity' && (
            <div className="h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase bg-sky-500 text-white">
              <ArrowDownUp size={16} />
              {t.gravityDirection || 'Gravity'}: {t[variant.gravityDirection as keyof typeof t] || variant.gravityDirection}
            </div>
          )}

          {funMode === 'wildColumn' && (
            <div className="h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase bg-cyan-500 text-white">
              {t.wildColumnLabel || 'Wild Spots'} {toArabicNumerals(variant.wildCells.length, isRtl)}
            </div>
          )}

          {funMode === 'risingFloor' && (
            <div className="h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase bg-orange-500 text-white">
              {t.floorRisesIn || 'Floor rises in'} {toArabicNumerals(variant.settings.risingFloorInterval - variant.risingTurnCount, isRtl)}
            </div>
          )}

          {funMode === 'connect5' && (
            <div className="h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase bg-emerald-500 text-white">
              {t.dropProgress || 'Drop'} {toArabicNumerals(variant.settings.dropsPerTurn - variant.pendingDrops + 1, isRtl)} / {toArabicNumerals(variant.settings.dropsPerTurn, isRtl)}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onReset}
        className={cn(
          "w-full h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg",
          isDarkMode
            ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-zinc-950"
            : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200"
        )}
      >
        <RotateCcw size={18} />
        {t.newGame}
      </button>

      {/* Custom Color Picker Modal */}
      <AnimatePresence>
        {showColorPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm"
              onClick={() => setShowColorPicker(false)}
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                layoutId="custom-color-modal"
                className={cn(
                  "pointer-events-auto relative w-full max-w-sm p-6 shadow-2xl flex flex-col gap-6 overflow-hidden",
                  isDarkMode ? "bg-zinc-900 border border-zinc-800" : "bg-white/95 border border-zinc-200 backdrop-blur-xl"
                )}
                style={{ borderRadius: 32 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                      <Palette size={18} className={isDarkMode ? "text-zinc-400" : "text-zinc-600"} />
                    </div>
                    <h3 className={cn("text-xl font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>
                      {t.custom}
                    </h3>
                  </div>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setShowColorPicker(false)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isDarkMode ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-600"
                    )}
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  {/* Pickers */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                        {t.red}
                      </span>
                      <div className="w-5 h-5 rounded-full shadow-sm border-2 border-white/50" style={{ backgroundColor: theme.red }} />
                    </div>
                    <div className="custom-color-picker">
                      <HexColorPicker color={theme.red} onChange={(c) => setTheme({ ...theme, red: c })} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                        {t.yellow}
                      </span>
                      <div className="w-5 h-5 rounded-full shadow-sm border-2 border-white/50" style={{ backgroundColor: theme.yellow }} />
                    </div>
                    <div className="custom-color-picker">
                      <HexColorPicker color={theme.yellow} onChange={(c) => setTheme({ ...theme, yellow: c })} />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Timer Modal */}
      <AnimatePresence>
        {showCustomTimer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm"
              onClick={() => setShowCustomTimer(false)}
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                layoutId="custom-timer-modal"
                className={cn(
                  "pointer-events-auto relative w-full max-w-sm p-6 shadow-2xl flex flex-col gap-6 overflow-hidden",
                  isDarkMode ? "bg-zinc-900 border border-zinc-800" : "bg-white/95 border border-zinc-200 backdrop-blur-xl"
                )}
                style={{ borderRadius: 32 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                      <Settings2 size={18} className={isDarkMode ? "text-zinc-400" : "text-zinc-600"} />
                    </div>
                    <h3 className={cn("text-xl font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>
                      {t.custom || 'Custom Timer'}
                    </h3>
                  </div>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setShowCustomTimer(false)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isDarkMode ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-600"
                    )}
                  >
                    <X size={16} />
                  </motion.button>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex justify-center gap-4" dir="ltr">
                    {isManualTimer ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(Math.min(99, Math.max(0, parseInt(e.target.value) || 0)))}
                          className={cn(
                            "w-16 h-16 text-3xl font-black text-center rounded-xl border-2 transition-all outline-none",
                            isDarkMode
                              ? "bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500"
                              : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400"
                          )}
                        />
                        <span className={cn("text-2xl font-black", isDarkMode ? "text-zinc-600" : "text-zinc-300")}>:</span>
                        <input
                          type="number"
                          value={customSeconds}
                          onChange={(e) => setCustomSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                          className={cn(
                            "w-16 h-16 text-3xl font-black text-center rounded-xl border-2 transition-all outline-none",
                            isDarkMode
                              ? "bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500"
                              : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400"
                          )}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col items-center gap-2">
                          <span className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                            {t.minutes || 'Minutes'}
                          </span>
                          <NumberPicker
                            value={customMinutes}
                            onChange={setCustomMinutes}
                            max={60}
                            isDarkMode={isDarkMode}
                            isRtl={isRtl}
                          />
                        </div>
                        <div className="flex flex-col items-center justify-center pt-6">
                          <span className={cn("text-2xl font-black", isDarkMode ? "text-zinc-600" : "text-zinc-300")}>:</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                            {t.seconds || 'Seconds'}
                          </span>
                          <NumberPicker
                            value={customSeconds}
                            onChange={setCustomSeconds}
                            max={59}
                            isDarkMode={isDarkMode}
                            isRtl={isRtl}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCustomMinutes(1);
                          setCustomSeconds(0);
                        }}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-zinc-100 text-zinc-500 hover:text-zinc-700"
                        )}
                      >
                        {t.resetToOneMin || 'Reset to 1:00'}
                      </button>
                      <button
                        onClick={() => setIsManualTimer(!isManualTimer)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          isDarkMode ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-zinc-100 text-zinc-500 hover:text-zinc-700"
                        )}
                      >
                        {isManualTimer ? (t.usePicker || 'Use Picker') : (t.manualInput || 'Manual Input')}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const totalSeconds = customMinutes * 60 + customSeconds;
                        setTimerDuration(totalSeconds);
                        setShowCustomTimer(false);
                      }}
                      className={cn(
                        "w-full py-3 rounded-xl font-bold text-sm transition-all text-white shadow-sm",
                        isDarkMode ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
                      )}
                    >
                      {t.setTimer || 'Set Timer'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
