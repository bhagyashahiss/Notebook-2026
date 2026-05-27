import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishSubmissionChange } from "@/lib/events";
import { markCompleteSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = markCompleteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.status === "completed") {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  const paymentNote = `Payment Mode: ${parsed.data.paymentMode}`;
  const customNote = (parsed.data.notes ?? "").trim();
  const previousNote = (submission.notes ?? "").trim();
  const mergedNotes = [paymentNote, customNote, previousNote].filter(Boolean).join(" | ");

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      status: "completed",
      notes: mergedNotes || null,
    },
  });

  publishSubmissionChange(updated.id);

  return NextResponse.json({
    ok: true,
    status: updated.status,
  });
}
