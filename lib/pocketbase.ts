import PocketBase from 'pocketbase';
import { reportOperationalError } from '@/lib/operational-logging';
import { Board, Player } from './connect4-logic';
import { Move } from '@/hooks/use-connect4';

// Initialize PocketBase client
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');
pb.autoCancellation(false);

export interface OnlineGameState {
  id?: string;
  board: Board;
  currentPlayer: Player;
  gameActive: boolean;
  winner: Player | 'draw' | null;
  winningLine: [number, number][] | null;
  history: Move[];
  player2Joined: boolean;
  timers: { 1: number; 2: number };
  timerDuration: number;
  variant?: unknown;
  lastEffect?: unknown;
}

export const createOnlineGame = async (initialState: Partial<OnlineGameState>) => {
  try {
    const record = await pb.collection('games').create(initialState, {
      $autoCancel: false,
      requestKey: null,
      fetch: (url: any, config: any) => fetch(url, { ...config, cache: 'no-store' })
    });
    return record;
  } catch (error) {
    reportOperationalError('PocketBase game creation failed');
    throw error;
  }
};

export const getOnlineGame = async (id: string) => {
  try {
    const record = await pb.collection('games').getOne(id, {
      $autoCancel: false,
      requestKey: null, // Disable request cancellation
      fetch: (url: any, config: any) => fetch(url, { ...config, cache: 'no-store' })
    });
    return record;
  } catch (error) {
    reportOperationalError('PocketBase game lookup failed');
    throw error;
  }
};

export const updateOnlineGame = async (id: string, state: Partial<OnlineGameState>) => {
  try {
    const record = await pb.collection('games').update(id, state, {
      $autoCancel: false,
      requestKey: null,
      fetch: (url: any, config: any) => fetch(url, { ...config, cache: 'no-store' })
    });
    return record;
  } catch (error) {
    reportOperationalError('PocketBase game update failed');
    throw error;
  }
};

export const subscribeToGame = (id: string, callback: (record: any) => void) => {
  let isSubscribed = true;
  
  pb.collection('games').subscribe(id, (e) => {
    if (isSubscribed) {
      callback(e.record);
    }
  }).catch(() => reportOperationalError('PocketBase subscription failed'));
  
  return () => {
    isSubscribed = false;
    pb.collection('games').unsubscribe(id).catch(() => reportOperationalError('PocketBase unsubscribe failed'));
  };
};
