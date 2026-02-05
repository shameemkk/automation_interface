"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

const navItems = [
  { href: "/dashboard/automation-history", label: "Automation" },
  { href: "/dashboard/client-details", label: "Client details" },
] as const;

const adminNavItem = { href: "/dashboard", label: "Users" } as const;

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
      }`}
    >
      {label}
    </Link>
  );
}

export function DashboardSidebar({
  role,
  email,
}: {
  role: "admin" | "user";
  email: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Automation Interface
        </h2>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {role === "admin" && (
          <NavLink
            href={adminNavItem.href}
            label={adminNavItem.label}
            active={pathname === "/dashboard"}
          />
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={pathname === item.href}
          />
        ))}
      </nav>
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <p className="px-3 text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {email}
        </p>
        <LogoutButton />
      </div>
    </aside>
  );
}
