'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Board,
  Player,
  FunMode,
  GravityDirection,
  PowerUp,
  FUN_MODES,
  GRAVITY_DIRECTIONS,
  POWER_UPS,
  createEmptyBoard,
  createWildCells,
  getAvailablePosition,
  checkWin,
  isBoardFull,
  getBestMove,
  cloneBoard,
  settleBoard,
  popOutDisc,
  removeBottomRow,
  ROWS,
  COLS
} from '@/lib/connect4-logic';
import { createOnlineGame, getOnlineGame, updateOnlineGame, subscribeToGame, OnlineGameState } from '@/lib/pocketbase';
import { parseInviteGameCode } from '@/lib/invite-links';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { reportOperationalError } from '@/lib/operational-logging';
import { readClientJson, writeClientJson } from '@/lib/client-storage';
import { type AppLocale } from '@/lib/locales';
export type GameMode = 'pvp' | 'pve' | 'online';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TurnAction = 'drop' | 'popout' | 'bomb' | 'power';
export type PowerPreference = PowerUp | 'random';
export type BoardEffectType = 'bomb' | 'popout' | 'risingFloor' | 'gravity' | 'power' | 'connect5';

export interface BoardEffect {
  id: number;
  type: BoardEffectType;
  label: string;
  player: Player;
  cells?: [number, number][];
  removed?: { row: number; col: number; player: Player }[];
  protected?: [number, number][];
  landing?: [number, number] | null;
  direction?: GravityDirection;
  power?: PowerUp;
}

export interface Move {
  row: number;
  col: number;
  player: Player;
  timestamp: number;
  action?: TurnAction | 'risingFloor';
  label?: string;
  power?: PowerUp;
}

export interface GameStats {
  redWins: number;
  yellowWins: number;
  draws: number;
  totalGames: number;
}

export interface VariantState {
  funMode: FunMode;
  settings: VariantSettings;
  gravityDirection: GravityDirection;
  wildCells: [number, number][];
  bombs: { 1: number; 2: number };
  powerPreferences: { 1: PowerPreference; 2: PowerPreference };
  powerSelections: { 1: PowerUp; 2: PowerUp };
  powerUsed: { 1: boolean; 2: boolean };
  blockedColumns: { 1: number | null; 2: number | null };
  shieldCells: [number, number][];
  risingTurnCount: number;
  pendingDrops: number;
}

export interface VariantSettings {
  risingFloorInterval: number;
  gravityShiftInterval: number;
  wildCellCount: number;
  bombsPerPlayer: number;
  connectLength: number;
  dropsPerTurn: number;
}

interface GameSnapshot {
  board: Board;
  currentPlayer: Player;
  gameActive: boolean;
  winner: Player | 'draw' | null;
  winningLine: [number, number][] | null;
  history: Move[];
  timers: { 1: number; 2: number };
  variant: VariantState;
}

const MODE_SETTINGS_STORAGE_KEY = 'connect4_mode_settings';

const defaultVariantSettings = (): VariantSettings => ({
  risingFloorInterval: 5,
  gravityShiftInterval: 4,
  wildCellCount: 5,
  bombsPerPlayer: 2,
  connectLength: 5,
  dropsPerTurn: 2
});

const defaultVariantState = (funMode: FunMode = 'classic', settings = defaultVariantSettings()): VariantState => ({
  funMode,
  settings,
  gravityDirection: 'down',
  wildCells: funMode === 'wildColumn' ? createWildCells(settings.wildCellCount) : [],
  bombs: { 1: funMode === 'bomb' ? settings.bombsPerPlayer : 0, 2: funMode === 'bomb' ? settings.bombsPerPlayer : 0 },
  powerPreferences: { 1: 'random', 2: 'random' },
  powerSelections: {
    1: POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)],
    2: POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)]
  },
  powerUsed: { 1: false, 2: false },
  blockedColumns: { 1: null, 2: null },
  shieldCells: [],
  risingTurnCount: 0,
  pendingDrops: funMode === 'connect5' ? settings.dropsPerTurn : 1
});

const cloneVariant = (variant: VariantState): VariantState => ({
  ...variant,
  bombs: { ...variant.bombs },
  powerPreferences: { ...variant.powerPreferences },
  powerSelections: { ...variant.powerSelections },
  powerUsed: { ...variant.powerUsed },
  blockedColumns: { ...variant.blockedColumns },
  wildCells: variant.wildCells.map(([r, c]) => [r, c]),
  shieldCells: variant.shieldCells.map(([r, c]) => [r, c])
});

const resolvePower = (preference: PowerPreference): PowerUp => {
  return preference === 'random' ? POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)] : preference;
};

const prepareVariantForNewGame = (previous: VariantState, funMode = previous.funMode, settings = previous.settings): VariantState => {
  const base = defaultVariantState(funMode, settings);
  return {
    ...base,
    powerPreferences: { ...previous.powerPreferences },
    powerSelections: {
      1: resolvePower(previous.powerPreferences[1]),
      2: resolvePower(previous.powerPreferences[2])
    }
  };
};

const MAX_REMOTE_HISTORY_ENTRIES = ROWS * COLS * 4;
const MAX_REMOTE_STATE_HISTORY_ENTRIES = 20;
const MAX_REMOTE_EFFECT_CELLS = ROWS * COLS;
const MAX_TIMER_SECONDS = 60 * 60;
const MAX_EFFECT_LABEL_LENGTH = 80;

type PlayerTimers = { 1: number; 2: number };

type IncomingGameState = {
  id?: string;
  board?: Board;
  currentPlayer?: Player;
  gameActive?: boolean;
  winner?: Player | 'draw' | null;
  winningLine?: [number, number][] | null;
  history?: Move[];
  timers?: PlayerTimers & { p2Joined?: true };
  timerDuration?: number;
  player2Joined?: boolean;
  variant?: VariantState;
  lastEffect?: BoardEffect | null;
  revision?: number;
  updatedAt?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const hasField = (record: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(record, key);

const isActivePlayerValue = (value: unknown): value is 1 | 2 => value === 1 || value === 2;
const isPlayerValue = (value: unknown): value is Player => isActivePlayerValue(value) || value === null;
const isWinnerValue = (value: unknown): value is Player | 'draw' | null => isPlayerValue(value) || value === 'draw';
const isFunModeValue = (value: unknown): value is FunMode => typeof value === 'string' && FUN_MODES.includes(value as FunMode);
const isGravityDirectionValue = (value: unknown): value is GravityDirection =>
  typeof value === 'string' && GRAVITY_DIRECTIONS.includes(value as GravityDirection);
const isPowerValue = (value: unknown): value is PowerUp => typeof value === 'string' && POWER_UPS.includes(value as PowerUp);
const isPowerPreferenceValue = (value: unknown): value is PowerPreference => value === 'random' || isPowerValue(value);
const isTurnActionValue = (value: unknown): value is Move['action'] =>
  value === 'drop' || value === 'popout' || value === 'bomb' || value === 'power' || value === 'risingFloor';

const boundedInteger = (value: unknown, fallback: number, min: number, max: number) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(numericValue)));
};

const normalizeGameMode = (value: unknown): GameMode =>
  value === 'pvp' || value === 'pve' || value === 'online' ? value : 'pve';

const normalizeDifficulty = (value: unknown): Difficulty =>
  value === 'easy' || value === 'medium' || value === 'hard' ? value : 'medium';

const normalizeCurrentPlayer = (value: unknown): Player => isActivePlayerValue(value) ? value : 1;

const normalizeBoard = (value: unknown): Board => {
  if (!Array.isArray(value)) return createEmptyBoard();

  return Array.from({ length: ROWS }, (_, rowIndex) => {
    const row = value[rowIndex];
    return Array.from({ length: COLS }, (_, colIndex) => {
      const cell = Array.isArray(row) ? row[colIndex] : null;
      return isPlayerValue(cell) ? cell : null;
    });
  });
};

const normalizeCell = (value: unknown): [number, number] | null => {
  if (!Array.isArray(value) || value.length < 2) return null;
  const row = boundedInteger(value[0], -1, 0, ROWS - 1);
  const col = boundedInteger(value[1], -1, 0, COLS - 1);
  if (row < 0 || col < 0) return null;
  return [row, col];
};

const normalizeCellList = (value: unknown, maxLength = MAX_REMOTE_EFFECT_CELLS): [number, number][] => {
  if (!Array.isArray(value)) return [];

  const cells: [number, number][] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    const cell = normalizeCell(entry);
    if (!cell) continue;
    const key = `${cell[0]}:${cell[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cells.push(cell);
    if (cells.length >= maxLength) break;
  }
  return cells;
};

const normalizeWinningLine = (value: unknown): [number, number][] | null => {
  const line = normalizeCellList(value, 5);
  return line.length > 0 ? line : null;
};

const normalizeTimers = (value: unknown, fallback: PlayerTimers = { 1: 120, 2: 120 }): PlayerTimers => {
  const source = isRecord(value) ? value : {};
  return {
    1: boundedInteger(source['1'], fallback[1], 0, MAX_TIMER_SECONDS),
    2: boundedInteger(source['2'], fallback[2], 0, MAX_TIMER_SECONDS),
  };
};

const normalizeTimerDuration = (value: unknown, fallback = 120) => boundedInteger(value, fallback, 0, MAX_TIMER_SECONDS);

const normalizeMove = (value: unknown): Move | null => {
  if (!isRecord(value) || !isActivePlayerValue(value.player)) return null;
  const row = boundedInteger(value.row, -1, 0, ROWS - 1);
  const col = boundedInteger(value.col, -1, 0, COLS - 1);
  if (row < 0 || col < 0) return null;

  const move: Move = {
    row,
    col,
    player: value.player,
    timestamp: boundedInteger(value.timestamp, Date.now(), 0, Number.MAX_SAFE_INTEGER),
  };

  if (isTurnActionValue(value.action)) move.action = value.action;
  if (typeof value.label === 'string') move.label = value.label.slice(0, MAX_EFFECT_LABEL_LENGTH);
  if (isPowerValue(value.power)) move.power = value.power;
  return move;
};

const normalizeHistory = (value: unknown): Move[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeMove)
    .filter((move): move is Move => Boolean(move))
    .slice(-MAX_REMOTE_HISTORY_ENTRIES);
};

const normalizePlayerKeyedNumber = (value: unknown, player: 1 | 2, fallback: number, min: number, max: number) => {
  const source = isRecord(value) ? value : {};
  return boundedInteger(source[String(player)], fallback, min, max);
};

const normalizePlayerKeyedBoolean = (value: unknown, player: 1 | 2, fallback: boolean) => {
  const source = isRecord(value) ? value : {};
  return typeof source[String(player)] === 'boolean' ? source[String(player)] as boolean : fallback;
};

const normalizeBlockedColumn = (value: unknown) => {
  if (value === null) return null;
  const column = boundedInteger(value, -1, 0, COLS - 1);
  return column >= 0 ? column : null;
};

const normalizeVariantState = (value: unknown, fallbackFunMode: FunMode = 'classic'): VariantState => {
  const source = isRecord(value) ? value : {};
  const funMode = isFunModeValue(source.funMode) ? source.funMode : fallbackFunMode;
  const rawSettings = isRecord(source.settings) ? source.settings : {};
  const defaults = defaultVariantSettings();
  const settings: VariantSettings = {
    risingFloorInterval: boundedInteger(rawSettings.risingFloorInterval, defaults.risingFloorInterval, 2, 20),
    gravityShiftInterval: boundedInteger(rawSettings.gravityShiftInterval, defaults.gravityShiftInterval, 2, 20),
    wildCellCount: boundedInteger(rawSettings.wildCellCount, defaults.wildCellCount, 1, ROWS * COLS),
    bombsPerPlayer: boundedInteger(rawSettings.bombsPerPlayer, defaults.bombsPerPlayer, 0, 10),
    connectLength: boundedInteger(rawSettings.connectLength, defaults.connectLength, 4, Math.max(4, COLS)),
    dropsPerTurn: boundedInteger(rawSettings.dropsPerTurn, defaults.dropsPerTurn, 1, 3)
  };
  const base = defaultVariantState(funMode, settings);
  const blockedColumns = isRecord(source.blockedColumns) ? source.blockedColumns : {};
  const powerPreferences = isRecord(source.powerPreferences) ? source.powerPreferences : {};
  const powerSelections = isRecord(source.powerSelections) ? source.powerSelections : {};

  const preference1 = powerPreferences['1'];
  const preference2 = powerPreferences['2'];
  const selection1 = powerSelections['1'];
  const selection2 = powerSelections['2'];

  return {
    ...base,
    funMode,
    gravityDirection: isGravityDirectionValue(source.gravityDirection) ? source.gravityDirection : base.gravityDirection,
    wildCells: normalizeCellList(source.wildCells, MAX_REMOTE_EFFECT_CELLS).length > 0
      ? normalizeCellList(source.wildCells, MAX_REMOTE_EFFECT_CELLS)
      : funMode === 'wildColumn' ? createWildCells(settings.wildCellCount) : [],
    bombs: {
      1: normalizePlayerKeyedNumber(source.bombs, 1, base.bombs[1], 0, 10),
      2: normalizePlayerKeyedNumber(source.bombs, 2, base.bombs[2], 0, 10),
    },
    powerPreferences: {
      1: isPowerPreferenceValue(preference1) ? preference1 : base.powerPreferences[1],
      2: isPowerPreferenceValue(preference2) ? preference2 : base.powerPreferences[2],
    },
    powerSelections: {
      1: isPowerValue(selection1) ? selection1 : base.powerSelections[1],
      2: isPowerValue(selection2) ? selection2 : base.powerSelections[2],
    },
    powerUsed: {
      1: normalizePlayerKeyedBoolean(source.powerUsed, 1, base.powerUsed[1]),
      2: normalizePlayerKeyedBoolean(source.powerUsed, 2, base.powerUsed[2]),
    },
    blockedColumns: {
      1: normalizeBlockedColumn(blockedColumns['1']),
      2: normalizeBlockedColumn(blockedColumns['2']),
    },
    shieldCells: normalizeCellList(source.shieldCells, MAX_REMOTE_EFFECT_CELLS),
    risingTurnCount: boundedInteger(source.risingTurnCount, base.risingTurnCount, 0, MAX_REMOTE_HISTORY_ENTRIES),
    pendingDrops: boundedInteger(source.pendingDrops, base.pendingDrops, 1, 3),
  };
};

const normalizeRemovedCells = (value: unknown): { row: number; col: number; player: Player }[] => {
  if (!Array.isArray(value)) return [];

  const removed: { row: number; col: number; player: Player }[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || !isActivePlayerValue(entry.player)) continue;
    const row = boundedInteger(entry.row, -1, 0, ROWS - 1);
    const col = boundedInteger(entry.col, -1, 0, COLS - 1);
    if (row < 0 || col < 0) continue;
    removed.push({ row, col, player: entry.player });
    if (removed.length >= MAX_REMOTE_EFFECT_CELLS) break;
  }
  return removed;
};

const normalizeBoardEffect = (value: unknown): BoardEffect | null => {
  if (!isRecord(value) || !isActivePlayerValue(value.player)) return null;
  const type = value.type;
  if (
    type !== 'bomb' &&
    type !== 'popout' &&
    type !== 'risingFloor' &&
    type !== 'gravity' &&
    type !== 'power' &&
    type !== 'connect5'
  ) {
    return null;
  }

  const effect: BoardEffect = {
    id: boundedInteger(value.id, Date.now(), 0, Number.MAX_SAFE_INTEGER),
    type,
    label: typeof value.label === 'string' ? value.label.slice(0, MAX_EFFECT_LABEL_LENGTH) : type,
    player: value.player,
  };

  const cells = normalizeCellList(value.cells, MAX_REMOTE_EFFECT_CELLS);
  if (cells.length > 0) effect.cells = cells;

  const removed = normalizeRemovedCells(value.removed);
  if (removed.length > 0) effect.removed = removed;

  const protectedCells = normalizeCellList(value.protected, MAX_REMOTE_EFFECT_CELLS);
  if (protectedCells.length > 0) effect.protected = protectedCells;

  const landing = normalizeCell(value.landing);
  if (landing) effect.landing = landing;

  if (isGravityDirectionValue(value.direction)) effect.direction = value.direction;
  if (isPowerValue(value.power)) effect.power = value.power;
  return effect;
};

const normalizeGameSnapshot = (value: unknown): GameSnapshot | null => {
  if (!isRecord(value)) return null;
  const timerDuration = normalizeTimerDuration(value.timerDuration);
  const funMode = isRecord(value.variant) && isFunModeValue(value.variant.funMode) ? value.variant.funMode : 'classic';

  return {
    board: normalizeBoard(value.board),
    currentPlayer: normalizeCurrentPlayer(value.currentPlayer),
    gameActive: typeof value.gameActive === 'boolean' ? value.gameActive : true,
    winner: isWinnerValue(value.winner) ? value.winner : null,
    winningLine: normalizeWinningLine(value.winningLine),
    history: normalizeHistory(value.history),
    timers: normalizeTimers(value.timers, { 1: timerDuration, 2: timerDuration }),
    variant: normalizeVariantState(value.variant, funMode),
  };
};

const normalizeStateHistory = (value: unknown): GameSnapshot[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeGameSnapshot)
    .filter((snapshot): snapshot is GameSnapshot => Boolean(snapshot))
    .slice(-MAX_REMOTE_STATE_HISTORY_ENTRIES);
};

const normalizeIncomingGameState = (value: unknown): IncomingGameState | null => {
  if (!isRecord(value)) return null;

  const normalized: IncomingGameState = {};
  if (typeof value.id === 'string' && value.id.length <= 120) normalized.id = value.id;
  if (hasField(value, 'board')) normalized.board = normalizeBoard(value.board);
  if (hasField(value, 'currentPlayer')) normalized.currentPlayer = normalizeCurrentPlayer(value.currentPlayer);
  if (hasField(value, 'gameActive')) normalized.gameActive = typeof value.gameActive === 'boolean' ? value.gameActive : true;
  if (hasField(value, 'winner')) normalized.winner = isWinnerValue(value.winner) ? value.winner : null;
  if (hasField(value, 'winningLine')) normalized.winningLine = normalizeWinningLine(value.winningLine);
  if (hasField(value, 'history')) normalized.history = normalizeHistory(value.history);
  if (hasField(value, 'timers')) normalized.timers = normalizeTimers(value.timers);
  if (hasField(value, 'timerDuration')) normalized.timerDuration = normalizeTimerDuration(value.timerDuration);
  if (hasField(value, 'player2Joined')) normalized.player2Joined = Boolean(value.player2Joined);
  if (hasField(value, 'variant')) {
    const funMode = isRecord(value.variant) && isFunModeValue(value.variant.funMode) ? value.variant.funMode : 'classic';
    normalized.variant = normalizeVariantState(value.variant, funMode);
  }
  if (hasField(value, 'lastEffect')) normalized.lastEffect = normalizeBoardEffect(value.lastEffect);
  if (hasField(value, 'revision')) normalized.revision = boundedInteger(value.revision, 0, 0, Number.MAX_SAFE_INTEGER);
  if (hasField(value, 'updatedAt')) normalized.updatedAt = boundedInteger(value.updatedAt, 0, 0, Number.MAX_SAFE_INTEGER);

  const timerRecord = isRecord(value.timers) ? value.timers : null;
  if (timerRecord && timerRecord.p2Joined === true) normalized.player2Joined = true;

  return normalized;
};
const isShielded = (cells: [number, number][], row: number, col: number) => {
  return cells.some(([r, c]) => r === row && c === col);
};

const removeShield = (cells: [number, number][], row: number, col: number) => {
  return cells.filter(([r, c]) => r !== row || c !== col);
};

const firstOccupiedInColumn = (board: Board, col: number): [number, number] | null => {
  for (let r = 0; r < ROWS; r++) {
    if (board[r][col] !== null) return [r, col];
  }
  return null;
};

const hasAdjacentOwnDisc = (board: Board, row: number, col: number, player: Player) => {
  if (!player) return false;
  const offsets = [-1, 0, 1];
  return offsets.some(dr => offsets.some(dc => {
    if (dr === 0 && dc === 0) return false;
    const r = row + dr;
    const c = col + dc;
    return r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player;
  }));
};
type IdleStorageWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const scheduleIdleStorageWrite = (write: () => void) => {
  const idleWindow = window as IdleStorageWindow;
  if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
    const handle = idleWindow.requestIdleCallback(write, { timeout: 1200 });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(write, 160);
  return () => window.clearTimeout(handle);
};

const PLAYER_DROP_ANIMATION_MS = 650;
const isOnlineTestMode = process.env.NEXT_PUBLIC_ONLINE_TEST_MODE === 'true';

type TestOnlineRecord = Partial<OnlineGameState> & {
  id: string;
  variant?: VariantState;
  lastEffect?: BoardEffect;
  revision?: number;
  updatedAt?: number;
};

const testOnlinePost = async (path: string, body?: unknown): Promise<TestOnlineRecord> => {
  const response = await fetch(`/api/__test-online/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store'
  });

  if (!response.ok) throw new Error(`Test online ${path} failed with ${response.status}`);
  return response.json() as Promise<TestOnlineRecord>;
};

const testOnlineGet = async (path: string): Promise<TestOnlineRecord> => {
  const response = await fetch(`/api/__test-online/${path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Test online ${path} failed with ${response.status}`);
  return response.json() as Promise<TestOnlineRecord>;
};

export const useConnect4 = (defaultLanguage: AppLocale = 'en') => {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gameActive, setGameActive] = useState(true);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][] | null>(null);
  const [gameMode, setGameModeState] = useState<GameMode>('pve');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [history, setHistory] = useState<Move[]>([]);
  const [stateHistory, setStateHistory] = useState<GameSnapshot[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [timers, setTimers] = useState<{ 1: number; 2: number }>({ 1: 0, 2: 0 });
  const [timerDuration, setTimerDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<GameStats>({ redWins: 0, yellowWins: 0, draws: 0, totalGames: 0 });
  const [theme, setTheme] = useState({ red: '#ef4444', yellow: '#fbbf24' });
  const [language, setLanguage] = useState<AppLocale>(defaultLanguage);
  const [isTabletopMode, setIsTabletopMode] = useState(false);
  const [variant, setVariant] = useState<VariantState>(() => defaultVariantState());
  const [selectedAction, setSelectedAction] = useState<TurnAction>('drop');
  const [lastEffect, setLastEffect] = useState<BoardEffect | null>(null);

  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [onlinePlayerRole, setOnlinePlayerRole] = useState<Player>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const isOnline = gameMode === 'online';

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isAiThinkingRef = useRef(isAiThinking);
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const syncGameStateRef = useRef<any>(null);
  const onlineGameIdRef = useRef<string | null>(null);
  const isServerless = process.env.NEXT_PUBLIC_SERVERLESS !== 'false';
  const onlineSupportsVariants = isServerless || isOnlineTestMode;

  useEffect(() => {
    isAiThinkingRef.current = isAiThinking;
  }, [isAiThinking]);

  useEffect(() => {
    onlineGameIdRef.current = onlineGameId;
  }, [onlineGameId]);

  const gameStateRef = useRef({
    board,
    currentPlayer,
    gameActive,
    winner,
    winningLine,
    history,
    timers,
    timerDuration,
    variant
  });

  const snapshot = useCallback((): GameSnapshot => ({
    board: cloneBoard(board),
    currentPlayer,
    gameActive,
    winner,
    winningLine,
    history: [...history],
    timers: { ...timers },
    variant: cloneVariant(variant)
  }), [board, currentPlayer, gameActive, winner, winningLine, history, timers, variant]);

  const supportedFunMode = useCallback((mode: FunMode, targetGameMode = gameMode) => {
    if (mode === 'classic') return true;
    if (targetGameMode === 'pvp') return true;
    if (targetGameMode === 'online' && onlineSupportsVariants) return true;
    return false;
  }, [gameMode, onlineSupportsVariants]);

  const activeDirection = variant.funMode === 'gravity' ? variant.gravityDirection : 'down';
  const winLength = variant.funMode === 'connect5' ? variant.settings.connectLength : 4;
  const activeWildCells = variant.funMode === 'wildColumn' ? variant.wildCells : [];

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedStats = localStorage.getItem('connect4_stats');
      if (savedStats) setStats(JSON.parse(savedStats));

      const savedTheme = localStorage.getItem('connect4_theme');
      if (savedTheme) setTheme(JSON.parse(savedTheme));

      setLanguage(defaultLanguage);

      const savedTabletop = localStorage.getItem('connect4_tabletop_mode');
      if (savedTabletop) setIsTabletopMode(JSON.parse(savedTabletop));

      const savedGame = localStorage.getItem('connect4_current_game');
      if (savedGame) {
        try {
          const data = JSON.parse(savedGame) as unknown;
          if (!isRecord(data)) return;

          const savedGameMode = normalizeGameMode(data.gameMode);
          const rawVariant = isRecord(data.variant) ? data.variant : {};
          const savedFunMode = isFunModeValue(rawVariant.funMode) ? rawVariant.funMode : isFunModeValue(data.funMode) ? data.funMode : 'classic';
          const canRestoreFunMode = savedFunMode === 'classic' || savedGameMode === 'pvp' || (savedGameMode === 'online' && onlineSupportsVariants);
          const restoredMode = canRestoreFunMode ? savedFunMode : 'classic';
          const restoredTimerDuration = normalizeTimerDuration(data.timerDuration);
          const restoredVariant = normalizeVariantState(data.variant, restoredMode);
          if (rawVariant.wildColumn !== undefined && rawVariant.wildCells === undefined) {
            restoredVariant.wildCells = createWildCells(restoredVariant.settings.wildCellCount);
          }

          setBoard(normalizeBoard(data.board));
          setCurrentPlayer(normalizeCurrentPlayer(data.currentPlayer));
          setGameActive(typeof data.gameActive === 'boolean' ? data.gameActive : true);
          setWinner(isWinnerValue(data.winner) ? data.winner : null);
          setWinningLine(normalizeWinningLine(data.winningLine));
          setGameModeState(savedGameMode);
          setDifficulty(normalizeDifficulty(data.difficulty));
          setHistory(normalizeHistory(data.history));
          setStateHistory(normalizeStateHistory(data.stateHistory));
          setTimers(normalizeTimers(data.timers, { 1: restoredTimerDuration, 2: restoredTimerDuration }));
          setTimerDuration(restoredTimerDuration);
          setVariant(restoredVariant);
          setIsPaused(savedGameMode === 'online');
        } catch {
          localStorage.removeItem('connect4_current_game');
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [defaultLanguage, onlineSupportsVariants]);

  useEffect(() => {
    localStorage.setItem('connect4_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('connect4_theme', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('connect4_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('connect4_tabletop_mode', JSON.stringify(isTabletopMode));
  }, [isTabletopMode]);

  useEffect(() => {
    const currentGame = {
      board,
      currentPlayer,
      gameActive,
      winner,
      winningLine,
      gameMode,
      difficulty,
      history,
      stateHistory,
      timers,
      timerDuration,
      variant
    };

    return scheduleIdleStorageWrite(() => {
      localStorage.setItem('connect4_current_game', JSON.stringify(currentGame));
    });
  }, [board, currentPlayer, gameActive, winner, winningLine, gameMode, difficulty, history, stateHistory, timers, timerDuration, variant]);

  useEffect(() => {
    gameStateRef.current = {
      board,
      currentPlayer,
      gameActive,
      winner,
      winningLine,
      history,
      timers,
      timerDuration,
      variant
    };
  }, [board, currentPlayer, gameActive, winner, winningLine, history, timers, timerDuration, variant]);

  const broadcastState = useCallback((state: Partial<OnlineGameState>) => {
    if (isOnlineTestMode) {
      if (onlineGameId) {
        testOnlinePost('sync', { id: onlineGameId, state })
          .then(record => syncGameStateRef.current?.(record))
          .catch(() => reportOperationalError('online state update failed'));
      }
    } else if (isServerless) {
      if (connRef.current && connRef.current.open) connRef.current.send(state);
    } else if (onlineGameId) {
      const { variant: _variant, ...classicState } = state as Partial<OnlineGameState> & { variant?: VariantState };
      updateOnlineGame(onlineGameId, classicState).catch(() => reportOperationalError('online state update failed'));
    }
  }, [isServerless, onlineGameId]);

  const setGameMode = useCallback((mode: GameMode) => {
    setGameModeState(mode);
    trackAnalyticsEvent({ name: 'mode_selected', data: { mode } });
    if (!supportedFunMode(variant.funMode, mode)) {
      setVariant(prepareVariantForNewGame(variant, 'classic'));
      setSelectedAction('drop');
    }
  }, [supportedFunMode, variant]);

  const setFunMode = useCallback((mode: FunMode) => {
    if (!supportedFunMode(mode)) return;
    const savedSettings = readClientJson<Record<string, Partial<VariantSettings>>>(MODE_SETTINGS_STORAGE_KEY, {})[mode];
    const nextSettings = { ...variant.settings, ...savedSettings };
    const nextVariant = prepareVariantForNewGame(variant, mode, nextSettings);
    const newBoard = createEmptyBoard();
    const newTimers = { 1: timerDuration, 2: timerDuration };
    setVariant(nextVariant);
    setSelectedAction('drop');
    setLastEffect(null);
    setBoard(newBoard);
    setCurrentPlayer(1);
    setGameActive(true);
    setWinner(null);
    setWinningLine(null);
    setHistory([]);
    setStateHistory([]);
    setTimers(newTimers);
    if (isOnline && (onlineGameId || isServerless)) {
      broadcastState({
        board: newBoard,
        currentPlayer: 1,
        gameActive: true,
        winner: null,
        winningLine: null,
        history: [],
        timers: newTimers,
        variant: nextVariant
      });
    }
  }, [broadcastState, isOnline, isServerless, onlineGameId, supportedFunMode, timerDuration, variant]);

  useEffect(() => {
    if (gameMode !== 'online') {
      // The cleanup intentionally resets React state when leaving online mode.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOnlineGameId(null);
      setOnlinePlayerRole(null);
      setOpponentConnected(false);
      if (connRef.current) {
        connRef.current.close();
        connRef.current = null;
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    }
  }, [gameMode]);

  const applyOutcome = useCallback((
    nextBoard: Board,
    nextHistory: Move[],
    nextVariant: VariantState,
    movedPlayer: Player,
    nextCurrentPlayer: Player,
    previousSnapshot: GameSnapshot
  ) => {
    let newGameActive = true;
    let newWinner: Player | 'draw' | null = null;
    let newWinningLine: [number, number][] | null = null;

    const movedWin = checkWin(nextBoard, movedPlayer, nextVariant.funMode === 'connect5' ? nextVariant.settings.connectLength : 4, nextVariant.funMode === 'wildColumn' ? nextVariant.wildCells : null);
    const otherPlayer = movedPlayer === 1 ? 2 : 1;
    const otherWin = checkWin(nextBoard, otherPlayer, nextVariant.funMode === 'connect5' ? nextVariant.settings.connectLength : 4, nextVariant.funMode === 'wildColumn' ? nextVariant.wildCells : null);

    if (movedWin.win || otherWin.win) {
      newGameActive = false;
      newWinner = movedWin.win ? movedPlayer : otherPlayer;
      newWinningLine = movedWin.win ? movedWin.line : otherWin.line;
      setStats(prev => ({
        ...prev,
        redWins: newWinner === 1 ? prev.redWins + 1 : prev.redWins,
        yellowWins: newWinner === 2 ? prev.yellowWins + 1 : prev.yellowWins,
        totalGames: prev.totalGames + 1
      }));
    } else if (isBoardFull(nextBoard, nextVariant.funMode === 'gravity' ? nextVariant.gravityDirection : 'down')) {
      newGameActive = false;
      newWinner = 'draw';
      setStats(prev => ({ ...prev, draws: prev.draws + 1, totalGames: prev.totalGames + 1 }));
    }

    if (!newGameActive) {
      trackAnalyticsEvent({ name: 'game_end', data: { mode: gameMode, outcome: newWinner === 'draw' ? 'draw' : newWinner === 1 ? 'red' : 'yellow', variant: nextVariant.funMode } });
      nextVariant.pendingDrops = nextVariant.funMode === 'connect5' ? nextVariant.settings.dropsPerTurn : 1;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    setBoard(nextBoard);
    setHistory(nextHistory);
    setStateHistory(prev => [...prev, previousSnapshot]);
    setGameActive(newGameActive);
    setWinner(newWinner);
    setWinningLine(newWinningLine);
    setCurrentPlayer(newGameActive ? nextCurrentPlayer : movedPlayer);
    setVariant(nextVariant);

    if (isOnline && (onlineGameId || isServerless)) {
      broadcastState({
        board: nextBoard,
        currentPlayer: newGameActive ? nextCurrentPlayer : movedPlayer,
        gameActive: newGameActive,
        winner: newWinner,
        winningLine: newWinningLine,
        history: nextHistory,
        timers,
        variant: nextVariant
      } as Partial<OnlineGameState>);
    }
  }, [broadcastState, gameMode, isOnline, isServerless, onlineGameId, timers]);

  const finishTurnVariant = useCallback((nextVariant: VariantState, completedTurn: boolean): VariantState => {
    const changed = cloneVariant(nextVariant);
    if (!completedTurn) return changed;

    if (currentPlayer) changed.blockedColumns[currentPlayer] = null;

    if (changed.funMode === 'gravity') {
      const turnIndex = history.length + 1;
      if (turnIndex % changed.settings.gravityShiftInterval === 0) {
        const currentIndex = ['down', 'left', 'up', 'right'].indexOf(changed.gravityDirection);
        changed.gravityDirection = ['down', 'left', 'up', 'right'][(currentIndex + 1) % 4] as GravityDirection;
        setLastEffect({
          id: Date.now(),
          type: 'gravity',
          label: 'Gravity Shift',
          player: currentPlayer,
          direction: changed.gravityDirection
        });
      }
    }

    changed.pendingDrops = changed.funMode === 'connect5' ? changed.settings.dropsPerTurn : 1;
    return changed;
  }, [currentPlayer, history.length]);

  const makeMove = useCallback((line: number, options?: { allowDuringAiThinking?: boolean }) => {
    if (!gameActive || (!options?.allowDuringAiThinking && isAiThinkingRef.current) || isPaused || !currentPlayer) return;
    if (isOnline && currentPlayer !== onlinePlayerRole) return;
    if (variant.blockedColumns[currentPlayer] === line && selectedAction === 'drop') return;

    const previousSnapshot = snapshot();
    let nextBoard = cloneBoard(board);
    let nextVariant = cloneVariant(variant);
    let action: Move['action'] = selectedAction;
    let landing: [number, number] | null = null;
    let completedTurn = true;
    let label = '';
    let effect: BoardEffect | null = null;

    if (variant.funMode === 'popout' && selectedAction === 'popout') {
      const removedPlayer = nextBoard[ROWS - 1][line];
      const popped = popOutDisc(nextBoard, line, currentPlayer);
      if (!popped) return;
      nextBoard = popped;
      landing = [ROWS - 1, line];
      label = 'Pop-Out';
      effect = {
        id: Date.now(),
        type: 'popout',
        label,
        player: currentPlayer,
        landing,
        removed: removedPlayer ? [{ row: ROWS - 1, col: line, player: removedPlayer }] : []
      };
    } else if ((variant.funMode === 'bomb' && selectedAction === 'bomb') || (variant.funMode === 'powerup' && selectedAction === 'power' && variant.powerSelections[currentPlayer] === 'extraBomb' && !variant.powerUsed[currentPlayer])) {
      const position = getAvailablePosition(nextBoard, line, 'down');
      const hasBomb = variant.funMode === 'bomb' ? nextVariant.bombs[currentPlayer] > 0 : true;
      if (!position || !hasBomb) return;
      const [row, col] = position;
      const removed: { row: number; col: number; player: Player }[] = [];
      const protectedCells: [number, number][] = [];
      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
          if (r === row && c === col) continue;
          if (isShielded(nextVariant.shieldCells, r, c)) {
            protectedCells.push([r, c]);
            nextVariant.shieldCells = removeShield(nextVariant.shieldCells, r, c);
          } else {
            if (nextBoard[r][c]) removed.push({ row: r, col: c, player: nextBoard[r][c] });
            nextBoard[r][c] = null;
          }
        }
      }
      nextBoard[row][col] = currentPlayer;
      nextBoard = settleBoard(nextBoard, 'down');
      landing = [row, col];
      label = 'Bomb';
      action = 'bomb';
      if (variant.funMode === 'bomb') nextVariant.bombs[currentPlayer] -= 1;
      if (variant.funMode === 'powerup') nextVariant.powerUsed[currentPlayer] = true;
      effect = {
        id: Date.now(),
        type: 'bomb',
        label,
        player: currentPlayer,
        landing: [row, col],
        cells: [[row, col]],
        removed,
        protected: protectedCells,
        power: variant.funMode === 'powerup' ? 'extraBomb' : undefined
      };
      setSelectedAction('drop');
    } else if (variant.funMode === 'powerup' && selectedAction === 'power') {
      const power = variant.powerSelections[currentPlayer];
      if (variant.powerUsed[currentPlayer]) return;

      if (power === 'doubleDrop') {
        nextVariant.powerUsed[currentPlayer] = true;
        nextVariant.pendingDrops = nextVariant.settings.dropsPerTurn;
        const doubleDropEffect: BoardEffect = {
          id: Date.now(),
          type: 'power',
          label: 'Double Drop',
          player: currentPlayer,
          cells: Array.from({ length: COLS }, (_, col) => [ROWS - 1, col] as [number, number]),
          power
        };
        setVariant(nextVariant);
        setLastEffect(doubleDropEffect);
        if (isOnline && isServerless) broadcastState({ lastEffect: doubleDropEffect } as Partial<OnlineGameState>);
        setSelectedAction('drop');
        return;
      }

      if (power === 'columnLock') {
        const opponent = currentPlayer === 1 ? 2 : 1;
        nextVariant.blockedColumns[opponent] = line;
        nextVariant.powerUsed[currentPlayer] = true;
        landing = [0, line];
        label = 'Column Lock';
        effect = { id: Date.now(), type: 'power', label, player: currentPlayer, cells: Array.from({ length: ROWS }, (_, row) => [row, line] as [number, number]), power };
      } else if (power === 'clearTop') {
        const target = firstOccupiedInColumn(nextBoard, line);
        if (!target) return;
        const [row, col] = target;
        const removedPlayer = nextBoard[row][col];
        if (isShielded(nextVariant.shieldCells, row, col)) {
          nextVariant.shieldCells = removeShield(nextVariant.shieldCells, row, col);
          effect = { id: Date.now(), type: 'power', label: 'Shielded', player: currentPlayer, protected: [[row, col]], power };
        } else {
          nextBoard[row][col] = null;
          nextBoard = settleBoard(nextBoard, 'down');
          effect = { id: Date.now(), type: 'power', label: 'Clear Top', player: currentPlayer, removed: [{ row, col, player: removedPlayer }], power };
        }
        nextVariant.powerUsed[currentPlayer] = true;
        landing = [row, col];
        label = 'Clear Top';
      } else {
        return;
      }
      setSelectedAction('drop');
    } else {
      const direction = variant.funMode === 'gravity' ? variant.gravityDirection : 'down';
      const position = getAvailablePosition(nextBoard, line, direction);
      if (!position) return;
      landing = position;
      nextBoard[landing[0]][landing[1]] = currentPlayer;
      label = variant.funMode === 'connect5' ? 'Drop ' + (variant.settings.dropsPerTurn - variant.pendingDrops + 1) + '/' + variant.settings.dropsPerTurn : 'Drop';
      if (variant.funMode === 'connect5' && variant.pendingDrops > 1) {
        completedTurn = false;
        nextVariant.pendingDrops -= 1;
        effect = { id: Date.now(), type: 'connect5', label: 'Drop ' + (variant.settings.dropsPerTurn - variant.pendingDrops + 1) + '/' + variant.settings.dropsPerTurn, player: currentPlayer, landing };
      } else if (variant.funMode === 'connect5') {
        effect = { id: Date.now(), type: 'connect5', label: 'Drop ' + variant.settings.dropsPerTurn + '/' + variant.settings.dropsPerTurn, player: currentPlayer, landing };
      }
    }

    if (!landing) return;

    if (completedTurn && variant.funMode === 'risingFloor') {
      nextVariant.risingTurnCount += 1;
      if (nextVariant.risingTurnCount >= nextVariant.settings.risingFloorInterval) {
        const removed = nextBoard[ROWS - 1]
          .map((player, col) => ({ row: ROWS - 1, col, player }))
          .filter(cell => cell.player !== null);
        nextBoard = removeBottomRow(nextBoard);
        nextVariant.risingTurnCount = 0;
        effect = {
          id: Date.now(),
          type: 'risingFloor',
          label: 'Rising Floor',
          player: currentPlayer,
          cells: Array.from({ length: COLS }, (_, col) => [ROWS - 1, col] as [number, number]),
          removed
        };
      }
    }

    const nextPlayer = completedTurn ? (currentPlayer === 1 ? 2 : 1) : currentPlayer;
    if (completedTurn) nextVariant = finishTurnVariant(nextVariant, true);

    const move: Move = {
      row: landing[0],
      col: landing[1],
      player: currentPlayer,
      timestamp: Date.now(),
      action,
      label,
      power: action === 'power' ? variant.powerSelections[currentPlayer] : undefined
    };

    if (effect) {
      setLastEffect(effect);
      if (isOnline && isServerless) broadcastState({ lastEffect: effect } as Partial<OnlineGameState>);
    }
    applyOutcome(nextBoard, [...history, move], nextVariant, currentPlayer, nextPlayer, previousSnapshot);
  }, [applyOutcome, board, broadcastState, currentPlayer, finishTurnVariant, gameActive, history, isOnline, isPaused, isServerless, onlinePlayerRole, selectedAction, snapshot, variant]);

  const makeCellAction = useCallback((row: number, col: number) => {
    if (!gameActive || isAiThinkingRef.current || isPaused || !currentPlayer) return;
    if (isOnline && currentPlayer !== onlinePlayerRole) return;
    if (variant.funMode !== 'powerup' || selectedAction !== 'power' || variant.powerUsed[currentPlayer]) return;

    const previousSnapshot = snapshot();
    let nextBoard = cloneBoard(board);
    const nextVariant = cloneVariant(variant);
    const power = variant.powerSelections[currentPlayer];
    let label = '';
    let effect: BoardEffect | null = null;

    if (power === 'airDrop') {
      const supported = row === ROWS - 1 || nextBoard[row + 1][col] !== null;
      if (nextBoard[row][col] !== null || !supported) return;
      nextBoard[row][col] = currentPlayer;
      label = 'Air Drop';
      effect = { id: Date.now(), type: 'power', label, player: currentPlayer, landing: [row, col], power };
    } else if (power === 'shield') {
      if (nextBoard[row][col] !== currentPlayer || isShielded(nextVariant.shieldCells, row, col)) return;
      nextVariant.shieldCells.push([row, col]);
      label = 'Shield';
      effect = { id: Date.now(), type: 'power', label, player: currentPlayer, protected: [[row, col]], power };
    } else if (power === 'colorFlip') {
      const opponent = currentPlayer === 1 ? 2 : 1;
      if (nextBoard[row][col] !== opponent || !hasAdjacentOwnDisc(nextBoard, row, col, currentPlayer)) return;
      nextBoard[row][col] = currentPlayer;
      label = 'Color Flip';
      effect = { id: Date.now(), type: 'power', label, player: currentPlayer, cells: [[row, col]], landing: [row, col], power };
    } else if (power === 'swapPair') {
      const candidates: [number, number][] = [[row, col + 1], [row, col - 1], [row + 1, col], [row - 1, col]];
      const target = candidates.find(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS && nextBoard[row][col] !== null && nextBoard[r][c] !== null);
      if (!target) return;
      const [tr, tc] = target;
      const temp = nextBoard[row][col];
      nextBoard[row][col] = nextBoard[tr][tc];
      nextBoard[tr][tc] = temp;
      label = 'Swap Pair';
      effect = { id: Date.now(), type: 'power', label, player: currentPlayer, cells: [[row, col], [tr, tc]], power };
    } else {
      return;
    }

    nextVariant.powerUsed[currentPlayer] = true;
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    const move: Move = {
      row,
      col,
      player: currentPlayer,
      timestamp: Date.now(),
      action: 'power',
      label,
      power
    };
    setSelectedAction('drop');
    if (effect) {
      setLastEffect(effect);
      if (isOnline && isServerless) broadcastState({ lastEffect: effect } as Partial<OnlineGameState>);
    }
    applyOutcome(nextBoard, [...history, move], finishTurnVariant(nextVariant, true), currentPlayer, nextPlayer, previousSnapshot);
  }, [applyOutcome, board, broadcastState, currentPlayer, finishTurnVariant, gameActive, history, isOnline, isPaused, isServerless, onlinePlayerRole, selectedAction, snapshot, variant]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (timerDuration === 0 || !gameActive || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimers(prev => {
        const newTime = prev[currentPlayer as 1 | 2] - 1;
        if (newTime <= 0) {
          stopTimer();
          setGameActive(false);
          const timeoutWinner = currentPlayer === 1 ? 2 : 1;
          setWinner(timeoutWinner);
          trackAnalyticsEvent({ name: 'game_end', data: { mode: gameMode, outcome: timeoutWinner === 1 ? 'red' : 'yellow', variant: variant.funMode } });
          return { ...prev, [currentPlayer as 1 | 2]: 0 };
        }
        return { ...prev, [currentPlayer as 1 | 2]: newTime };
      });
    }, 1000);
  }, [currentPlayer, gameActive, gameMode, isPaused, timerDuration, stopTimer, variant.funMode]);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  useEffect(() => {
    if (!gameActive || gameMode !== 'pve' || currentPlayer !== 2 || isAiThinkingRef.current) return;

    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    const thinkingTimer = setTimeout(() => {
      setIsAiThinking(true);
      moveTimer = setTimeout(() => {
        const bestMove = getBestMove(board, 2, difficulty);
        if (bestMove !== -1) makeMove(bestMove, { allowDuringAiThinking: true });
        setIsAiThinking(false);
      }, 180);
    }, PLAYER_DROP_ANIMATION_MS);

    return () => {
      clearTimeout(thinkingTimer);
      if (moveTimer) clearTimeout(moveTimer);
    };
  }, [board, currentPlayer, difficulty, gameActive, gameMode, makeMove]);

  const resetGame = useCallback(() => {
    const newBoard = createEmptyBoard();
    const newTimers = { 1: timerDuration, 2: timerDuration };
    const nextVariant = prepareVariantForNewGame(variant, variant.funMode);

    setBoard(newBoard);
    setCurrentPlayer(1);
    setGameActive(true);
    setWinner(null);
    setWinningLine(null);
    setHistory([]);
    setStateHistory([]);
    setTimers(newTimers);
    setVariant(nextVariant);
    setSelectedAction('drop');
    setLastEffect(null);
    setIsPaused(isOnline && !opponentConnected);
    trackAnalyticsEvent({ name: 'game_start', data: { mode: gameMode, timer: timerDuration === 0 ? 'unlimited' : 'timed', variant: nextVariant.funMode } });
    setIsAiThinking(false);

    if (isOnline && (onlineGameId || isServerless)) {
      broadcastState({
        board: newBoard,
        currentPlayer: 1,
        gameActive: true,
        winner: null,
        winningLine: null,
        history: [],
        timers: newTimers,
        variant: nextVariant
      } as Partial<OnlineGameState>);
    }
  }, [broadcastState, gameMode, isOnline, isServerless, onlineGameId, opponentConnected, timerDuration, variant]);

  const restoreSnapshot = useCallback((snap: GameSnapshot) => {
    setBoard(cloneBoard(snap.board));
    setCurrentPlayer(snap.currentPlayer);
    setGameActive(snap.gameActive);
    setWinner(snap.winner);
    setWinningLine(snap.winningLine);
    setHistory([...snap.history]);
    setTimers({ ...snap.timers });
    setVariant(cloneVariant(snap.variant));
    setSelectedAction('drop');
    setLastEffect(null);
  }, []);

  const undoMove = useCallback(() => {
    if (stateHistory.length === 0 || isAiThinking) return;
    const previous = stateHistory[stateHistory.length - 1];
    restoreSnapshot(previous);
    const nextStateHistory = stateHistory.slice(0, -1);
    setStateHistory(nextStateHistory);

    if (isOnline && (onlineGameId || isServerless)) {
      broadcastState({
        board: previous.board,
        history: previous.history,
        currentPlayer: previous.currentPlayer,
        gameActive: previous.gameActive,
        winner: previous.winner,
        winningLine: previous.winningLine,
        variant: previous.variant
      } as Partial<OnlineGameState>);
    }
  }, [broadcastState, isAiThinking, isOnline, isServerless, onlineGameId, restoreSnapshot, stateHistory]);

  const jumpToMove = useCallback((index: number) => {
    if (index < 0 || index >= history.length) return;
    const snap = stateHistory[index + 1] || snapshot();
    restoreSnapshot(snap);
    setStateHistory(stateHistory.slice(0, index + 1));
  }, [history.length, restoreSnapshot, snapshot, stateHistory]);

  const handleSetTimerDuration = useCallback((duration: number) => {
    setTimerDuration(duration);
    if (isOnline && (onlineGameId || isServerless)) {
      broadcastState({ timerDuration: duration, timers: { 1: duration, 2: duration } });
    }
  }, [broadcastState, isOnline, isServerless, onlineGameId]);

  const setVariantSettings = useCallback((settings: Partial<VariantSettings>) => {
    const nextSettings = { ...variant.settings, ...settings };
    const savedSettings = readClientJson<Record<string, Partial<VariantSettings>>>(MODE_SETTINGS_STORAGE_KEY, {});
    writeClientJson(MODE_SETTINGS_STORAGE_KEY, { ...savedSettings, [variant.funMode]: nextSettings });
    const nextVariant = prepareVariantForNewGame(variant, variant.funMode, nextSettings);
    setVariant(nextVariant);
    setSelectedAction('drop');
    setLastEffect(null);
    setBoard(createEmptyBoard());
    setCurrentPlayer(1);
    setGameActive(true);
    setWinner(null);
    setWinningLine(null);
    setHistory([]);
    setStateHistory([]);
    setTimers({ 1: timerDuration, 2: timerDuration });
  }, [timerDuration, variant]);

  const setPlayerPower = useCallback((player: 1 | 2, power: PowerPreference) => {
    const nextVariant = {
      ...variant,
      powerPreferences: {
        ...variant.powerPreferences,
        [player]: power
      },
      powerSelections: {
        ...variant.powerSelections,
        [player]: resolvePower(power)
      },
      powerUsed: { ...variant.powerUsed, [player]: false }
    };
    setVariant(nextVariant);
    if (isOnline && (onlineGameId || isServerless)) {
      broadcastState({ variant: nextVariant });
    }
  }, [broadcastState, isOnline, isServerless, onlineGameId, variant]);

  const startOnlineGame = async () => {
    try {
      trackAnalyticsEvent({ name: 'online_match_created' });
      const nextVariant = onlineSupportsVariants ? prepareVariantForNewGame(variant, variant.funMode) : defaultVariantState('classic');
      const initialState: Partial<OnlineGameState> = {
        board: createEmptyBoard(),
        currentPlayer: 1,
        gameActive: true,
        winner: null,
        winningLine: null,
        history: [],
        player2Joined: false,
        timers: { 1: timerDuration, 2: timerDuration },
        timerDuration,
        ...(onlineSupportsVariants ? { variant: nextVariant } : {})
      } as Partial<OnlineGameState>;

      if (isOnlineTestMode) {
        const record = await testOnlinePost('create', { state: initialState });
        setOnlineGameId(record.id);
        setOnlinePlayerRole(1);
        setGameModeState('online');
        setOpponentConnected(false);
        setIsPaused(true);
        setBoard(initialState.board!);
        setCurrentPlayer(1);
        setGameActive(true);
        setWinner(null);
        setWinningLine(null);
        setHistory([]);
        setStateHistory([]);
        setTimers(initialState.timers!);
        setVariant(nextVariant);
        setLastEffect(null);
        return record.id;
      }

      if (isServerless) {
        const { default: Peer } = await import('peerjs');
        const peer = new Peer();
        peerRef.current = peer;

        return new Promise<string | null>((resolve) => {
          peer.on('open', (id) => {
            setOnlineGameId(id);
            setOnlinePlayerRole(1);
            setGameModeState('online');
            setOpponentConnected(false);
            setIsPaused(true);
            setBoard(initialState.board!);
            setCurrentPlayer(1);
            setGameActive(true);
            setWinner(null);
            setWinningLine(null);
            setHistory([]);
            setStateHistory([]);
            setTimers(initialState.timers!);
            setVariant(nextVariant);
            setLastEffect(null);

            peer.on('connection', (conn) => {
              if (connRef.current?.open) {
                conn.close();
                return;
              }

              connRef.current = conn;
              conn.on('open', () => {
                setOpponentConnected(true);
                setIsPaused(false);
                const currentState = gameStateRef.current;
                conn.send({
                  ...currentState,
                  timerDuration: currentState.timerDuration,
                  player2Joined: true,
                  timers: { ...(currentState.timers || {}), p2Joined: true }
                });
              });
              conn.on('data', (data: any) => {
                if (syncGameStateRef.current) syncGameStateRef.current(data);
              });
              conn.on('close', () => {
                setOpponentConnected(false);
                setIsPaused(true);
              });
            });

            resolve(id);
          });

          peer.on('error', (err) => {
            reportOperationalError('PeerJS start failed');
            resolve(null);
          });
        });
      }

      const record = await createOnlineGame(initialState);
      setOnlineGameId(record.id);
      setOnlinePlayerRole(1);
      setGameModeState('online');
      setOpponentConnected(false);
      setIsPaused(true);
      setBoard(initialState.board!);
      setCurrentPlayer(1);
      setGameActive(true);
      setWinner(null);
      setWinningLine(null);
      setHistory([]);
      setStateHistory([]);
      setTimers(initialState.timers!);
      setVariant(defaultVariantState('classic'));
      setLastEffect(null);

      return record.id;
    } catch (error) {
      reportOperationalError('Online game start failed');
      return null;
    }
  };

  const joinOnlineGame = async (id: string) => {
    try {
      trackAnalyticsEvent({ name: 'online_match_joined' });

      if (isOnlineTestMode) {
        const record = await testOnlinePost('join', { id });
        setOnlineGameId(id);
        setOnlinePlayerRole(2);
        setGameModeState('online');
        setOpponentConnected(true);
        setIsPaused(false);
        const normalizedRecord = normalizeIncomingGameState(record);
        if (!normalizedRecord) return false;
        const joinedTimerDuration = normalizedRecord.timerDuration ?? timerDuration;
        setBoard(normalizedRecord.board ?? createEmptyBoard());
        setCurrentPlayer(normalizedRecord.currentPlayer ?? 1);
        setGameActive(normalizedRecord.gameActive ?? true);
        setWinner(normalizedRecord.winner ?? null);
        setWinningLine(normalizedRecord.winningLine ?? null);
        setHistory(normalizedRecord.history ?? []);
        setStateHistory([]);
        setTimers(normalizedRecord.timers ?? { 1: joinedTimerDuration, 2: joinedTimerDuration });
        if (normalizedRecord.timerDuration !== undefined) setTimerDuration(normalizedRecord.timerDuration);
        setVariant(onlineSupportsVariants && normalizedRecord.variant ? normalizedRecord.variant : defaultVariantState('classic'));
        return true;
      }

      if (isServerless) {
        const { default: Peer } = await import('peerjs');
        const peer = new Peer();
        peerRef.current = peer;

        return new Promise<boolean>((resolve) => {
          peer.on('open', () => {
            const conn = peer.connect(id, { reliable: true });
            connRef.current = conn;

            conn.on('open', () => {
              setOnlineGameId(id);
              setOnlinePlayerRole(2);
              setGameModeState('online');
              setOpponentConnected(true);
              setIsPaused(false);
              resolve(true);
            });

            conn.on('data', (data: any) => {
              if (syncGameStateRef.current) syncGameStateRef.current(data);
            });

            conn.on('close', () => {
              setOpponentConnected(false);
              setIsPaused(true);
            });

            peer.on('error', (err) => {
              reportOperationalError('PeerJS join failed');
              resolve(false);
            });
          });
        });
      }

      const record = await getOnlineGame(id);
      if (!record) return false;
      const normalizedRecord = normalizeIncomingGameState(record);
      if (!normalizedRecord) return false;
      const isFull = normalizedRecord.player2Joined;
      if (isFull) return false;

      await updateOnlineGame(id, {
        player2Joined: true,
        timers: { ...(normalizedRecord.timers || { 1: timerDuration, 2: timerDuration }), p2Joined: true } as PlayerTimers & { p2Joined: true }
      });

      const joinedTimerDuration = normalizedRecord.timerDuration ?? timerDuration;
      setOnlineGameId(id);
      setOnlinePlayerRole(2);
      setGameModeState('online');
      setOpponentConnected(true);
      setIsPaused(false);
      setBoard(normalizedRecord.board ?? createEmptyBoard());
      setCurrentPlayer(normalizedRecord.currentPlayer ?? 1);
      setGameActive(normalizedRecord.gameActive ?? true);
      setWinner(normalizedRecord.winner ?? null);
      setWinningLine(normalizedRecord.winningLine ?? null);
      setHistory(normalizedRecord.history ?? []);
      setStateHistory([]);
      setTimers(normalizedRecord.timers ?? { 1: joinedTimerDuration, 2: joinedTimerDuration });
      if (normalizedRecord.timerDuration !== undefined) setTimerDuration(normalizedRecord.timerDuration);
      setVariant(defaultVariantState('classic'));

      return true;
    } catch (error) {
      reportOperationalError('Online game join failed');
      return false;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let removeAppUrlListener: (() => void) | null = null;
    let cancelled = false;

    const joinFromInviteUrl = (url: string) => {
      const gameId = parseInviteGameCode(url);
      if (!gameId || onlineGameIdRef.current === gameId) return;

      setGameModeState('online');
      void joinOnlineGame(gameId);
    };

    joinFromInviteUrl(window.location.href);

    void import('@capacitor/app')
      .then(async ({ App }) => {
        const launchUrl = await App.getLaunchUrl();
        if (!cancelled && launchUrl?.url) joinFromInviteUrl(launchUrl.url);

        const listener = await App.addListener('appUrlOpen', ({ url }) => {
          joinFromInviteUrl(url);
        });

        if (cancelled) {
          void listener.remove();
          return;
        }

        removeAppUrlListener = () => {
          void listener.remove();
        };
      })
      .catch(() => {
        // Capacitor App is unavailable in the regular browser build.
      });

    return () => {
      cancelled = true;
      removeAppUrlListener?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncGameState = useCallback((record: unknown) => {
    const normalizedRecord = normalizeIncomingGameState(record);
    if (!normalizedRecord) return;

    if (onlinePlayerRole === 1 && normalizedRecord.player2Joined) {
      setOpponentConnected(true);
      setIsPaused(false);
    }

    const recordHistoryLength = normalizedRecord.history?.length ?? gameStateRef.current.history.length;
    const hasStateChange =
      normalizedRecord.board !== undefined ||
      normalizedRecord.currentPlayer !== undefined ||
      normalizedRecord.gameActive !== undefined ||
      normalizedRecord.winner !== undefined ||
      normalizedRecord.winningLine !== undefined ||
      normalizedRecord.history !== undefined ||
      recordHistoryLength !== gameStateRef.current.history.length;

    if (hasStateChange) {
      setBoard(normalizedRecord.board ?? gameStateRef.current.board);
      setCurrentPlayer(normalizedRecord.currentPlayer ?? gameStateRef.current.currentPlayer);
      setGameActive(normalizedRecord.gameActive ?? gameStateRef.current.gameActive);
      setWinner(normalizedRecord.winner ?? gameStateRef.current.winner);
      setWinningLine(normalizedRecord.winningLine ?? gameStateRef.current.winningLine);
      setHistory(normalizedRecord.history ?? gameStateRef.current.history);
      if (normalizedRecord.timers) setTimers(normalizedRecord.timers);
      if (normalizedRecord.variant && onlineSupportsVariants) setVariant(normalizedRecord.variant);
    }

    if (normalizedRecord.lastEffect && onlineSupportsVariants) setLastEffect(normalizedRecord.lastEffect);

    if (normalizedRecord.timerDuration !== undefined && normalizedRecord.timerDuration !== gameStateRef.current.timerDuration) {
      setTimerDuration(normalizedRecord.timerDuration);
      if (normalizedRecord.timers) setTimers(normalizedRecord.timers);
    }
  }, [onlinePlayerRole, onlineSupportsVariants]);

  useEffect(() => {
    syncGameStateRef.current = syncGameState;
  }, [syncGameState]);

  useEffect(() => {
    if (!lastEffect) return;
    const timer = setTimeout(() => setLastEffect(null), 1600);
    return () => clearTimeout(timer);
  }, [lastEffect]);

  useEffect(() => {
    if (!onlineGameId) return;

    if (isOnlineTestMode) {
      const pollState = async () => {
        try {
          const record = await testOnlineGet(`state?id=${encodeURIComponent(onlineGameId)}`);
          syncGameState(record);
        } catch (error) {
          reportOperationalError('Test online polling failed');
        }
      };
      pollState();
      const pollInterval = setInterval(pollState, 250);
      return () => clearInterval(pollInterval);
    }

    if (isServerless) return;
    const unsubscribe = subscribeToGame(onlineGameId, syncGameState);
    const pollInterval = setInterval(async () => {
      try {
        const record = await getOnlineGame(onlineGameId);
        if (record) syncGameState(record);
      } catch (error) {
        reportOperationalError('Online polling failed');
      }
    }, 1500);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [onlineGameId, onlinePlayerRole, isServerless, syncGameState]);

  return {
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
    funMode: variant.funMode,
    variant,
    selectedAction,
    activeDirection,
    winLength,
    activeWildCells,
    lastEffect,
    canUseFunModes: gameMode === 'pvp' || (gameMode === 'online' && onlineSupportsVariants),
    setGameMode,
    setDifficulty,
    setTimerDuration: handleSetTimerDuration,
    setIsPaused,
    setTheme,
    setLanguage,
    setIsTabletopMode,
    setFunMode,
    setSelectedAction,
    setPlayerPower,
    setVariantSettings,
    makeMove,
    makeCellAction,
    resetGame,
    undoMove,
    jumpToMove,
    startOnlineGame,
    joinOnlineGame
  };
};
