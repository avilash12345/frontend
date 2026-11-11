import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HistoryItem } from '@/types/youtube';

const HISTORY_KEY = '@tubeflow/history/v1';
const MAX_ITEMS = 80;

export async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is HistoryItem => Boolean(item?.id && item?.title));
  } catch {
    return [];
  }
}

async function persist(items: HistoryItem[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export async function addHistory(item: HistoryItem): Promise<HistoryItem[]> {
  const current = await loadHistory();
  const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, MAX_ITEMS);
  await persist(next);
  return next;
}

export async function removeHistory(id: string): Promise<HistoryItem[]> {
  const current = await loadHistory();
  const next = current.filter((entry) => entry.id !== id);
  await persist(next);
  return next;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function updateHistoryItem(
  id: string,
  patch: Partial<HistoryItem>,
): Promise<HistoryItem[]> {
  const current = await loadHistory();
  const next = current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
  await persist(next);
  return next;
}
