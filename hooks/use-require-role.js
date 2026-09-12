"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Client-side role gate for pages that only ever call admin-only APIs but had no guard of
 * their own — app/(dashboard)/layout.jsx only checks "is logged in", not role, so a
 * CUSTOMER navigating directly to one of these URLs previously got the full page shell
 * rendered (and, for the couple of GET endpoints that also lacked auth, real data).
 *
 * Usage: const { authorized, checking } = useRequireRole(["ADMIN", "SUPER_ADMIN"]);
 * Render nothing (or a loading state) while `checking`, and nothing once redirected away.
 */
export function useRequireRole(allowedRoles) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const checking = loading || !user;
  const authorized = !checking && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!checking && !authorized) {
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, authorized]);

  return { authorized, checking };
}
