import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishSubmissionChange } from "@/lib/events";

export const runtime = "nodejs";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function PATCH(request: NextRequest) {
  const json = await request.json().catch(() => ({}));

  const tokenNumber =
    typeof json?.tokenNumber === "string" ? json.tokenNumber.trim().toUpperCase() : "";
  const newPhoneRaw = typeof json?.phone === "string" ? json.phone : "";
  const phone = normalizePhone(newPhoneRaw);

  if (!tokenNumber) {
    return NextResponse.json({ error: "tokenNumber is required" }, { status: 400 });
  }

  if (phone.length < 10) {
    return NextResponse.json({ error: "Valid phone is required" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({ where: { tokenNumber } });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found for token" }, { status: 404 });
  }

  const previousPhone = submission.phone;
  const note = `Phone updated: ${previousPhone} -> ${phone} (${new Date().toISOString()})`;
  const existingNotes = (submission.notes ?? "").trim();

  const updated = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      phone,
      notes: [note, existingNotes].filter(Boolean).join(" | ") || null,
    },
  });

  publishSubmissionChange(updated.id);

  return NextResponse.json({
    ok: true,
    tokenNumber: updated.tokenNumber,
    phone: updated.phone,
    status: updated.status,
  });
}
