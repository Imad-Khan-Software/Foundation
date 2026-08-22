import { useContext } from "react";
import { FoundationSettingsContext } from "./foundationSettingsContextObject";

export function useFoundationSettings() {
  const ctx = useContext(FoundationSettingsContext);
  if (ctx === undefined) {
    throw new Error(
      "useFoundationSettings must be used inside a <FoundationSettingsProvider>"
    );
  }
  return ctx;
}
