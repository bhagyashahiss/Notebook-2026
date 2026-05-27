import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishSubmissionChange } from "@/lib/events";
import { allocateToken } from "@/lib/token";
import { normalizeFormPayload } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.APP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const normalized = normalizeFormPayload(json);
  if (!normalized.ok) {
    return NextResponse.json(
      { error: normalized.error, details: normalized.details ?? null },
      { status: 400 },
    );
  }

  const payload = normalized.data;
  const amount = payload.dozens * 200;

  const existing = await prisma.submission.findUnique({
    where: { responseKey: payload.responseKey },
  });

  if (existing) {
    return NextResponse.json({ ok: true, submissionId: existing.id, duplicate: true });
  }

  const submission = await prisma.$transaction(async (tx) => {
    const tokenNumber = await allocateToken(tx, payload.isJain);

    return tx.submission.create({
      data: {
        responseKey: payload.responseKey,
        name: payload.name,
        phone: payload.phone,
        isJain: payload.isJain,
        dozens: payload.dozens,
        amount,
        notes: payload.notes,
        tokenNumber,
        status: "pending",
      },
    });
  });

  publishSubmissionChange(submission.id);

  return NextResponse.json({
    ok: true,
    submissionId: submission.id,
    tokenNumber: submission.tokenNumber,
    status: "pending",
  });
}
