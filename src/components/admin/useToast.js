import { useEffect, useRef, useState } from "react";

// Same show/auto-dismiss logic Settings.jsx uses inline, pulled out so the
// three new CRUD pages (Executives/Members/Branches) don't each repeat it.
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  function showToast(type, message) {
    setToast({ type, message });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 4000);
  }

  return [toast, showToast];
}
