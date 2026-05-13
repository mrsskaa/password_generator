/** Размеры алфавитов в соответствии с типичным генератором (как на бэкенде). */
const LOWER = 26;
const UPPER = 26;
const DIGITS = 10;
const SYMBOLS = 32;

export interface PasswordStrengthInput {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface PasswordStrength {
  crackTimeText: string;
  strengthColor: string;
  improvementHint: string;
}

function buildPoolSize(input: PasswordStrengthInput): number {
  let size = 0;
  if (input.includeLowercase) size += LOWER;
  if (input.includeUppercase) size += UPPER;
  if (input.includeNumbers) size += DIGITS;
  if (input.includeSymbols) size += SYMBOLS;
  return Math.max(size, 1);
}

function entropyBits(length: number, poolSize: number): number {
  return length * (Math.log(poolSize) / Math.LN2);
}

function formatRussianDuration(seconds: number): string {
  if (seconds > 1e50) {
    return 'несравнимо дольше человеческой истории';
  }
  if (seconds < 1e-6) {
    return 'практически мгновенно';
  }
  if (seconds < 1) {
    return 'менее секунды';
  }
  if (seconds < 60) {
    return `около ${Math.floor(seconds)} с`;
  }
  if (seconds < 3600) {
    return `около ${(seconds / 60).toFixed(1)} мин`;
  }
  if (seconds < 86400) {
    return `около ${(seconds / 3600).toFixed(1)} ч`;
  }
  if (seconds < 86400 * 365) {
    return `около ${(seconds / 86400).toFixed(1)} дн`;
  }
  const y = seconds / (86400 * 365);
  if (y < 1_000_000) {
    return `около ${y.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} лет`;
  }
  return 'миллионы лет и больше';
}

/**
 * Оценка времени полного перебора при известном алфавите генератора (10^12 попыток/с).
 */
export function estimatePasswordStrength(input: PasswordStrengthInput): PasswordStrength {
  const poolSize = buildPoolSize(input);
  const bits = entropyBits(input.length, poolSize);
  const guessesPerSec = 1e12;
  const log10Combinations = input.length * Math.log10(poolSize);
  const log10Sec = log10Combinations - Math.log10(guessesPerSec);

  let durationStr: string;
  if (log10Sec > 50) {
    durationStr = 'несравнимо дольше человеческой истории';
  } else {
    const crackSeconds = 10 ** log10Sec;
    durationStr = formatRussianDuration(crackSeconds);
  }

  const crackTimeText = `Оценка перебора: ${durationStr}`;

  let strengthColor: string;
  if (bits < 36) {
    strengthColor = '#e53935';
  } else if (bits < 48) {
    strengthColor = '#fb8c00';
  } else if (bits < 64) {
    strengthColor = '#fbc02d';
  } else if (bits < 80) {
    strengthColor = '#7cb342';
  } else {
    strengthColor = '#2e7d32';
  }

  const tips: string[] = [];
  if (input.length < 16) {
    tips.push('Увеличьте длину до 16 символов и больше.');
  }
  if (!input.includeSymbols) {
    tips.push('Включите специальные символы.');
  }
  if (!input.includeNumbers) {
    tips.push('Добавьте цифры.');
  }
  if (!(input.includeLowercase && input.includeUppercase)) {
    tips.push('Используйте и строчные, и прописные буквы.');
  }
  if (tips.length === 0) {
    tips.push('Текущие настройки уже дают сильный пароль; периодически меняйте пароль.');
  }

  return {
    crackTimeText,
    strengthColor,
    improvementHint: tips.join(' '),
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim().replace('#', '');
  if (normalized.length !== 6) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Имена цветов с бэка (например red, lightgreen) → hex для полупрозрачной подсветки поля */
const BACKEND_COLOR_TO_HEX: Record<string, string> = {
  red: '#e53935',
  orange: '#fb8c00',
  yellow: '#fbc02d',
  lightgreen: '#7cb342',
  green: '#2e7d32',
};

export type PasswordStrengthToken = 'red' | 'orange' | 'yellow' | 'lightgreen' | 'green';

const STRENGTH_TOKENS = new Set<string>(['red', 'orange', 'yellow', 'lightgreen', 'green']);

/** Нормализует `color` из API (имя или #hex) к токену для классов `generator-strength--*`. */
export function normalizeStrengthToken(color: string): PasswordStrengthToken {
  const trimmed = color.trim().toLowerCase();
  if (STRENGTH_TOKENS.has(trimmed)) {
    return trimmed as PasswordStrengthToken;
  }
  if (trimmed.startsWith('#')) {
    const hex = trimmed.toUpperCase();
    for (const [name, h] of Object.entries(BACKEND_COLOR_TO_HEX)) {
      if (h.toUpperCase() === hex) {
        return name as PasswordStrengthToken;
      }
    }
  }
  return 'red';
}

/** Подсветка фона поля пароля: бек может отдать hex или имя цвета CSS */
export function tintFromBackendColor(color: string, alpha: number): string {
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    return hexToRgba(trimmed, alpha);
  }
  const hex = BACKEND_COLOR_TO_HEX[trimmed.toLowerCase()];
  if (hex) {
    return hexToRgba(hex, alpha);
  }
  return `rgba(0, 0, 0, ${alpha})`;
}

/** Свечение вокруг поля пароля: размытие 20px, цвет с бэка с прозрачностью ~50 % */
export function strengthGlowBoxShadow(color: string): string {
  const rgba = tintFromBackendColor(color, 0.5);
  return `0 0 20px ${rgba}`;
}

/** Уровень «Хорошо» и выше по ответу бэка (сильный / очень сильный) — подсказка не нужна */
export function isStrengthBelowGood(strengthLevel: string): boolean {
  const level = strengthLevel.trim().toLowerCase();
  const goodOrBetter = new Set(['сильный', 'очень сильный']);
  return !goodOrBetter.has(level);
}
