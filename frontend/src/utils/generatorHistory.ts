import type { GeneratePasswordPayload, GeneratePasswordResponse } from '../types/generator';

const KEY_PREFIX = 'pg_gen_history_';
const MAX_ENTRIES = 10;

export interface GeneratorHistoryEntry {
  id: string;
  at: string;
  /** Короткая дата для списка */
  dateLabel: string;
  /** ДД.ММ.ГГГГ, ЧЧ:ММ для подписи на карточке */
  dateTimeLabel: string;
  password: string;
  length: number;
  options: GeneratePasswordPayload;
  crackTimeHuman: string;
  strengthColor: string;
  strengthLevel: string;
  hints: string[];
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatHistoryDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  const date = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${date}, ${time}`;
}

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function loadGeneratorHistory(userId: string): GeneratorHistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as GeneratorHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearGeneratorHistory(userId: string): void {
  try {
    sessionStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

export function pushGeneratorHistory(
  userId: string,
  response: GeneratePasswordResponse,
  options: GeneratePasswordPayload,
): GeneratorHistoryEntry[] {
  const now = new Date().toISOString();
  const full: GeneratorHistoryEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    at: now,
    dateLabel: formatDateLabel(now),
    dateTimeLabel: formatHistoryDateTime(now),
    password: response.password,
    length: options.length,
    options,
    crackTimeHuman: response.crack_time_human,
    strengthColor: response.color,
    strengthLevel: response.strength_level,
    hints: response.hints ?? [],
  };
  const prev = loadGeneratorHistory(userId);
  const next = [full, ...prev.filter((e) => e.id !== full.id)].slice(0, MAX_ENTRIES);
  try {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // quota / private mode
  }
  return next;
}
