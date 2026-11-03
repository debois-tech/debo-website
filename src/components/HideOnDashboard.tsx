"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The public site's header, footer, scroll bar and chat bubble do not belong on the admin dashboard, which has its own layout. */
export function HideOnDashboard({ children }: { children: ReactNode }) {
  const path = usePathname();
  return path === "/dashboard" || path.startsWith("/dashboard/") ? null : <>{children}</>;
}
