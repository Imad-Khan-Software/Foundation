import { useContext } from "react";
import { AuthContext } from "./authContextObject";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return ctx;
}
