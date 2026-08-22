import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// This is intentionally minimal — Phase 2 only sets up the authentication
// foundation. The real admin dashboard (managing executives, projects,
// donations, etc.) is built in later phases.
export default function AdminHome() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-paper px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="text-sm text-ink/50 hover:text-pine-dark">
            ← Back to public site
          </Link>
          <button
            onClick={signOut}
            className="text-sm font-semibold text-care hover:underline"
          >
            Sign out
          </button>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white/60 p-7">
          <p className="eyebrow mb-2">Admin area</p>
          <h1 className="font-display text-2xl text-pine-dark mb-2">
            You're signed in
          </h1>
          <p className="text-sm text-ink/60">
            Signed in as <span className="font-medium">{user?.email}</span>
          </p>
          <p className="mt-4 text-sm text-ink/60 leading-relaxed">
            This confirms the authentication foundation from Phase 2 is
            working. The actual dashboard — managing executives, members,
            branches, projects, donations, and expenses — is built out in
            later phases.
          </p>
        </div>
      </div>
    </div>
  );
}
