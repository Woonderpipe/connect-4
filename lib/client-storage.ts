const memoryStore = new Map<string, string>();

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readClientJson = <T>(key: string, fallback: T): T => {
  const storage = getStorage();
  const raw = storage?.getItem(key) ?? memoryStore.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const writeClientJson = (key: string, value: unknown) => {
  const raw = JSON.stringify(value);
  memoryStore.set(key, raw);
  try {
    getStorage()?.setItem(key, raw);
  } catch {
    // Android WebViews can deny storage access; the in-memory value still works for the session.
  }
};
