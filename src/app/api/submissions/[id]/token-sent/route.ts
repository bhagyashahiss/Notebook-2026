import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishSubmissionChange } from "@/lib/events";

export const runtime = "nodejs";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json({ ok: true, alreadyUpdated: true });
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: { status: "token_sent" },
  });

  publishSubmissionChange(updated.id);

  return NextResponse.json({ ok: true, status: updated.status });
}
