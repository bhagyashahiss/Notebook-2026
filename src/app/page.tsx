"use client";

import { useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/app-sidebar";
import type { SubmissionRecord } from "@/types/submission";
import {
  buildTokenMessage,
  buildPaymentMessage,
  getWhatsAppLink,
} from "@/lib/whatsapp-link";

const EVENT_DATE_JAIN = "30th May 2026 and 31st May 2026";
const EVENT_DATE_NON_JAIN = "31st May 2026";
const EVENT_TIME = "9:00 AM to 12:00 PM";
const EVENT_VENUE =
  "Shri Sambhavnath Jain Mandir, Carter Road No. 4, Borivali East";
const EVENT_CONTACT =
  "Sambhav Shanti Yuva Group - https://wa.me/919082557642";

type Filter = "all" | "pending" | "token_sent" | "completed";
type UserRole = "admin" | "viewer";

function statusBadge(status: SubmissionRecord["status"]): string {
  if (status === "completed") return "bg-emerald-100 text-emerald-800";
  if (status === "token_sent") return "bg-sky-100 text-sky-800";
  return "bg-amber-100 text-amber-800";
}

export default function HomePage() {
  const [rows, setRows] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [tokenQuery, setTokenQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [paymentModes, setPaymentModes] = useState<Record<string, "CASH" | "UPI">>({});
  const [role, setRole] = useState<UserRole>("viewer");

  const fetchRows = async () => {
    try {
      const response = await fetch("/api/submissions", { cache: "no-store" });

      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent("/")}`;
        return;
      }

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { submissions?: SubmissionRecord[] };
      setRows(Array.isArray(data.submissions) ? data.submissions : []);
    } catch {
      // Keep last successful state if network intermittently fails.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows();

    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((json: { role?: UserRole }) => {
        if (json.role === "admin" || json.role === "viewer") {
          setRole(json.role);
        }
      })
      .catch(() => {
        setRole("viewer");
      });

    const interval = window.setInterval(() => {
      void fetchRows();
    }, 3000);

    const source = new EventSource("/api/events");
    source.onmessage = () => {
      void fetchRows();
    };

    return () => {
      source.close();
      window.clearInterval(interval);
    };
  }, []);

  const filteredRows = useMemo(() => {
    const token = tokenQuery.trim().toLowerCase();
    const name = nameQuery.trim().toLowerCase();

    return rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (token && !(row.tokenNumber ?? "").toLowerCase().includes(token)) return false;
      if (name && !row.name.toLowerCase().includes(name)) return false;
      return true;
    });
  }, [rows, filter, tokenQuery, nameQuery]);

  const openTokenWhatsApp = async (row: SubmissionRecord) => {
    const eventDate = row.isJain ? EVENT_DATE_JAIN : EVENT_DATE_NON_JAIN;

    const message = buildTokenMessage({
      name: row.name,
      tokenNumber: row.tokenNumber ?? "",
      dozens: row.dozens,
      amount: row.amount,
      date: eventDate,
      time: EVENT_TIME,
      venue: EVENT_VENUE,
      contact: EVENT_CONTACT,
    });
    const link = getWhatsAppLink(row.phone, message);
    window.open(link, "_blank");

    // Mark as token_sent
    await fetch(`/api/submissions/${row.id}/token-sent`, { method: "PATCH" });
    await fetchRows();
  };

  const openPaymentWhatsApp = (row: SubmissionRecord) => {
    const paymentMode = paymentModes[row.id] ?? "CASH";
    const message = buildPaymentMessage({
      name: row.name,
      tokenNumber: row.tokenNumber ?? "",
      dozens: row.dozens,
      paymentMode,
      amount: row.amount,
    });
    const link = getWhatsAppLink(row.phone, message);
    window.open(link, "_blank");
  };

  const markCompleted = async (id: string) => {
    setBusyId(id);
    try {
      const paymentMode = paymentModes[id] ?? "CASH";
      await fetch(`/api/submissions/${id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMode }),
      });
      await fetchRows();
    } finally {
      setBusyId(null);
    }
  };

  const directComplete = async (row: SubmissionRecord) => {
    const raw = window.prompt("Enter payment mode (UPI or CASH):", "CASH");
    if (!raw) return;

    const normalized = raw.trim().toUpperCase();
    if (normalized !== "UPI" && normalized !== "CASH") {
      window.alert("Please enter only UPI or CASH.");
      return;
    }

    setBusyId(row.id);
    try {
      await fetch(`/api/submissions/${row.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMode: normalized }),
      });
      await fetchRows();
    } finally {
      setBusyId(null);
    }
  };

  const renderActions = (row: SubmissionRecord) => {
    if (role !== "admin") {
      return <span className="text-xs text-slate-500">Viewer mode (read-only)</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {row.status === "pending" && (
          <>
            <button
              type="button"
              onClick={() => openTokenWhatsApp(row)}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
            >
              Send Token
            </button>
            <button
              type="button"
              disabled={busyId === row.id}
              onClick={() => directComplete(row)}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {busyId === row.id ? "Saving..." : "Direct Complete"}
            </button>
          </>
        )}

        {row.status === "token_sent" && (
          <>
            <button
              type="button"
              onClick={() => openTokenWhatsApp(row)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Resend Token
            </button>
            <select
              value={paymentModes[row.id] ?? "CASH"}
              onChange={(event) => {
                const mode = event.target.value as "CASH" | "UPI";
                setPaymentModes((prev) => ({ ...prev, [row.id]: mode }));
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
            </select>
            <button
              type="button"
              onClick={() => openPaymentWhatsApp(row)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Send Payment
            </button>
            <button
              type="button"
              disabled={busyId === row.id}
              onClick={() => markCompleted(row.id)}
              className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {busyId === row.id ? "Saving..." : "Mark Completed"}
            </button>
          </>
        )}

        {row.status === "completed" && (
          <>
            <span className="text-xs text-emerald-700">Done</span>
            <button
              type="button"
              onClick={() => openTokenWhatsApp(row)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Resend Token
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <AppSidebar />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 pl-14 sm:px-6 sm:pl-16 lg:px-8 lg:pl-20">
      <section className="card mb-6 p-6">
        <h1 className="text-2xl font-bold">Notebook Token Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Live view for form submissions, token messaging, and payment completion.
        </p>
        <p className="mt-1 text-xs text-slate-500">Signed in as: {role}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "pending", "token_sent", "completed"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filter === value
                  ? "bg-accent text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {value.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={tokenQuery}
            onChange={(event) => setTokenQuery(event.target.value)}
            placeholder="Filter by token (e.g. J-001)"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={nameQuery}
            onChange={(event) => setNameQuery(event.target.value)}
            placeholder="Filter by name"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dozens</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Loading submissions...
                  </td>
                </tr>
              )}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No data found.
                  </td>
                </tr>
              )}
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{row.tokenNumber ?? "-"}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.phone}</td>
                  <td className="px-4 py-3">{row.isJain ? "Jain" : "Non-Jain"}</td>
                  <td className="px-4 py-3">{row.dozens}</td>
                  <td className="px-4 py-3">Rs {row.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>
                      {row.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {renderActions(row)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {loading && <p className="py-6 text-center text-sm text-slate-500">Loading submissions...</p>}
          {!loading && filteredRows.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">No data found.</p>
          )}
          {filteredRows.map((row) => (
            <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                <span className={`rounded px-2 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>
                  {row.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">Token: {row.tokenNumber ?? "-"}</p>
              <p className="mt-1 text-xs text-slate-600">Phone: {row.phone}</p>
              <p className="mt-1 text-xs text-slate-600">
                {row.isJain ? "Jain" : "Non-Jain"} | {row.dozens} dozens | Rs {row.amount}
              </p>
              <div className="mt-3">{renderActions(row)}</div>
            </article>
          ))}
        </div>
      </section>
      </main>
    </>
  );
}
