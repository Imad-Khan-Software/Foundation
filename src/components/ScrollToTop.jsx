import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router doesn't reset scroll position between route changes on its
// own. Without this, navigating from a long page (e.g. Home) to a short one
// (e.g. Contact) leaves the new page scrolled partway down.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
