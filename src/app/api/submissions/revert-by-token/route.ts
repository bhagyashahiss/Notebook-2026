import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishSubmissionChange } from "@/lib/events";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const json = await request.json().catch(() => ({}));
  const tokenNumber =
    typeof json?.tokenNumber === "string" ? json.tokenNumber.trim().toUpperCase() : "";

  if (!tokenNumber) {
    return NextResponse.json({ error: "tokenNumber is required" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({ where: { tokenNumber } });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found for token" }, { status: 404 });
  }

  if (submission.status === "pending") {
    return NextResponse.json({ ok: true, alreadyPending: true, submissionId: submission.id });
  }

  const existingNotes = (submission.notes ?? "").trim();
  const revertNote = `Reverted to pending (${new Date().toISOString()})`;
  const notes = [revertNote, existingNotes].filter(Boolean).join(" | ");

  const updated = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: "pending",
      notes: notes || null,
    },
  });

  publishSubmissionChange(updated.id);

  return NextResponse.json({
    ok: true,
    submissionId: updated.id,
    tokenNumber: updated.tokenNumber,
    status: updated.status,
  });
}
