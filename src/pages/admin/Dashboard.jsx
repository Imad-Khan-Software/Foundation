import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/useAuth";
import { supabase } from "../../lib/supabaseClient";

function formatMoney(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

// Cards not backed by a real query yet — these will be swapped out one by
// one as Members and Branches counts get wired up in later phases, the
// same way Donations, Expenses, and Projects were below.
const staticCards = [
  { label: "Members", value: "Not available yet" },
  { label: "Branches", value: "Not available yet" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [donationStats, setDonationStats] = useState(null);
  const [donationStatsError, setDonationStatsError] = useState(false);
  const [expenseStats, setExpenseStats] = useState(null);
  const [expenseStatsError, setExpenseStatsError] = useState(false);
  const [projectStats, setProjectStats] = useState(null);
  const [projectStatsError, setProjectStatsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDonationStats() {
      // Only verification_status and amount are needed for these three
      // numbers — no donor-identifying columns are fetched here, even
      // though this runs as an authenticated admin who could see them.
      const { data, error } = await supabase
        .from("donations")
        .select("amount, verification_status");

      if (cancelled) return;
      if (error) {
        setDonationStatsError(true);
        return;
      }

      const rows = data || [];
      const verified = rows.filter((d) => d.verification_status === "verified");
      const pending = rows.filter((d) => d.verification_status === "pending");
      setDonationStats({
        verifiedTotal: verified.reduce((sum, d) => sum + Number(d.amount || 0), 0),
        pendingTotal: pending.reduce((sum, d) => sum + Number(d.amount || 0), 0),
        verifiedCount: verified.length,
      });
    }

    async function loadExpenseStats() {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount, verification_status");

      if (cancelled) return;
      if (error) {
        setExpenseStatsError(true);
        return;
      }

      const rows = data || [];
      const verified = rows.filter((e) => e.verification_status === "verified");
      setExpenseStats({
        verifiedTotal: verified.reduce((sum, e) => sum + Number(e.amount || 0), 0),
      });
    }

    async function loadProjectStats() {
      const { data, error } = await supabase.from("projects").select("status");

      if (cancelled) return;
      if (error) {
        setProjectStatsError(true);
        return;
      }

      const rows = data || [];
      setProjectStats({
        active: rows.filter((p) => p.status === "active").length,
        total: rows.length,
      });
    }

    loadDonationStats();
    loadExpenseStats();
    loadProjectStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const donationCards = donationStatsError
    ? [{ label: "Total Donations", value: "Couldn't load" }]
    : [
        {
          label: "Total Verified Donations",
          value: donationStats ? formatMoney(donationStats.verifiedTotal) : "Loading…",
        },
        {
          label: "Pending Donations",
          value: donationStats ? formatMoney(donationStats.pendingTotal) : "Loading…",
        },
        {
          label: "Verified Donation Count",
          value: donationStats ? String(donationStats.verifiedCount) : "Loading…",
        },
      ];

  // Remaining balance only ever compares VERIFIED donations against
  // VERIFIED expenses — same rule the public_financial_summary view uses
  // (supabase/migrations/0003_public_views.sql) — so a pending/unverified
  // record never moves this number.
  const remainingBalanceValue =
    donationStatsError || expenseStatsError
      ? "Couldn't load"
      : donationStats && expenseStats
      ? formatMoney(donationStats.verifiedTotal - expenseStats.verifiedTotal)
      : "Loading…";

  const expenseCards = [
    {
      label: "Total Verified Expenses",
      value: expenseStatsError
        ? "Couldn't load"
        : expenseStats
        ? formatMoney(expenseStats.verifiedTotal)
        : "Loading…",
    },
    { label: "Remaining Balance", value: remainingBalanceValue },
  ];

  const projectCards = [
    {
      label: "Active Projects",
      value: projectStatsError
        ? "Couldn't load"
        : projectStats
        ? `${projectStats.active} of ${projectStats.total}`
        : "Loading…",
    },
  ];

  const cards = [...donationCards, ...expenseCards, ...projectCards, ...staticCards];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow mb-2">Admin dashboard</p>
        <h1 className="font-display text-2xl sm:text-3xl text-pine-dark">
          Welcome to Ikhlass Welfare Foundation
        </h1>
        <p className="mt-2 text-sm sm:text-base text-ink/60">
          Manage your foundation website from one place.
        </p>
        {user?.email && (
          <p className="mt-3 text-xs text-ink/40">
            Signed in as <span className="font-medium">{user.email}</span>
          </p>
        )}
      </motion.div>

      <div className="mt-8 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.05 + i * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="min-w-0 rounded-2xl border border-ink/10 bg-white/60 p-5"
          >
            <p className="eyebrow mb-2">{c.label}</p>
            <p className="font-display text-xl text-ink/40 break-words">
              {c.value}
            </p>
          </motion.div>
        ))}
      </div>

      <p className="mt-6 text-xs text-ink/40 max-w-lg">
        Donation and expense figures only count verified records toward the
        totals above. The Members and Branches cards will show live figures
        once those counts are connected in a later phase.
      </p>
    </div>
  );
}
