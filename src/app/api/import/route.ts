import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { allocateToken } from "@/lib/token";
import { normalizeFormPayload } from "@/lib/validation";
import { publishSubmissionChange } from "@/lib/events";

export const runtime = "nodejs";

/**
 * POST /api/import
 * Accepts an array of Google Form row objects (same format as the form-submit webhook).
 * Used to bulk-import existing responses.
 * 
 * Body: { rows: Array<GoogleFormRow>, secret: string }
 */
export async function POST(request: NextRequest) {
  const json = await request.json();
  const { rows, secret } = json as { rows: unknown[]; secret: string };

  if (!secret || secret !== process.env.APP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
  }

  const results: Array<{ index: number; ok: boolean; error?: string; tokenNumber?: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const normalized = normalizeFormPayload(rows[i]);
    if (!normalized.ok) {
      results.push({ index: i, ok: false, error: normalized.error });
      continue;
    }

    const payload = normalized.data;
    const amount = payload.dozens * 200;

    const existing = await prisma.submission.findUnique({
      where: { responseKey: payload.responseKey },
    });

    if (existing) {
      results.push({ index: i, ok: true, tokenNumber: existing.tokenNumber ?? undefined });
      continue;
    }

    try {
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
      results.push({ index: i, ok: true, tokenNumber: submission.tokenNumber ?? undefined });
    } catch (err) {
      results.push({
        index: i,
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const imported = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({ imported, failed, results });
}
