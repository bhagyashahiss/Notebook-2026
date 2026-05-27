"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SubmissionRecord } from "@/types/submission";

type Segment = {
  label: string;
  value: number;
  color: string;
};

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN")}`;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function DonutChart({
  title,
  totalLabel,
  totalValue,
  segments,
}: {
  title: string;
  totalLabel: string;
  totalValue: string;
  segments: Segment[];
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  let cumulative = 0;
  const gradientParts = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const start = total > 0 ? (cumulative / total) * 360 : 0;
      cumulative += segment.value;
      const end = total > 0 ? (cumulative / total) * 360 : 0;
      return `${segment.color} ${start}deg ${end}deg`;
    });

  const background =
    gradientParts.length > 0
      ? `conic-gradient(${gradientParts.join(",")})`
      : "conic-gradient(#e2e8f0 0deg 360deg)";

  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>

      <div className="mt-5 flex flex-col items-center gap-6 md:flex-row md:items-start">
        <div className="relative h-44 w-44 shrink-0 rounded-full" style={{ background }}>
          <div className="absolute inset-6 flex items-center justify-center rounded-full bg-white text-center">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{totalLabel}</p>
              <p className="mt-1 text-xl font-black text-slate-900">{totalValue}</p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          {segments.map((segment) => {
            const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;

            return (
              <div key={segment.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="font-medium text-slate-700">{segment.label}</span>
                  </div>
                  <span className="text-slate-600">{segment.value} ({percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${percentage}%`, backgroundColor: segment.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StackedBar({ title, segments }: { title: string; segments: Segment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-4 w-full">
          {segments.map((segment) => {
            const width = total > 0 ? (segment.value / total) * 100 : 0;
            return (
              <div
                key={segment.label}
                style={{ width: `${width}%`, backgroundColor: segment.color }}
                className="h-4"
              />
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {segments.map((segment) => {
          const pct = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          return (
            <div key={segment.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </div>
              <p className="mt-1 text-lg font-black text-slate-900">{segment.value}</p>
              <p className="text-xs text-slate-500">{pct}% of total</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function SummaryPage() {
  const [rows, setRows] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const response = await fetch("/api/submissions", { cache: "no-store" });

        if (response.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent("/summary")}`;
          return;
        }

        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = (await response.json()) as { submissions?: SubmissionRecord[] };
        setRows(Array.isArray(data.submissions) ? data.submissions : []);
      } catch {
        // Keep existing state if fetch fails temporarily.
      } finally {
        setLoading(false);
      }
    };

    void fetchRows();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((row) => row.status === "pending").length;
    const tokenSent = rows.filter((row) => row.status === "token_sent").length;
    const completed = rows.filter((row) => row.status === "completed").length;

    const jain = rows.filter((row) => row.isJain).length;
    const nonJain = rows.filter((row) => !row.isJain).length;

    const totalDozens = rows.reduce((sum, row) => sum + row.dozens, 0);
    const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const completedAmount = rows
      .filter((row) => row.status === "completed")
      .reduce((sum, row) => sum + row.amount, 0);

    const jainDozens = rows.filter((row) => row.isJain).reduce((sum, row) => sum + row.dozens, 0);
    const nonJainDozens = rows
      .filter((row) => !row.isJain)
      .reduce((sum, row) => sum + row.dozens, 0);

    const completedRows = rows.filter((row) => row.status === "completed");
    const cashCompleted = completedRows.filter((row) =>
      (row.notes ?? "").toUpperCase().includes("PAYMENT MODE: CASH"),
    );
    const upiCompleted = completedRows.filter((row) =>
      (row.notes ?? "").toUpperCase().includes("PAYMENT MODE: UPI"),
    );

    const cashCount = cashCompleted.length;
    const upiCount = upiCompleted.length;
    const cashAmount = cashCompleted.reduce((sum, row) => sum + row.amount, 0);
    const upiAmount = upiCompleted.reduce((sum, row) => sum + row.amount, 0);
    const unknownPaymentCount = completedRows.length - (cashCount + upiCount);
    const unknownPaymentAmount = completedAmount - (cashAmount + upiAmount);

    const statusSegments: Segment[] = [
      { label: "Pending", value: pending, color: "#f59e0b" },
      { label: "Token Sent", value: tokenSent, color: "#0ea5e9" },
      { label: "Completed", value: completed, color: "#22c55e" },
    ];

    const bookSegments: Segment[] = [
      { label: "Jain Dozens", value: jainDozens, color: "#0284c7" },
      { label: "Non-Jain Dozens", value: nonJainDozens, color: "#f97316" },
    ];

    const paymentCountSegments: Segment[] = [
      { label: "CASH", value: cashCount, color: "#10b981" },
      { label: "UPI", value: upiCount, color: "#3b82f6" },
      { label: "Unknown", value: Math.max(0, unknownPaymentCount), color: "#94a3b8" },
    ];

    const paymentAmountSegments: Segment[] = [
      { label: "CASH", value: cashAmount, color: "#10b981" },
      { label: "UPI", value: upiAmount, color: "#3b82f6" },
      { label: "Unknown", value: Math.max(0, unknownPaymentAmount), color: "#94a3b8" },
    ];

    return {
      total,
      pending,
      tokenSent,
      completed,
      completionRate,
      jain,
      nonJain,
      totalDozens,
      jainDozens,
      nonJainDozens,
      totalAmount,
      completedAmount,
      cashCount,
      upiCount,
      cashAmount,
      upiAmount,
      unknownPaymentCount,
      unknownPaymentAmount,
      statusSegments,
      bookSegments,
      paymentCountSegments,
      paymentAmountSegments,
    };
  }, [rows]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.13),transparent_32%)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-lg shadow-slate-200/50 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Event Summary</h1>
            <p className="mt-1 text-sm text-slate-600">Live analytics for bookings, books, and collections.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/manual-entry"
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Manual Entry
            </Link>
            <Link
              href="/undo"
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Undo
            </Link>
            <Link
              href="/update-phone"
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Update Phone
            </Link>
            <Link
              href="/"
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Back To Dashboard
            </Link>
            <a
              href="/api/auth/logout"
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Logout
            </a>
          </div>
        </div>

        {!loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Registrations" value={stats.total} />
            <StatCard label="Completion Rate" value={`${stats.completionRate}%`} />
            <StatCard label="Total Books" value={`${stats.totalDozens} Dozens`} />
            <StatCard label="Total Amount" value={formatCurrency(stats.totalAmount)} />
          </div>
        ) : null}
      </section>

      {loading ? (
        <section className="card p-6 text-slate-500">Loading summary...</section>
      ) : (
        <div className="space-y-5">
          <StackedBar title="Submission Pipeline" segments={stats.statusSegments} />

          <div className="grid gap-5 lg:grid-cols-2">
            <DonutChart
              title="Books Bifurcation (Dozens)"
              totalLabel="Total Dozens"
              totalValue={String(stats.totalDozens)}
              segments={stats.bookSegments}
            />
            <section className="card p-6">
              <h2 className="text-lg font-bold text-slate-900">Jain vs Non-Jain Snapshot</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <StatCard
                  label="Jain Registrations"
                  value={stats.jain}
                  hint={`${stats.jainDozens} dozens booked`}
                />
                <StatCard
                  label="Non-Jain Registrations"
                  value={stats.nonJain}
                  hint={`${stats.nonJainDozens} dozens booked`}
                />
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Books Split</p>
                <p className="mt-1">
                  Jain: <span className="font-bold">{stats.jainDozens}</span> dozens | Non-Jain:{" "}
                  <span className="font-bold">{stats.nonJainDozens}</span> dozens
                </p>
              </div>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <DonutChart
              title="Payment Distribution (Completed Count)"
              totalLabel="Completed"
              totalValue={String(stats.completed)}
              segments={stats.paymentCountSegments}
            />
            <DonutChart
              title="Payment Distribution (Amount)"
              totalLabel="Collected"
              totalValue={formatCurrency(stats.completedAmount)}
              segments={stats.paymentAmountSegments}
            />
          </div>
        </div>
      )}
    </main>
  );
}
