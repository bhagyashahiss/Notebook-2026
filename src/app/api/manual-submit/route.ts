import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishSubmissionChange } from "@/lib/events";
import { allocateToken } from "@/lib/token";
import { manualSubmissionSchema } from "@/lib/validation";

export const runtime = "nodejs";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => ({}));
  const parsed = manualSubmissionSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const amount = payload.dozens * 200;
  const phone = normalizePhone(payload.phone);
  const responseKey = ["manual", Date.now().toString(), phone, payload.name].join("|");

  const submission = await prisma.$transaction(async (tx) => {
    const tokenNumber = await allocateToken(tx, payload.isJain);

    return tx.submission.create({
      data: {
        responseKey,
        name: payload.name.trim(),
        phone,
        isJain: payload.isJain,
        dozens: payload.dozens,
        amount,
        notes: payload.notes?.trim() || null,
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
    status: submission.status,
  });
}
