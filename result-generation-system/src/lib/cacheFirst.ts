/**
 * secureCache.ts
 *
 * Encrypted, on-device read cache for the Result Generation System.
 *
 * Design notes (read this before changing anything below):
 *  - Postgres, via the backend API, remains the single source of truth for
 *    every piece of data in the app. Nothing in this file is ever the ONLY
 *    copy of anything — if the cache is empty, corrupted, unavailable, or
 *    simply wrong, callers fall back to a normal network request exactly as
 *    they did before this file existed. Caching here is purely a
 *    performance layer, never a substitute for the backend.
 *  - The cache lives in IndexedDB, not cookies. Cookies cap out around 4KB
 *    per domain and are re-uploaded on every single HTTP request — using
 *    them to hold a school's worth of students/results would blow past
 *    that limit almost immediately and make every request slower, not
 *    faster. Cookies are left doing what they're good at elsewhere in this
 *    app (nothing here touches auth transport).
 *  - Every value is encrypted with AES-256-GCM before it touches disk. The
 *    key is derived (PBKDF2-SHA256) from the user's current JWT and kept
 *    only in memory for the life of the tab — it is never itself written
 *    to disk. Practical effect:
 *      - a copy of the IndexedDB file on its own is useless without a
 *        valid, current session token to re-derive the key from
 *      - logging out, or logging in as a different user on a shared
 *        device, wipes the whole cache, so cached data never leaks
 *        between accounts
 */

const DB_NAME = 'rgs_secure_cache';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const PBKDF2_ITERATIONS = 100_000;
// Domain-separation only, not a secret — the real secret is the token itself.
const SALT = new TextEncoder().encode('rgs-secure-cache-v1');

let cryptoKey: CryptoKey | null = null;
let cryptoKeyToken: string | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;

function supportsCache(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof indexedDB !== 'undefined' &&
    typeof crypto !== 'undefined' &&
    !!crypto.subtle
  );
}

function openDb(): Promise<IDBDatabase | null> {
  if (!supportsCache()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null); // best-effort — caching must never be fatal
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// ─── Key management ─────────────────────────────────────────────────────────

/**
 * Derive (or reuse) the AES key for this session's cache from the current
 * JWT. Call this right after login/register succeed, and again on every app
 * bootstrap wherever the token is read back out of storage — it's cheap to
 * call redundantly, it only re-derives when the token actually changed.
 *
 * If the token belongs to a different session than whatever the on-disk
 * cache was last encrypted for, the whole cache is wiped first. That's what
 * stops two different accounts on the same browser from ever sharing
 * cached data.
 */
export async function initCacheKey(token: string | null): Promise<void> {
  if (!token || !supportsCache()) {
    cryptoKey = null;
    cryptoKeyToken = null;
    return;
  }
  if (cryptoKey && cryptoKeyToken === token) return; // already set up for this token

  if (cryptoKeyToken && cryptoKeyToken !== token) {
    await clearAllCache(); // stale data from a previous session — don't keep it around
  }

  try {
    const enc = new TextEncoder();
    const material = await crypto.subtle.importKey('raw', enc.encode(token), 'PBKDF2', false, [
      'deriveKey',
    ]);
    cryptoKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: SALT, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    cryptoKeyToken = token;
  } catch {
    cryptoKey = null;
    cryptoKeyToken = null;
  }
}

/**
 * Drop the in-memory key without touching what's on disk. Reads become
 * misses (they'll transparently fall back to the network) until
 * initCacheKey runs again with a valid token. Call this on logout, right
 * before clearAllCache().
 */
export function clearCacheKey(): void {
  cryptoKey = null;
  cryptoKeyToken = null;
}

// ─── Encrypt / decrypt helpers ──────────────────────────────────────────────

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

interface CacheEnvelope {
  iv: string; // base64
  ct: string; // base64
}

async function encryptValue(value: unknown): Promise<CacheEnvelope | null> {
  if (!cryptoKey) return null;
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plaintext);
    return { iv: toBase64(iv.buffer), ct: toBase64(ct) };
  } catch {
    return null;
  }
}

async function decryptValue<T>(envelope: CacheEnvelope): Promise<T | null> {
  if (!cryptoKey) return null;
  try {
    const iv = fromBase64(envelope.iv);
    const ct = fromBase64(envelope.ct);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, cryptoKey, ct as BufferSource);
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    return null; // wrong key / corrupted entry / different account — treat as a miss
  }
}

// ─── Public key/value API ───────────────────────────────────────────────────

export async function setEncrypted(key: string, value: unknown): Promise<void> {
  const envelope = await encryptValue(value);
  if (!envelope) return; // no key yet, or crypto unavailable — silently skip caching
  await withStore('readwrite', (store) => store.put(envelope, key));
}

export async function getDecrypted<T>(key: string): Promise<T | null> {
  const envelope = await withStore<CacheEnvelope>('readonly', (store) => store.get(key));
  if (!envelope) return null;
  return decryptValue<T>(envelope);
}

export async function deleteEncrypted(key: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(key));
}

/**
 * Delete every cache entry whose key starts with `prefix`. Used to
 * invalidate a whole resource (e.g. "results:") after any write to it,
 * instead of having to track every individual query key that touched it.
 */
export async function clearByPrefix(prefix: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve();
          return;
        }
        if (String(cursor.key).startsWith(prefix)) cursor.delete();
        cursor.continue();
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Wipe the entire local cache. Call this on logout. */
export async function clearAllCache(): Promise<void> {
  await withStore('readwrite', (store) => store.clear());
}