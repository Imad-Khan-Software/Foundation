import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useAdminLoginLockout } from "../../hooks/useAdminLoginLockout";
import { attemptsRemainingBeforeLock } from "../../lib/adminLoginLockout";
import BrandLogo from "../../components/BrandLogo";

export default function AdminLogin() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isLocked, secondsLeft, recordFailedAttempt, recordSuccessfulLogin } =
    useAdminLoginLockout();

  const from = location.state?.from?.pathname || "/admin";
  const reason = location.state?.reason;
  const reasonMessage =
    reason === "disabled"
      ? "Your administrator account has been deactivated. Contact another administrator if you believe this is a mistake."
      : reason === "not-authorized"
      ? "That account isn't an authorized administrator."
      : null;

  // Already signed in (e.g. came back to /admin/login by mistake) — send
  // them straight to the admin area. This has to run in an effect, not
  // directly in the render body: calling navigate() while rendering
  // triggers React's "Cannot update a component while rendering a
  // different component" warning.
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  if (user) {
    return null;
  }

  // Supabase's own AuthApiError (bad email/password, status 400, message
  // "Invalid login credentials") is the only case that should count
  // against the lockout. Network failures, a down Supabase project, or
  // any other unexpected error are not the admin's fault and must not
  // burn one of their attempts — they just get a generic message and can
  // retry immediately.
  function isInvalidCredentialsError(error) {
    return error?.name === "AuthApiError" && error?.status === 400;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLocked) return;

    setError("");
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      if (isInvalidCredentialsError(error)) {
        const lockout = recordFailedAttempt();
        if (lockout.lockedUntil > Date.now()) {
          // The countdown message below (driven by isLocked/secondsLeft)
          // takes over as soon as this re-render happens.
          setError("");
        } else {
          const remaining = attemptsRemainingBeforeLock(lockout.failedAttempts);
          setError(
            remaining === 1
              ? "Invalid email or password. 1 attempt remaining."
              : `Invalid email or password. ${remaining} attempts remaining.`
          );
        }
      } else {
        // Network error / Supabase unavailable / anything else unexpected.
        setError("Something went wrong. Please try again in a moment.");
      }
      return;
    }

    recordSuccessfulLogin();
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen bg-paper grid place-items-center px-5">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <BrandLogo />
          <span className="font-display text-lg text-pine-dark">
            Ikhlass Welfare Foundation
          </span>
        </Link>

        <div className="rounded-2xl border border-ink/10 bg-white/60 p-7">
          <h1 className="font-display text-xl text-pine-dark mb-1">
            Admin sign in
          </h1>
          <p className="text-sm text-ink/60 mb-6">
            This area is for authorized foundation administrators only.
          </p>

          {reasonMessage && (
            <p role="alert" className="mb-4 rounded-lg bg-care/10 px-3.5 py-2.5 text-sm text-care">
              {reasonMessage}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-pine-dark mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLocked}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white disabled:opacity-60"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-pine-dark mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLocked}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>

            {isLocked ? (
              <p role="alert" className="text-sm text-care">
                Too many failed attempts. Login temporarily locked.
                <br />
                Try again in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}.
              </p>
            ) : (
              error && (
                <p role="alert" className="text-sm text-care">
                  {error}
                </p>
              )
            )}

            <button
              type="submit"
              disabled={submitting || isLocked}
              className="w-full inline-flex items-center justify-center rounded-full bg-pine px-6 py-3 text-sm font-semibold text-white hover:bg-pine-light transition-all disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-education focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {isLocked
                ? `Locked (${secondsLeft}s)`
                : submitting
                ? "Signing in…"
                : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink/40">
          There is no public sign-up — admin accounts are created directly in
          the Supabase dashboard.
        </p>
      </div>
    </div>
  );
}
