import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const empty = {
  total_donations: 0,
  total_expenses: 0,
  education_spending: 0,
  health_spending: 0,
  care_spending: 0,
  administration_spending: 0,
  other_spending: 0,
};

// public_financial_summary is a single-row view (see
// supabase/migrations/0003_public_views.sql) that sums only VERIFIED
// donations/expenses server-side. This hook is the one place that reads
// it, so the public homepage and the /transparency page can't drift out
// of sync with each other or fall back to hand-typed numbers.
export function useFinancialSummary() {
  const [summary, setSummary] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from("public_financial_summary")
        .select("*")
        .single();

      if (cancelled) return;
      if (error) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setSummary(data || empty);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { summary, loading, loadError };
}
