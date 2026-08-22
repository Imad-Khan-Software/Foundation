// Progressive lockout for the admin login form.
//
// This is a DEVICE/BROWSER-level speed bump layered on top of Supabase
// Auth, not a replacement for real brute-force protection. It only makes
// guessing slower from *this* browser — anyone who clears localStorage,
// switches browsers, or calls the Supabase auth endpoint directly bypasses
// it entirely. Real protection against sustained brute-forcing has to be
// enforced server-side (e.g. Supabase Auth's own rate limits, or a
// database-backed limiter keyed by IP/email), which is outside the scope
// of this frontend-only change.
//
// Rules (see project spec):
//   - 3 wrong attempts  -> 60s lock
//   - every 3 after that -> 120s lock
//   - the failed-attempt counter never resets on its own, only on a
//     successful login
//   - the lock is stored as an absolute timestamp so it survives refresh

const STORAGE_KEY = "ikhlass_admin_login_lockout";

const FIRST_LOCK_MS = 60 * 1000;
const SUBSEQUENT_LOCK_MS = 2 * 60 * 1000;

const DEFAULT_STATE = { failedAttempts: 0, lockedUntil: 0 };

function isValidState(value) {
  return (
    value &&
    typeof value.failedAttempts === "number" &&
    typeof value.lockedUntil === "number" &&
    Number.isFinite(value.failedAttempts) &&
    Number.isFinite(value.lockedUntil)
  );
}

// Reads the lockout state from localStorage. Never throws — a missing key,
// corrupted JSON, or a browser with localStorage disabled all just fall
// back to "no lockout in effect" rather than breaking the login form.
export function readLockoutState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    if (!isValidState(parsed)) return { ...DEFAULT_STATE };
    return { failedAttempts: parsed.failedAttempts, lockedUntil: parsed.lockedUntil };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeLockoutState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full / disabled / private-mode quirk — the lockout simply
    // won't persist across refresh in that case, but the form still works.
  }
}

// Duration for the lock triggered by reaching `failedAttempts` (which is
// always a multiple of 3 when a lock is triggered). The 1st group of 3
// gets the short lock; every group after that gets the longer one.
function lockDurationFor(failedAttempts) {
  const lockLevel = failedAttempts / 3;
  return lockLevel <= 1 ? FIRST_LOCK_MS : SUBSEQUENT_LOCK_MS;
}

// Call this once, right when a genuine "invalid credentials" response
// comes back from Supabase. Returns the updated state (already persisted).
export function registerFailedAttempt() {
  const current = readLockoutState();
  const failedAttempts = current.failedAttempts + 1;

  let lockedUntil = 0;
  if (failedAttempts % 3 === 0) {
    lockedUntil = Date.now() + lockDurationFor(failedAttempts);
  }

  const next = { failedAttempts, lockedUntil };
  writeLockoutState(next);
  return next;
}

// Call this after a successful Supabase sign-in. Wipes the counter and
// any active lock so the next failure (whenever it happens) starts over
// at attempt #1.
export function resetLockoutState() {
  writeLockoutState({ ...DEFAULT_STATE });
  return { ...DEFAULT_STATE };
}

// How many more wrong attempts remain before the *next* lock, given a
// state that isn't currently locked. Returns 0 if a lock should already be
// in effect for this attempt count (callers shouldn't display "remaining"
// messaging in that case).
export function attemptsRemainingBeforeLock(failedAttempts) {
  const positionInGroup = failedAttempts % 3; // 0, 1, or 2
  if (positionInGroup === 0) return 0;
  return 3 - positionInGroup;
}

export function msRemaining(lockedUntil) {
  return Math.max(0, lockedUntil - Date.now());
}

export function secondsRemaining(lockedUntil) {
  return Math.ceil(msRemaining(lockedUntil) / 1000);
}
