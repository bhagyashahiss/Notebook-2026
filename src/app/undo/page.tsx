"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/app-sidebar";

type UndoState = {
  loading: boolean;
  error: string;
  success: string;
};

type UserRole = "admin" | "viewer";

export default function UndoPage() {
  const [tokenNumber, setTokenNumber] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [state, setState] = useState<UndoState>({
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

  const onUndo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (role !== "admin") {
      setState({ loading: false, error: "Viewer role cannot revert status.", success: "" });
      return;
    }

    setState({ loading: true, error: "", success: "" });

    const response = await fetch("/api/submissions/revert-by-token", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenNumber }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      alreadyPending?: boolean;
      status?: string;
      tokenNumber?: string;
    };

    if (!response.ok) {
      setState({
        loading: false,
        error: result.error ?? "Undo failed.",
        success: "",
      });
      return;
    }

    if (result.alreadyPending) {
      setState({
        loading: false,
        error: "",
        success: `Token ${tokenNumber.toUpperCase()} is already pending.`,
      });
      return;
    }

    setState({
      loading: false,
      error: "",
      success: `Done. ${result.tokenNumber ?? tokenNumber.toUpperCase()} reverted to ${result.status}.`,
    });
  };

  return (
    <>
      <AppSidebar />
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 pl-14 sm:px-6 sm:pl-16 lg:px-8 lg:pl-20">
      <section className="card mb-6 p-6">
        <h1 className="text-2xl font-bold">Undo Operation</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter token number to revert a submission from completed/token_sent back to pending.
        </p>
        <p className="mt-1 text-xs text-slate-500">Signed in as: {role}</p>
      </section>

      <section className="card p-6">
        <form onSubmit={onUndo} className="space-y-4">
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

          {state.error ? <p className="text-sm text-rose-700">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

          <button
            type="submit"
            disabled={state.loading || role !== "admin"}
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {role !== "admin" ? "Viewer cannot revert" : state.loading ? "Reverting..." : "Revert To Pending"}
          </button>
        </form>
      </section>
      </main>
    </>
  );
}
