import { useEffect, useRef, useState } from "react";
import {
  attemptsRemainingBeforeLock,
  readLockoutState,
  registerFailedAttempt,
  resetLockoutState,
  secondsRemaining,
} from "../lib/adminLoginLockout";

// Drives the progressive lockout UI on AdminLogin. Owns:
//   - restoring an in-progress lock from localStorage on mount (refresh-safe)
//   - a once-a-second countdown while locked, with a single interval that
//     always gets cleaned up
//   - exposing helpers the form calls on failed/successful sign-in
export function useAdminLoginLockout() {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  // Restore whatever was persisted the last time this browser hit the
  // login form (e.g. mid-lock, then the page was refreshed).
  useEffect(() => {
    const stored = readLockoutState();
    setFailedAttempts(stored.failedAttempts);
    setLockedUntil(stored.lockedUntil);
  }, []);

  // Countdown: only one interval alive at a time, torn down whenever
  // lockedUntil changes or the component unmounts.
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const remaining = secondsRemaining(lockedUntil);
    if (remaining <= 0) {
      setSecondsLeft(0);
      return;
    }

    setSecondsLeft(remaining);
    intervalRef.current = setInterval(() => {
      const left = secondsRemaining(lockedUntil);
      if (left <= 0) {
        setSecondsLeft(0);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        setSecondsLeft(left);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [lockedUntil]);

  const isLocked = lockedUntil > Date.now() && secondsLeft > 0;

  function recordFailedAttempt() {
    const next = registerFailedAttempt();
    setFailedAttempts(next.failedAttempts);
    setLockedUntil(next.lockedUntil);
    return next;
  }

  function recordSuccessfulLogin() {
    const next = resetLockoutState();
    setFailedAttempts(next.failedAttempts);
    setLockedUntil(next.lockedUntil);
  }

  return {
    isLocked,
    secondsLeft,
    failedAttempts,
    attemptsRemaining: attemptsRemainingBeforeLock(failedAttempts),
    recordFailedAttempt,
    recordSuccessfulLogin,
  };
}
