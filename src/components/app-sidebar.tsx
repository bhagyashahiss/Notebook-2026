"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/summary", label: "Summary" },
  { href: "/manual-entry", label: "Manual Entry" },
  { href: "/undo", label: "Undo" },
  { href: "/update-phone", label: "Update Phone" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen((value) => !value)}
        className="fixed left-4 top-4 z-50 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
      >
        Menu
      </button>

      {open ? (
        <button
          type="button"
          aria-label="Close menu backdrop"
          className="fixed inset-0 z-40 bg-slate-900/30"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white p-4 shadow-lg transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Navigation</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
          >
            Close
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <a
            href="/api/auth/logout"
            className="mt-2 block rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Logout
          </a>
        </nav>
      </aside>
    </>
  );
}
