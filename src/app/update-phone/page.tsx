"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UserRole = "admin" | "viewer";

type FormState = {
  loading: boolean;
  error: string;
  success: string;
};

export default function UpdatePhonePage() {
  const [tokenNumber, setTokenNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [state, setState] = useState<FormState>({
    loading: false,
    error: "",
    success: "",
  });

  useEffect(() => {
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
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (role !== "admin") {
      setState({ loading: false, error: "Viewer role cannot update phone.", success: "" });
      return;
    }

    setState({ loading: true, error: "", success: "" });

    const response = await fetch("/api/submissions/update-phone-by-token", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenNumber, phone }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      tokenNumber?: string;
      phone?: string;
    };

    if (!response.ok) {
      setState({
        loading: false,
        error: result.error ?? "Failed to update phone.",
        success: "",
      });
      return;
    }

    setState({
      loading: false,
      error: "",
      success: `Updated ${result.tokenNumber ?? tokenNumber.toUpperCase()} to ${result.phone ?? phone}`,
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="card mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Update Phone</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Dashboard
            </Link>
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
              href="/summary"
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Summary
            </Link>
            <a
              href="/api/auth/logout"
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Logout
            </a>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Enter token number and new phone number to update contact details.
        </p>
        <p className="mt-1 text-xs text-slate-500">Signed in as: {role}</p>
      </section>

      <section className="card p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Token Number</label>
            <input
              type="text"
              required
              value={tokenNumber}
              onChange={(event) => setTokenNumber(event.target.value.toUpperCase())}
              placeholder="Example: J-001"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Example: 9876543210"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

          <button
            type="submit"
            disabled={state.loading || role !== "admin"}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {role !== "admin"
              ? "Viewer cannot update"
              : state.loading
                ? "Updating..."
                : "Update Phone"}
          </button>
        </form>
      </section>
    </main>
  );
}
