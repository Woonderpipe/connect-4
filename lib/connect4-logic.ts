/**
 * Connect 4 Game Logic and AI
 */

export type Player = 1 | 2 | null; // 1: Red, 2: Yellow, null: Empty
export type Board = Player[][];
export type FunMode = 'classic' | 'popout' | 'gravity' | 'bomb' | 'wildColumn' | 'powerup' | 'risingFloor' | 'connect5';
export type GravityDirection = 'down' | 'left' | 'up' | 'right';
export type PowerUp =
  | 'doubleDrop'
  | 'columnLock'
  | 'swapPair'
  | 'colorFlip'
  | 'airDrop'
  | 'clearTop'
  | 'shield'
  | 'extraBomb';

export const FUN_MODES: FunMode[] = ['classic', 'popout', 'gravity', 'bomb', 'wildColumn', 'powerup', 'risingFloor', 'connect5'];
export const POWER_UPS: PowerUp[] = ['doubleDrop', 'columnLock', 'swapPair', 'colorFlip', 'airDrop', 'clearTop', 'shield', 'extraBomb'];
export const GRAVITY_DIRECTIONS: GravityDirection[] = ['down', 'left', 'up', 'right'];

export const ROWS = 6;
export const COLS = 7;

export const createEmptyBoard = (): Board => 
  Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

export const cloneBoard = (board: Board): Board => board.map(row => [...row]);

export const getAvailableRow = (board: Board, col: number): number => {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) return r;
  }
  return -1;
};

export const getAvailablePosition = (
  board: Board,
  index: number,
  direction: GravityDirection = 'down'
): [number, number] | null => {
  if (direction === 'down') {
    const row = getAvailableRow(board, index);
    return row === -1 ? null : [row, index];
  }

  if (direction === 'up') {
    for (let r = 0; r < ROWS; r++) {
      if (board[r][index] === null) return [r, index];
    }
    return null;
  }

  if (direction === 'left') {
    for (let c = 0; c < COLS; c++) {
      if (board[index][c] === null) return [index, c];
    }
    return null;
  }

  for (let c = COLS - 1; c >= 0; c--) {
    if (board[index][c] === null) return [index, c];
  }
  return null;
};

export const isLineFull = (
  board: Board,
  index: number,
  direction: GravityDirection = 'down'
): boolean => getAvailablePosition(board, index, direction) === null;

export const settleBoard = (board: Board, direction: GravityDirection = 'down'): Board => {
  const settled = createEmptyBoard();

  if (direction === 'down' || direction === 'up') {
    for (let c = 0; c < COLS; c++) {
      const pieces: Player[] = [];
      for (let r = 0; r < ROWS; r++) {
        if (board[r][c] !== null) pieces.push(board[r][c]);
      }
      if (direction === 'down') {
        for (let i = 0; i < pieces.length; i++) {
          settled[ROWS - pieces.length + i][c] = pieces[i];
        }
      } else {
        for (let i = 0; i < pieces.length; i++) {
          settled[i][c] = pieces[i];
        }
      }
    }
    return settled;
  }

  for (let r = 0; r < ROWS; r++) {
    const pieces = board[r].filter((cell): cell is 1 | 2 => cell !== null);
    if (direction === 'left') {
      for (let i = 0; i < pieces.length; i++) settled[r][i] = pieces[i];
    } else {
      for (let i = 0; i < pieces.length; i++) settled[r][COLS - pieces.length + i] = pieces[i];
    }
  }

  return settled;
};

export const popOutDisc = (board: Board, col: number, player: Player): Board | null => {
  if (!player || board[ROWS - 1][col] !== player) return null;
  const next = cloneBoard(board);
  for (let r = ROWS - 1; r > 0; r--) {
    next[r][col] = next[r - 1][col];
  }
  next[0][col] = null;
  return next;
};

export const removeBottomRow = (board: Board): Board => {
  const next = createEmptyBoard();
  for (let r = ROWS - 1; r > 0; r--) {
    next[r] = [...board[r - 1]];
  }
  return next;
};

export const createWildCells = (count = 5): [number, number][] => {
  const columns = Array.from({ length: COLS }, (_, col) => col).sort(() => Math.random() - 0.5);
  const cells: [number, number][] = [];
  const used = new Set<string>();

  for (const col of columns) {
    if (cells.length >= count) break;
    const row = Math.floor(Math.random() * ROWS);
    cells.push([row, col]);
    used.add(`${row}:${col}`);
  }

  while (cells.length < count) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    const key = `${row}:${col}`;
    if (!used.has(key)) {
      cells.push([row, col]);
      used.add(key);
    }
  }

  return cells;
};

const isWildCell = (wildCells: [number, number][] | null, row: number, col: number): boolean => {
  return wildCells?.some(([r, c]) => r === row && c === col) || false;
};

export const checkWin = (
  board: Board,
  player: Player,
  winLength = 4,
  wildCells: [number, number][] | null = null
): { win: boolean; line: [number, number][] | null } => {
  if (!player) return { win: false, line: null };

  const matches = (r: number, c: number) => board[r][c] === player || (isWildCell(wildCells, r, c) && board[r][c] !== null);
  const scan = (startR: number, startC: number, dr: number, dc: number) => {
    const line: [number, number][] = [];
    for (let i = 0; i < winLength; i++) {
      const r = startR + dr * i;
      const c = startC + dc * i;
      if (!matches(r, c)) return null;
      line.push([r, c]);
    }
    return line;
  };

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - winLength; c++) {
      const line = scan(r, c, 0, 1);
      if (line) return { win: true, line };
    }
  }

  // Vertical
  for (let r = 0; r <= ROWS - winLength; r++) {
    for (let c = 0; c < COLS; c++) {
      const line = scan(r, c, 1, 0);
      if (line) return { win: true, line };
    }
  }

  // Diagonal (down-right)
  for (let r = 0; r <= ROWS - winLength; r++) {
    for (let c = 0; c <= COLS - winLength; c++) {
      const line = scan(r, c, 1, 1);
      if (line) return { win: true, line };
    }
  }

  // Diagonal (up-right)
  for (let r = winLength - 1; r < ROWS; r++) {
    for (let c = 0; c <= COLS - winLength; c++) {
      const line = scan(r, c, -1, 1);
      if (line) return { win: true, line };
    }
  }

  return { win: false, line: null };
};

export const isBoardFull = (board: Board, direction: GravityDirection = 'down'): boolean => {
  if (direction === 'down') return board[0].every(cell => cell !== null);
  if (direction === 'up') return board[ROWS - 1].every(cell => cell !== null);
  if (direction === 'left') return board.every(row => row[COLS - 1] !== null);
  return board.every(row => row[0] !== null);
};

// --- AI Heuristics ---

const POSITIONAL_BONUS = [
  [3, 4, 5, 7, 5, 4, 3],
  [4, 6, 8, 10, 8, 6, 4],
  [5, 8, 11, 13, 11, 8, 5],
  [5, 8, 11, 13, 11, 8, 5],
  [4, 6, 8, 10, 8, 6, 4],
  [3, 4, 5, 7, 5, 4, 3]
];

const evaluateWindow = (window: Player[], player: Player): number => {
  let score = 0;
  const opponent = player === 1 ? 2 : 1;

  const playerCount = window.filter(p => p === player).length;
  const emptyCount = window.filter(p => p === null).length;
  const opponentCount = window.filter(p => p === opponent).length;

  if (playerCount === 4) score += 10000;
  else if (playerCount === 3 && emptyCount === 1) score += 100;
  else if (playerCount === 2 && emptyCount === 2) score += 10;

  if (opponentCount === 3 && emptyCount === 1) score -= 1000;
  else if (opponentCount === 2 && emptyCount === 2) score -= 50;

  return score;
};

export const evaluateBoard = (board: Board, player: Player): number => {
  let score = 0;

  // Positional bonus
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === player) score += POSITIONAL_BONUS[r][c];
      else if (board[r][c] !== null) score -= POSITIONAL_BONUS[r][c];
    }
  }

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]];
      score += evaluateWindow(window, player);
    }
  }

  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const window = [board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]];
      score += evaluateWindow(window, player);
    }
  }

  // Diagonal (down-right)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]];
      score += evaluateWindow(window, player);
    }
  }

  // Diagonal (up-right)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3]];
      score += evaluateWindow(window, player);
    }
  }

  return score;
};

// --- Minimax AI ---

export const minimax = (
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player
): number => {
  const opponent = aiPlayer === 1 ? 2 : 1;
  
  const aiWin = checkWin(board, aiPlayer).win;
  if (aiWin) return 1000000 + depth;
  
  const oppWin = checkWin(board, opponent).win;
  if (oppWin) return -1000000 - depth;
  
  if (isBoardFull(board) || depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  const validCols = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) validCols.push(c);
  }
  
  // Heuristic: prioritize center columns
  validCols.sort((a, b) => Math.abs(Math.floor(COLS/2) - a) - Math.abs(Math.floor(COLS/2) - b));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const col of validCols) {
      const row = getAvailableRow(board, col);
      board[row][col] = aiPlayer;
      const evaluation = minimax(board, depth - 1, alpha, beta, false, aiPlayer);
      board[row][col] = null;
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const col of validCols) {
      const row = getAvailableRow(board, col);
      board[row][col] = opponent;
      const evaluation = minimax(board, depth - 1, alpha, beta, true, aiPlayer);
      board[row][col] = null;
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getBestMove = (board: Board, aiPlayer: Player, difficulty: 'easy' | 'medium' | 'hard'): number => {
  const validCols = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) validCols.push(c);
  }

  if (validCols.length === 0) return -1;

  if (difficulty === 'easy') {
    // Random move with slight bias towards center
    if (Math.random() < 0.3 && board[0][3] === null) return 3;
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  const depth = difficulty === 'medium' ? 3 : 5;
  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const col of validCols) {
    const row = getAvailableRow(board, col);
    board[row][col] = aiPlayer;
    const score = minimax(board, depth - 1, -Infinity, Infinity, false, aiPlayer);
    board[row][col] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [col];
    } else if (score === bestScore) {
      bestMoves.push(col);
    }
  }

  // Add slight randomness in Hard mode among top moves
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};
