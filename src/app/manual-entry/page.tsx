"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/app-sidebar";

type SubmitState = {
  loading: boolean;
  error: string;
  success: string;
};

type UserRole = "admin" | "viewer";

export default function ManualEntryPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isJain, setIsJain] = useState(true);
  const [dozens, setDozens] = useState(1);
  const [notes, setNotes] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [state, setState] = useState<SubmitState>({
    loading: false,
    error: "",
    success: "",
  });

  const resetForm = () => {
    setName("");
    setPhone("");
    setIsJain(true);
    setDozens(1);
    setNotes("");
  };

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
      setState({ loading: false, error: "Viewer role cannot create entries.", success: "" });
      return;
    }

    setState({ loading: true, error: "", success: "" });

    const response = await fetch("/api/manual-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        isJain,
        dozens,
        notes: notes || undefined,
      }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      tokenNumber?: string;
    };

    if (!response.ok) {
      setState({
        loading: false,
        error: result.error ?? "Failed to create entry.",
        success: "",
      });
      return;
    }

    setState({
      loading: false,
      error: "",
      success: `Created successfully. Token: ${result.tokenNumber ?? "-"}`,
    });
    resetForm();
  };

  return (
    <>
      <AppSidebar />
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 pl-14 sm:px-6 sm:pl-16 lg:px-8 lg:pl-20">
      <section className="card mb-6 p-6">
        <h1 className="text-2xl font-bold">Manual Entry</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add a submission directly from app without filling Google Form.
        </p>
        <p className="mt-1 text-xs text-slate-500">Signed in as: {role}</p>
      </section>

      <section className="card p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">WhatsApp Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="10 digit number"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select
              value={isJain ? "jain" : "non_jain"}
              onChange={(event) => setIsJain(event.target.value === "jain")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="jain">Jain</option>
              <option value="non_jain">Non-Jain</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dozens</label>
            <input
              type="number"
              required
              min={1}
              value={dozens}
              onChange={(event) => setDozens(Number(event.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
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
            {role !== "admin" ? "Viewer cannot submit" : state.loading ? "Saving..." : "Create Submission"}
          </button>
        </form>
      </section>
      </main>
    </>
  );
}
