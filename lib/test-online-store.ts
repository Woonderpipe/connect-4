type TestOnlineState = Record<string, unknown>;

interface TestOnlineRoom {
  id: string;
  state: TestOnlineState;
  revision: number;
  updatedAt: number;
}

type TestOnlineGlobal = typeof globalThis & {
  __connect4TestOnlineRooms?: Map<string, TestOnlineRoom>;
  __connect4TestOnlineCounter?: number;
};

const MAX_TEST_ONLINE_ROOMS = 32;
const MAX_TEST_ONLINE_STATE_BYTES = 20_000;
const TEST_ONLINE_ROOM_TTL_MS = 30 * 60 * 1000;
const TEST_ONLINE_ID_PATTERN = /^test-[a-z0-9-]{3,80}$/;

const testGlobal = globalThis as TestOnlineGlobal;

const rooms = () => {
  if (!testGlobal.__connect4TestOnlineRooms) {
    testGlobal.__connect4TestOnlineRooms = new Map<string, TestOnlineRoom>();
  }
  return testGlobal.__connect4TestOnlineRooms;
};

const nextRoomId = () => {
  testGlobal.__connect4TestOnlineCounter = (testGlobal.__connect4TestOnlineCounter || 0) + 1;
  return `test-${Date.now().toString(36)}-${testGlobal.__connect4TestOnlineCounter.toString(36)}`;
};

const isPlainObject = (value: unknown): value is TestOnlineState => {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const serializedStateSize = (state: TestOnlineState) => JSON.stringify(state).length;

const pruneExpiredRooms = () => {
  const now = Date.now();
  for (const [id, room] of rooms()) {
    if (now - room.updatedAt > TEST_ONLINE_ROOM_TTL_MS) {
      rooms().delete(id);
    }
  }
};

const withConnectedState = (state: TestOnlineState, connected: boolean): TestOnlineState => ({
  ...state,
  player2Joined: connected,
  timers: {
    ...((state.timers as Record<string, unknown> | undefined) || {}),
    ...(connected ? { p2Joined: true } : {})
  }
});

export const isTestOnlineEnabled = () =>
  process.env.NODE_ENV !== 'production' &&
  (process.env.NEXT_PUBLIC_ONLINE_TEST_MODE === 'true' || process.env.ONLINE_TEST_MODE === 'true');

export const isValidTestOnlineState = (state: unknown): state is TestOnlineState => {
  if (!isPlainObject(state)) return false;

  try {
    return serializedStateSize(state) <= MAX_TEST_ONLINE_STATE_BYTES;
  } catch {
    return false;
  }
};

export const isValidTestOnlineId = (id: unknown): id is string =>
  typeof id === 'string' && TEST_ONLINE_ID_PATTERN.test(id);

export const resetTestOnlineRooms = () => {
  rooms().clear();
};

export const createTestOnlineRoom = (state: TestOnlineState) => {
  pruneExpiredRooms();
  if (!isValidTestOnlineState(state) || rooms().size >= MAX_TEST_ONLINE_ROOMS) return null;

  const id = nextRoomId();
  const now = Date.now();
  const room: TestOnlineRoom = {
    id,
    state: withConnectedState(state, false),
    revision: 1,
    updatedAt: now
  };
  rooms().set(id, room);
  return room;
};

export const joinTestOnlineRoom = (id: string) => {
  pruneExpiredRooms();
  if (!isValidTestOnlineId(id)) return null;

  const room = rooms().get(id);
  if (!room) return null;
  if ((room.state.player2Joined || (room.state.timers as Record<string, unknown> | undefined)?.p2Joined) && room.revision > 1) return null;

  room.state = withConnectedState(room.state, true);
  room.revision += 1;
  room.updatedAt = Date.now();
  return room;
};

export const getTestOnlineRoom = (id: string) => {
  pruneExpiredRooms();
  if (!isValidTestOnlineId(id)) return null;
  return rooms().get(id) || null;
};

export const updateTestOnlineRoom = (id: string, state: TestOnlineState) => {
  pruneExpiredRooms();
  if (!isValidTestOnlineId(id) || !isValidTestOnlineState(state)) return null;

  const room = rooms().get(id);
  if (!room) return null;

  const connected = Boolean(room.state.player2Joined || (room.state.timers as Record<string, unknown> | undefined)?.p2Joined);
  const nextState = withConnectedState({ ...room.state, ...state }, connected);
  if (!isValidTestOnlineState(nextState)) return null;

  room.state = nextState;
  room.revision += 1;
  room.updatedAt = Date.now();
  return room;
};

export const serializeTestOnlineRoom = (room: TestOnlineRoom) => ({
  id: room.id,
  revision: room.revision,
  updatedAt: room.updatedAt,
  ...room.state
});
