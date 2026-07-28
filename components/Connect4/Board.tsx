'use client';

import { memo, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Board,
  COLS,
  FunMode,
  GravityDirection,
  Player,
  ROWS,
  cloneBoard,
  getAvailablePosition,
  popOutDisc,
  removeBottomRow,
  settleBoard
} from '@/lib/connect4-logic';
import { cn } from '@/lib/utils';
import type { BoardEffect, VariantState } from '@/hooks/use-connect4';
import type { TranslationStrings } from '@/lib/translations';
import { Piece } from './Piece';

type PreviewType = 'drop' | 'popout' | 'bomb' | 'power' | 'risingFloor' | 'connect5' | 'illegal';
type PreviewTarget = { kind: 'line'; index: number } | { kind: 'cell'; row: number; col: number };

interface BoardPreview {
  type: PreviewType;
  label: string;
  landing?: [number, number] | null;
  affectedCells: [number, number][];
  removedCells: { row: number; col: number; player: Player }[];
  protectedCells: [number, number][];
  settledBoard?: Board;
  isLegal: boolean;
  reason?: string;
  target: PreviewTarget;
}

interface BoardProps {
  board: Board;
  onMove: (line: number) => void;
  onCellAction?: (row: number, col: number) => void;
  gameActive: boolean;
  currentPlayer: Player;
  winningLine: [number, number][] | null;
  isAiThinking: boolean;
  theme: { red: string; yellow: string };
  isPaused?: boolean;
  isDarkMode?: boolean;
  isTabletopMode?: boolean;
  funMode?: FunMode;
  selectedAction?: string;
  activeDirection?: GravityDirection;
  variant: VariantState;
  wildCells?: [number, number][];
  wildAccentColor?: string;
  shieldCells?: [number, number][];
  lastEffect?: BoardEffect | null;
  t: TranslationStrings;
}

const sameTarget = (a: PreviewTarget | null, b: PreviewTarget) => {
  if (!a || a.kind !== b.kind) return false;
  return a.kind === 'line' ? a.index === (b as { kind: 'line'; index: number }).index : a.row === (b as { kind: 'cell'; row: number; col: number }).row && a.col === (b as { kind: 'cell'; row: number; col: number }).col;
};

const hasCell = (cells: [number, number][], row: number, col: number) => {
  return cells.some(([r, c]) => r === row && c === col);
};

const firstOccupiedInColumn = (board: Board, col: number): [number, number] | null => {
  for (let row = 0; row < ROWS; row++) {
    if (board[row][col] !== null) return [row, col];
  }
  return null;
};

const hasAdjacentOwnDisc = (board: Board, row: number, col: number, player: Player) => {
  if (!player) return false;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) return true;
    }
  }
  return false;
};

const makeIllegalPreview = (target: PreviewTarget, label: string, reason: string): BoardPreview => ({
  type: 'illegal',
  label,
  reason,
  target,
  landing: null,
  affectedCells: [],
  removedCells: [],
  protectedCells: [],
  isLegal: false
});

const computeLinePreview = (
  board: Board,
  variant: VariantState,
  currentPlayer: Player,
  selectedAction: string,
  line: number,
  t: TranslationStrings
): BoardPreview => {
  const target: PreviewTarget = { kind: 'line', index: line };
  if (!currentPlayer) return makeIllegalPreview(target, t.preview || 'Preview', t.previewIllegal || 'Not a legal move');
  const illegalLabel = t.previewIllegal || 'Not a legal move';

  if (variant.blockedColumns[currentPlayer] === line && selectedAction === 'drop') {
    return makeIllegalPreview(target, illegalLabel, t.previewColumnLocked || 'This column is locked');
  }

  if (variant.funMode === 'popout' && selectedAction === 'popout') {
    const removedPlayer = board[ROWS - 1][line];
    const popped = popOutDisc(board, line, currentPlayer);
    if (!popped) return makeIllegalPreview(target, t.popOutAction || 'Pop Out', t.previewOwnBottomOnly || 'Only your own bottom disc can pop out');
    return {
      type: 'popout',
      label: t.popOutAction || 'Pop Out',
      target,
      landing: [ROWS - 1, line],
      affectedCells: Array.from({ length: ROWS }, (_, row) => [row, line] as [number, number]),
      removedCells: removedPlayer ? [{ row: ROWS - 1, col: line, player: removedPlayer }] : [],
      protectedCells: [],
      settledBoard: popped,
      isLegal: true
    };
  }

  const selectedPower = currentPlayer ? variant.powerSelections[currentPlayer] : null;
  const usesBomb = (variant.funMode === 'bomb' && selectedAction === 'bomb') || (variant.funMode === 'powerup' && selectedAction === 'power' && selectedPower === 'extraBomb' && currentPlayer && !variant.powerUsed[currentPlayer]);
  if (usesBomb) {
    const position = getAvailablePosition(board, line, 'down');
    const hasBomb = variant.funMode === 'bomb' ? currentPlayer && variant.bombs[currentPlayer] > 0 : true;
    if (!position || !hasBomb) return makeIllegalPreview(target, t.bombAction || 'Bomb', !hasBomb ? (t.previewNoBombs || 'No bombs left') : (t.previewLineFull || 'This line is full'));
    const [row, col] = position;
    const nextBoard = cloneBoard(board);
    const affectedCells: [number, number][] = [];
    const removedCells: { row: number; col: number; player: Player }[] = [];
    const protectedCells: [number, number][] = [];
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        affectedCells.push([r, c]);
        if (r === row && c === col) continue;
        if (hasCell(variant.shieldCells, r, c)) protectedCells.push([r, c]);
        else if (nextBoard[r][c]) removedCells.push({ row: r, col: c, player: nextBoard[r][c] });
      }
    }
    nextBoard[row][col] = currentPlayer;
    return {
      type: 'bomb',
      label: t.bombAction || 'Bomb',
      target,
      landing: [row, col],
      affectedCells,
      removedCells,
      protectedCells,
      settledBoard: settleBoard(nextBoard, 'down'),
      isLegal: true
    };
  }

  if (variant.funMode === 'powerup' && selectedAction === 'power') {
    if (!selectedPower || variant.powerUsed[currentPlayer]) return makeIllegalPreview(target, t.usePower || 'Use Power', t.powerUsed || 'Power used');
    if (selectedPower === 'doubleDrop') {
      const landing = getAvailablePosition(board, line, 'down');
      return {
        type: 'power',
        label: t.doubleDrop || 'Double Drop',
        target,
        landing,
        affectedCells: landing ? [landing] : [],
        removedCells: [],
        protectedCells: [],
        isLegal: true
      };
    }
    if (selectedPower === 'columnLock') {
      return {
        type: 'power',
        label: t.columnLock || 'Column Lock',
        target,
        landing: [0, line],
        affectedCells: Array.from({ length: ROWS }, (_, row) => [row, line] as [number, number]),
        removedCells: [],
        protectedCells: [],
        isLegal: true
      };
    }
    if (selectedPower === 'clearTop') {
      const occupied = firstOccupiedInColumn(board, line);
      if (!occupied) return makeIllegalPreview(target, t.clearTop || 'Clear Top', t.previewNoDisc || 'No disc to target');
      const [row, col] = occupied;
      const player = board[row][col];
      const shielded = hasCell(variant.shieldCells, row, col);
      const nextBoard = cloneBoard(board);
      if (!shielded) nextBoard[row][col] = null;
      return {
        type: 'power',
        label: t.clearTop || 'Clear Top',
        target,
        landing: [row, col],
        affectedCells: [[row, col]],
        removedCells: shielded ? [] : [{ row, col, player }],
        protectedCells: shielded ? [[row, col]] : [],
        settledBoard: shielded ? board : settleBoard(nextBoard, 'down'),
        isLegal: true
      };
    }
    return makeIllegalPreview(target, t.usePower || 'Use Power', t.previewUseCellTarget || 'Choose a board cell for this power');
  }

  const direction = variant.funMode === 'gravity' ? variant.gravityDirection : 'down';
  const landing = getAvailablePosition(board, line, direction);
  if (!landing) return makeIllegalPreview(target, t.drop || 'Drop', t.previewLineFull || 'This line is full');
  const nextBoard = cloneBoard(board);
  nextBoard[landing[0]][landing[1]] = currentPlayer;
  const triggersFloor = variant.funMode === 'risingFloor' && variant.risingTurnCount + 1 >= variant.settings.risingFloorInterval;
  return {
    type: triggersFloor ? 'risingFloor' : variant.funMode === 'connect5' ? 'connect5' : 'drop',
    label: variant.funMode === 'connect5' ? (t.dropProgress || 'Drop') + ' ' + (variant.settings.dropsPerTurn - variant.pendingDrops + 1) + '/' + variant.settings.dropsPerTurn : t.drop || 'Drop',
    target,
    landing,
    affectedCells: triggersFloor ? Array.from({ length: COLS }, (_, col) => [ROWS - 1, col] as [number, number]) : [landing],
    removedCells: triggersFloor ? nextBoard[ROWS - 1].map((player, col) => ({ row: ROWS - 1, col, player })).filter(cell => cell.player !== null) : [],
    protectedCells: [],
    settledBoard: triggersFloor ? removeBottomRow(nextBoard) : nextBoard,
    isLegal: true
  };
};

const computeCellPreview = (
  board: Board,
  variant: VariantState,
  currentPlayer: Player,
  row: number,
  col: number,
  t: TranslationStrings
): BoardPreview => {
  const target: PreviewTarget = { kind: 'cell', row, col };
  if (!currentPlayer || variant.funMode !== 'powerup' || variant.powerUsed[currentPlayer]) return makeIllegalPreview(target, t.usePower || 'Use Power', t.previewIllegal || 'Not a legal move');
  const power = variant.powerSelections[currentPlayer];
  const nextBoard = cloneBoard(board);

  if (power === 'airDrop') {
    const supported = row === ROWS - 1 || nextBoard[row + 1][col] !== null;
    if (nextBoard[row][col] !== null || !supported) return makeIllegalPreview(target, t.airDrop || 'Air Drop', t.previewUnsupportedCell || 'Choose an empty supported cell');
    nextBoard[row][col] = currentPlayer;
    return { type: 'power', label: t.airDrop || 'Air Drop', target, landing: [row, col], affectedCells: [[row, col]], removedCells: [], protectedCells: [], settledBoard: nextBoard, isLegal: true };
  }

  if (power === 'shield') {
    if (nextBoard[row][col] !== currentPlayer || hasCell(variant.shieldCells, row, col)) return makeIllegalPreview(target, t.shield || 'Shield', t.previewOwnDiscOnly || 'Choose one of your discs');
    return { type: 'power', label: t.shield || 'Shield', target, landing: [row, col], affectedCells: [[row, col]], removedCells: [], protectedCells: [[row, col]], isLegal: true };
  }

  if (power === 'colorFlip') {
    const opponent = currentPlayer === 1 ? 2 : 1;
    if (nextBoard[row][col] !== opponent || !hasAdjacentOwnDisc(nextBoard, row, col, currentPlayer)) return makeIllegalPreview(target, t.colorFlip || 'Color Flip', t.previewAdjacentEnemyOnly || 'Choose an adjacent enemy disc');
    nextBoard[row][col] = currentPlayer;
    return { type: 'power', label: t.colorFlip || 'Color Flip', target, landing: [row, col], affectedCells: [[row, col]], removedCells: [], protectedCells: [], settledBoard: nextBoard, isLegal: true };
  }

  if (power === 'swapPair') {
    const candidates: [number, number][] = [[row, col + 1], [row, col - 1], [row + 1, col], [row - 1, col]];
    const swapTarget = candidates.find(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS && nextBoard[row][col] !== null && nextBoard[r][c] !== null);
    if (!swapTarget) return makeIllegalPreview(target, t.swapPair || 'Swap Pair', t.previewAdjacentPairOnly || 'Choose an occupied cell next to another occupied cell');
    const [targetRow, targetCol] = swapTarget;
    return { type: 'power', label: t.swapPair || 'Swap Pair', target, landing: [row, col], affectedCells: [[row, col], [targetRow, targetCol]], removedCells: [], protectedCells: [], isLegal: true };
  }

  return makeIllegalPreview(target, t.usePower || 'Use Power', t.previewUseColumnTarget || 'Choose a column for this power');
};

const GameBoardComponent = ({
  board,
  onMove,
  onCellAction,
  gameActive,
  currentPlayer,
  winningLine,
  isAiThinking,
  theme,
  isPaused,
  isDarkMode,
  isTabletopMode,
  funMode = 'classic',
  selectedAction = 'drop',
  activeDirection = 'down',
  variant,
  wildCells = [],
  wildAccentColor = '#22d3ee',
  shieldCells = [],
  lastEffect = null,
  t
}: BoardProps) => {
  const [hoverPreview, setHoverPreview] = useState<BoardPreview | null>(null);
  const [lockedPreview, setLockedPreview] = useState<BoardPreview | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTargetRef = useRef<PreviewTarget | null>(null);
  const suppressClickRef = useRef(false);
  const lastTouchAtRef = useRef(0);
  const preview = lockedPreview || hoverPreview;

  const clearPreviews = () => {
    setLockedPreview(null);
    setHoverPreview(null);
  };

  const markTouchInteraction = (timestamp: number) => {
    lastTouchAtRef.current = timestamp;
  };

  const isRecentTouch = (timestamp: number) => timestamp - lastTouchAtRef.current < 700;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLockedPreview(null);
      setHoverPreview(null);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [board]);

  const isWinningCell = (r: number, c: number) => {
    return winningLine?.some(([wr, wc]) => wr === r && wc === c) || false;
  };

  const isFlipped = isTabletopMode && currentPlayer === 2;
  const usesRows = funMode === 'gravity' && (activeDirection === 'left' || activeDirection === 'right');
  const isShielded = (r: number, c: number) => shieldCells.some(([sr, sc]) => sr === r && sc === c);
  const isWildCell = (r: number, c: number) => wildCells.some(([wr, wc]) => wr === r && wc === c);
  const isLegalPopOut = (c: number) => currentPlayer !== null && board[ROWS - 1][c] === currentPlayer;
  const pieceEntryDirection = funMode === 'gravity' ? activeDirection : 'down';
  const playerColor = currentPlayer === 1 ? theme.red : theme.yellow;
  const cellStyle = (row: number, col: number) => ({
    gridRow: (isFlipped ? ROWS - 1 - row : row) + 1,
    gridColumn: col + 1
  });
  const effectCellClass = 'relative aspect-square flex items-center justify-center pointer-events-none';

  const createPreview = (target: PreviewTarget) => {
    if (target.kind === 'cell') return computeCellPreview(board, variant, currentPlayer, target.row, target.col, t);
    return computeLinePreview(board, variant, currentPlayer, selectedAction, target.index, t);
  };

  const commitTarget = (target: PreviewTarget) => {
    if (!gameActive || isAiThinking || isPaused) return;
    clearPreviews();
    if (target.kind === 'cell') {
      onCellAction?.(target.row, target.col);
      return;
    }
    onMove(target.index);
  };

  const setPreviewForTarget = (target: PreviewTarget, locked = false) => {
    if (!gameActive || isAiThinking || isPaused) return;
    if (locked) {
      setLockedPreview(createPreview(target));
      setHoverPreview(null);
    } else if (!lockedPreview) {
      setHoverPreview((currentPreview) => currentPreview && sameTarget(currentPreview.target, target) ? currentPreview : createPreview(target));
    }
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
    longPressTargetRef.current = null;
  };

  const handleBoardPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || isRecentTouch(event.timeStamp)) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const lineCount = usesRows ? ROWS : COLS;
    const offset = usesRows ? event.clientY - bounds.top : event.clientX - bounds.left;
    const size = usesRows ? bounds.height : bounds.width;
    const line = Math.max(0, Math.min(lineCount - 1, Math.floor((offset / size) * lineCount)));

    if (funMode === 'powerup' && selectedAction === 'power' && onCellAction) {
      const visualRow = Math.max(0, Math.min(ROWS - 1, Math.floor(((event.clientY - bounds.top) / bounds.height) * ROWS)));
      const col = Math.max(0, Math.min(COLS - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * COLS)));
      setPreviewForTarget({ kind: 'cell', row: isFlipped ? ROWS - 1 - visualRow : visualRow, col });
      return;
    }

    setPreviewForTarget({ kind: 'line', index: line });
  };

  const handleBoardPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || isRecentTouch(event.timeStamp) || lockedPreview) return;
    setHoverPreview(null);
  };

  const handlePointerDown = (target: PreviewTarget, pointerType: string, timestamp: number) => {
    if (pointerType !== 'touch') return;
    markTouchInteraction(timestamp);
    clearLongPress();
    longPressTargetRef.current = target;
    longPressTimerRef.current = setTimeout(() => {
      const heldTarget = longPressTargetRef.current;
      if (!heldTarget) return;
      suppressClickRef.current = true;
      setPreviewForTarget(heldTarget, true);
      longPressTimerRef.current = null;
    }, 350);
  };

  const handlePointerUp = (pointerType: string, timestamp: number) => {
    if (pointerType === 'touch') {
      markTouchInteraction(timestamp);
      clearLongPress();
    }
  };

  const handlePointerCancel = (pointerType: string, timestamp: number) => {
    if (pointerType === 'touch') markTouchInteraction(timestamp);
    clearLongPress();
  };

  const handleTargetClick = (target: PreviewTarget) => {
    if (!gameActive || isAiThinking || isPaused) return;
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (lockedPreview) {
      if (sameTarget(lockedPreview.target, target)) {
        if (lockedPreview.isLegal) commitTarget(target);
        setLockedPreview(null);
        setHoverPreview(null);
        return;
      }
      setPreviewForTarget(target, true);
      return;
    }
    const nextPreview = createPreview(target);
    if (nextPreview.isLegal) commitTarget(target);
    else setHoverPreview(nextPreview);
  };

  const previewLineCells = useMemo(() => {
    if (!preview?.target || preview.target.kind !== 'line') return [];
    const index = preview.target.index;
    if (usesRows) return Array.from({ length: COLS }, (_, col) => [index, col] as [number, number]);
    return Array.from({ length: ROWS }, (_, row) => [row, index] as [number, number]);
  }, [preview?.target, usesRows]);

  const previewAffectedCells = preview?.affectedCells || [];
  const previewRemovedCells = preview?.removedCells || [];
  const previewProtectedCells = preview?.protectedCells || [];
  const effectRemovedCells = lastEffect?.removed;
  const effectProtectedCells = lastEffect?.protected;
  const effectCells = lastEffect?.cells;

  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      <motion.div
        className={cn(
          'relative p-3 md:p-4 rounded-2xl shadow-xl border aspect-[7/6] w-full transition-colors duration-500 ease-in-out touch-none select-none',
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200/50'
        )}
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-700 ease-in-out"
          style={{
            boxShadow: `0 0 30px 4px ${theme.red}50`,
            opacity: gameActive && !isPaused && currentPlayer === 1 ? 1 : 0,
            willChange: 'opacity'
          }}
        />
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-700 ease-in-out"
          style={{
            boxShadow: `0 0 30px 4px ${theme.yellow}50`,
            opacity: gameActive && !isPaused && currentPlayer === 2 ? 1 : 0,
            willChange: 'opacity'
          }}
        />
        <div data-testid={winningLine ? 'winning-line-reveal' : undefined} className="relative w-full h-full" onPointerMove={handleBoardPointerMove} onPointerLeave={handleBoardPointerLeave}>
          <div className="grid grid-cols-7 grid-rows-6 gap-2 md:gap-3 w-full h-full pointer-events-none">
            {Array.from({ length: ROWS * COLS }).map((_, i) => {
              const row = Math.floor(i / COLS);
              const col = i % COLS;
              const wild = isWildCell(row, col);
              return (
                <div
                  key={`hole-${i}`}
                  data-testid={'board-cell-' + row + '-' + col}
                  data-player={board[row][col] ?? ''}
                  className={cn('relative aspect-square rounded-full shadow-inner', isDarkMode ? 'bg-zinc-950 shadow-black/50' : 'bg-white shadow-inner')}
                >
                  {wild && (
                    <motion.div
                      className="absolute -inset-1 rounded-full border-2 pointer-events-none"
                      style={{ borderColor: wildAccentColor, boxShadow: `0 0 14px ${wildAccentColor}80` }}
                      animate={{ opacity: [0.65, 1, 0.65] }}
                      transition={{ opacity: { repeat: Infinity, duration: 2.2 } }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 gap-2 md:gap-3 z-10 pointer-events-none">
            {board.map((row, r) =>
              row.map((cell, c) => {
                if (!cell) return null;
                const visualR = isFlipped ? ROWS - 1 - r : r;
                return (
                  <div key={`piece-${r}-${c}`} style={{ gridRow: visualR + 1, gridColumn: c + 1 }} className={cn("relative aspect-square flex items-center justify-center overflow-visible transition-opacity duration-300", winningLine && !isWinningCell(r, c) && "opacity-30")}>
                    <div className="absolute inset-0 p-1.5 md:p-2">
                      <Piece player={cell} isWinning={isWinningCell(r, c)} theme={theme} isTabletopMode={isTabletopMode} entryDirection={pieceEntryDirection} />
                      {isShielded(r, c) && <div className="absolute inset-1 rounded-full border-2 border-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.9)] pointer-events-none" />}
                      {isWildCell(r, c) && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 pointer-events-none"
                          style={{ borderColor: wildAccentColor, boxShadow: `0 0 18px ${wildAccentColor}90` }}
                          animate={isWinningCell(r, c) ? { scale: [1, 1.28, 1], rotate: [0, 180, 360] } : { scale: [1, 1.08, 1] }}
                          transition={{ repeat: isWinningCell(r, c) ? 2 : Infinity, duration: isWinningCell(r, c) ? 0.8 : 2.2 }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <AnimatePresence>
            {preview && (
              <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 gap-2 md:gap-3 z-20 pointer-events-none">
                {previewLineCells.map(([row, col]) => (
                  <motion.div key={`preview-line-${row}-${col}`} style={cellStyle(row, col)} className={effectCellClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className={cn('absolute inset-0 rounded-full border border-dashed', preview.isLegal ? 'border-white/30 bg-white/5' : 'border-red-400/50 bg-red-500/10')} />
                  </motion.div>
                ))}
                {previewAffectedCells.map(([row, col], index) => (
                  <motion.div key={`preview-affected-${row}-${col}-${index}`} style={cellStyle(row, col)} className={effectCellClass} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div className={cn('absolute inset-1 rounded-full border-2 border-dashed', preview.isLegal ? 'border-violet-300/80 bg-violet-400/10' : 'border-red-400/80 bg-red-500/10')} />
                  </motion.div>
                ))}
                {previewRemovedCells.map(({ row, col, player }, index) => (
                  <motion.div key={`preview-removed-${row}-${col}-${index}`} style={cellStyle(row, col)} className={effectCellClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="absolute inset-0 p-1.5 md:p-2 opacity-60">
                      <Piece player={player} theme={theme} isTabletopMode={isTabletopMode} entryDirection="down" />
                    </div>
                    <div className="absolute inset-1 rounded-full border-2 border-dashed border-red-400 bg-red-500/15" />
                    <span className="absolute text-[10px] font-black uppercase text-red-200">x</span>
                  </motion.div>
                ))}
                {previewProtectedCells.map(([row, col], index) => (
                  <motion.div key={`preview-protected-${row}-${col}-${index}`} style={cellStyle(row, col)} className={effectCellClass} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div className="absolute inset-1 rounded-full border-2 border-dashed border-sky-300 bg-sky-400/10 shadow-[0_0_16px_rgba(125,211,252,0.65)]" />
                  </motion.div>
                ))}
                {preview.landing && (
                  <motion.div key={`preview-landing-${preview.landing[0]}-${preview.landing[1]}`} style={cellStyle(preview.landing[0], preview.landing[1])} className={effectCellClass} initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: [0.96, 1.06, 1] }} exit={{ opacity: 0 }}>
                    <div className="absolute inset-0 p-1.5 md:p-2 opacity-55">
                      <Piece player={currentPlayer} isPreview theme={theme} isTabletopMode={isTabletopMode} entryDirection={pieceEntryDirection} />
                    </div>
                    <div className={cn('absolute inset-0 rounded-full border-2 border-dashed', preview.isLegal ? 'border-white/80' : 'border-red-400')} style={preview.isLegal ? { boxShadow: `0 0 18px ${playerColor}90` } : undefined} />
                  </motion.div>
                )}
                {lockedPreview && (
                  <motion.div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div className={cn('rounded-full px-3 py-1.5 text-[10px] font-black uppercase shadow-xl', 'backdrop-blur', preview.isLegal ? 'bg-zinc-950/80 text-white' : 'bg-red-500 text-white')}>
                      {preview.isLegal ? `${t.preview || 'Preview'}: ${preview.label}` : preview.reason || preview.label}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {lastEffect && (
              <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 gap-2 md:gap-3 z-30 pointer-events-none">
                {effectRemovedCells?.map(({ row, col, player }, index) => (
                  <motion.div key={`${lastEffect.id}-removed-${row}-${col}-${index}`} style={cellStyle(row, col)} className={effectCellClass} initial={{ opacity: 1, scale: 1, y: 0 }} animate={{ opacity: [1, 1, 0], scale: lastEffect.type === 'risingFloor' ? [1, 0.95, 0.55] : [1, 1.18, 0.35], y: lastEffect.type === 'popout' || lastEffect.type === 'risingFloor' ? [0, 18, 42] : [0, -4, 0], rotate: lastEffect.type === 'bomb' ? [0, -10, 12, 0] : 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, times: [0, 0.45, 1] }}>
                    <div className="absolute inset-0 p-1.5 md:p-2">
                      <Piece player={player} theme={theme} isTabletopMode={isTabletopMode} entryDirection="down" />
                      <div className={cn('absolute inset-2 rounded-full border-2', lastEffect.type === 'bomb' ? 'border-red-400' : 'border-orange-400', (lastEffect.type === 'bomb' ? 'shadow-[0_0_18px_rgba(248,113,113,0.95)]' : 'shadow-[0_0_18px_rgba(251,146,60,0.9)]'))} />
                    </div>
                  </motion.div>
                ))}
                {effectProtectedCells?.map(([row, col], index) => (
                  <motion.div key={`${lastEffect.id}-protected-${row}-${col}-${index}`} style={cellStyle(row, col)} className={effectCellClass} initial={{ opacity: 0, scale: 0.65 }} animate={{ opacity: [0, 1, 0], scale: [0.65, 1.35, 1.05] }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
                    <div className={cn('absolute inset-1 rounded-full border-4 border-sky-300', 'shadow-[0_0_24px_rgba(125,211,252,1)]')} />
                  </motion.div>
                ))}
                {effectCells?.map(([row, col], index) => (
                  <motion.div key={`${lastEffect.id}-cell-${row}-${col}-${index}`} style={cellStyle(row, col)} className={effectCellClass} initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: [0, 1, 0], scale: [0.75, 1.25, 1.5] }} exit={{ opacity: 0 }} transition={{ duration: lastEffect.type === 'risingFloor' ? 1.1 : 0.8, delay: index * 0.04 }}>
                    <div className={cn('absolute inset-1 rounded-full border-2', lastEffect.type === 'risingFloor' && 'border-orange-400 bg-orange-400/15', lastEffect.type === 'power' && 'border-violet-400 bg-violet-400/10', lastEffect.type === 'bomb' && 'border-red-400 bg-red-400/10', lastEffect.type === 'connect5' && 'border-emerald-400 bg-emerald-400/10')} />
                  </motion.div>
                ))}
                {lastEffect.landing && (
                  <motion.div key={`${lastEffect.id}-landing`} style={cellStyle(lastEffect.landing[0], lastEffect.landing[1])} className={effectCellClass} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 0], scale: lastEffect.type === 'bomb' ? [0.4, 1.65, 2.25] : [0.65, 1.2, 1.45] }} exit={{ opacity: 0 }} transition={{ duration: lastEffect.type === 'bomb' ? 1.1 : 0.75 }}>
                    <div className={cn('absolute inset-0 rounded-full border-4', lastEffect.type === 'bomb' ? 'border-red-500' : 'border-white/80', lastEffect.type === 'bomb' && 'shadow-[0_0_30px_rgba(239,68,68,0.9)]')} />
                    {lastEffect.type === 'bomb' && <div className={cn('absolute h-2 w-2 rounded-full bg-red-500', 'shadow-[0_0_18px_rgba(239,68,68,1)]')} />}
                  </motion.div>
                )}
                {lastEffect.type === 'gravity' && (
                  <motion.div key={`${lastEffect.id}-gravity`} className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: [0, 1, 0], scale: [0.85, 1, 1.12] }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
                    <div className="rounded-full bg-sky-500 text-white px-4 py-2 text-xs font-black uppercase shadow-xl">
                      {t.gravityDirection || 'Gravity'}: {t[lastEffect.direction as keyof TranslationStrings] || lastEffect.direction}
                    </div>
                  </motion.div>
                )}
                {lastEffect.type === 'connect5' && lastEffect.landing && (
                  <motion.div key={`${lastEffect.id}-combo`} style={cellStyle(lastEffect.landing[0], lastEffect.landing[1])} className={effectCellClass} initial={{ opacity: 0, y: -8 }} animate={{ opacity: [0, 1, 0], y: [-8, -22, -28] }} transition={{ duration: 1 }}>
                    <span className="absolute -top-5 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-black text-white shadow-lg">{lastEffect.label}</span>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 gap-2 md:gap-3 z-40">
            {Array.from({ length: usesRows ? ROWS : COLS }).map((_, line) => {
              const target: PreviewTarget = { kind: 'line', index: line };
              return (
                <div
                  key={line}
                  data-testid={'board-' + (usesRows ? 'row' : 'column') + '-' + line}
                  className="group/col relative h-full cursor-pointer outline-none"
                  style={usesRows ? { gridColumn: '1 / -1', gridRow: line + 1 } : { gridColumn: line + 1, gridRow: '1 / -1' }}
                  role="button"
                  tabIndex={0}

                  onPointerDown={(event) => handlePointerDown(target, event.pointerType, event.timeStamp)}
                  onPointerUp={(event) => handlePointerUp(event.pointerType, event.timeStamp)}
                  onPointerCancel={(event) => handlePointerCancel(event.pointerType, event.timeStamp)}
                  onFocus={(event) => !isRecentTouch(event.timeStamp) && setPreviewForTarget(target)}
                  onBlur={(event) => !isRecentTouch(event.timeStamp) && !lockedPreview && setHoverPreview(null)}
                  onClick={() => handleTargetClick(target)}
                >
                  {gameActive && !isAiThinking && !isPaused && (
                    <div
                      className={cn(
                        'absolute flex opacity-0 group-hover/col:opacity-100 transition-all duration-300 pointer-events-none',
                        activeDirection === 'left' && 'top-1/2 right-full mr-3 md:mr-4 -translate-y-1/2 group-hover/col:-translate-x-1',
                        activeDirection === 'right' && 'top-1/2 left-full ml-3 md:ml-4 -translate-y-1/2 group-hover/col:translate-x-1',
                        activeDirection !== 'left' && activeDirection !== 'right' && 'left-0 right-0 justify-center',
                        activeDirection !== 'left' && activeDirection !== 'right' && (isFlipped || activeDirection === 'up' ? '-bottom-12 md:-bottom-14 translate-y-2 group-hover/col:translate-y-0' : '-top-12 md:-top-14 -translate-y-2 group-hover/col:translate-y-0')
                      )}
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full shadow-lg" style={{ backgroundColor: playerColor, boxShadow: `0 0 15px ${playerColor}80` }} />
                    </div>
                  )}
                  {funMode === 'popout' && selectedAction === 'popout' && !usesRows && gameActive && !isAiThinking && !isPaused && (
                    <div className={cn('absolute left-1/2 -bottom-11 md:-bottom-12 flex -translate-x-1/2 flex-col items-center gap-1 opacity-90 transition-all group-hover/col:opacity-100 group-hover/col:translate-y-1', !isLegalPopOut(line) && 'opacity-35')}>
                      <div className={cn('h-8 min-w-12 rounded-full border px-3 text-[10px] font-black uppercase shadow-lg flex items-center justify-center', isLegalPopOut(line) ? 'border-white/40 text-white' : isDarkMode ? 'border-zinc-700 bg-zinc-900 text-zinc-500' : 'border-zinc-200 bg-white text-zinc-400')} style={isLegalPopOut(line) ? { backgroundColor: playerColor } : undefined}>
                        {isLegalPopOut(line) ? t.popHandle || t.popOutAction || 'Pop' : t.blockedPopHandle || 'No'}
                      </div>
                      <div className={cn('h-3 w-px', isLegalPopOut(line) ? 'bg-white/70' : 'bg-zinc-400/40')} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {funMode === 'powerup' && selectedAction === 'power' && onCellAction && (
            <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 gap-2 md:gap-3 z-50">
              {Array.from({ length: ROWS * COLS }).map((_, i) => {
                const row = Math.floor(i / COLS);
                const col = i % COLS;
                const target: PreviewTarget = { kind: 'cell', row, col };
                return (
                  <button
                    key={`cell-${row}-${col}`}
                    type="button"
                    data-testid={'board-cell-target-' + row + '-' + col}
                    aria-label={(t.row || 'Row') + ' ' + (row + 1) + ', ' + (t.col || 'Column') + ' ' + (col + 1) + ' power target'}
                    className="rounded-full border-2 border-transparent hover:border-white/80 hover:bg-white/10 transition-colors outline-none focus:border-white/80 focus:bg-white/10 pointer-events-auto"

                    onPointerDown={(event) => handlePointerDown(target, event.pointerType, event.timeStamp)}
                    onPointerUp={(event) => handlePointerUp(event.pointerType, event.timeStamp)}
                    onPointerCancel={(event) => handlePointerCancel(event.pointerType, event.timeStamp)}
                    onFocus={(event) => !isRecentTouch(event.timeStamp) && setPreviewForTarget(target)}
                    onBlur={(event) => !isRecentTouch(event.timeStamp) && !lockedPreview && setHoverPreview(null)}
                    onClick={() => handleTargetClick(target)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence>
          {isPaused && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={cn('absolute inset-0 z-30 flex items-center justify-center rounded-2xl', 'backdrop-blur-sm', isDarkMode ? 'bg-black/40' : 'bg-white/40')}>
              <div className={cn('px-8 py-4 rounded-full shadow-xl border flex items-center gap-3', isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200')}>
                <div className={cn('w-3 h-3 rounded-full animate-pulse', isDarkMode ? 'bg-white' : 'bg-zinc-900')} />
                <span className={cn('text-xl font-black tracking-widest uppercase', isDarkMode ? 'text-white' : 'text-zinc-900')}>{t.pause}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export const GameBoard = memo(GameBoardComponent);
