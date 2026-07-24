/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Safely converts any value (string, number, object, null, undefined) into a displayable string
 * to prevent runtime crashes like "Uncaught TypeError: Cannot convert object to primitive value" or "Objects are not valid as a React child".
 */
export function safeString(val: any, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return isNaN(val) ? fallback : String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') {
    try {
      if (val.name !== undefined && val.name !== null) return safeString(val.name, fallback);
      if (val.title !== undefined && val.title !== null) return safeString(val.title, fallback);
      if (val.label !== undefined && val.label !== null) return safeString(val.label, fallback);
      if (val.text !== undefined && val.text !== null) return safeString(val.text, fallback);
      if (val.value !== undefined && val.value !== null) return safeString(val.value, fallback);
      if (val.city || val.state) {
        return [val.city, val.state].filter(Boolean).map(s => safeString(s)).join(', ');
      }
      if (val.address !== undefined && val.address !== null) return safeString(val.address, fallback);
      if (typeof val.toDate === 'function') {
        return val.toDate().toISOString();
      }
      if (typeof val.seconds === 'number') {
        return new Date(val.seconds * 1000).toISOString();
      }
      if (typeof val._seconds === 'number') {
        return new Date(val._seconds * 1000).toISOString();
      }
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  try {
    return String(val);
  } catch {
    return fallback;
  }
}

/**
 * Safely converts an array or raw list of items into an array of strings.
 */
export function safeArrayOfStrings(arr: any): string[] {
  if (!arr) return [];
  if (!Array.isArray(arr)) {
    if (typeof arr === 'string') return arr.split(',').map(s => s.trim()).filter(Boolean);
    const s = safeString(arr);
    return s ? [s] : [];
  }
  return arr.map(item => safeString(item)).filter(Boolean);
}

/**
 * Safely converts a value into a displayable date string.
 */
export function safeDateString(val: any, fallback: string = ''): string {
  if (!val) return fallback;
  try {
    if (typeof val === 'string') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? val : d.toLocaleDateString();
    }
    if (typeof val === 'number') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? fallback : d.toLocaleDateString();
    }
    if (typeof val === 'object') {
      if (typeof val.toDate === 'function') {
        return val.toDate().toLocaleDateString();
      }
      if (typeof val.seconds === 'number') {
        return new Date(val.seconds * 1000).toLocaleDateString();
      }
      if (typeof val._seconds === 'number') {
        return new Date(val._seconds * 1000).toLocaleDateString();
      }
      if (val.date) return safeDateString(val.date, fallback);
      if (val.year) return safeString(val.year, fallback);
    }
  } catch {
    return fallback;
  }
  return fallback;
}

/**
 * Safely extracts a numeric timestamp (ms) from any date representation.
 */
export function getSafeTimestamp(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  }
  if (typeof val === 'object') {
    try {
      if (typeof val.toDate === 'function') return val.toDate().getTime();
      if (typeof val.seconds === 'number') return val.seconds * 1000;
      if (typeof val._seconds === 'number') return val._seconds * 1000;
      if (val.createdAt) return getSafeTimestamp(val.createdAt);
    } catch {
      return 0;
    }
  }
  return 0;
}

/**
 * Safely converts any value into a number with fallback.
 */
export function safeNumber(val: any, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  if (typeof val === 'object') {
    try {
      if (typeof val.value === 'number') return val.value;
      if (typeof val.count === 'number') return val.count;
      if (typeof val.score === 'number') return val.score;
      if (typeof val.years === 'number') return val.years;
      if (typeof val.seconds === 'number') return val.seconds;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Ensures a value is an array.
 */
export function safeArray<T = any>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') {
    try {
      return Object.values(val) as T[];
    } catch {
      return [];
    }
  }
  return [];
}
