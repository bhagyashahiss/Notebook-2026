import { z } from "zod";

export const formSubmissionSchema = z.object({
  responseKey: z.string().min(3),
  name: z.string().min(1),
  phone: z.string().min(10),
  isJain: z.boolean(),
  dozens: z.number().int().positive(),
  notes: z.string().optional(),
});

export const markCompleteSchema = z.object({
  notes: z.string().optional(),
  paymentMode: z.enum(["CASH", "UPI"]).default("CASH"),
});

export type FormSubmissionPayload = z.infer<typeof formSubmissionSchema>;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function asText(value: unknown): string {
  if (Array.isArray(value)) {
    return asText(value[0]);
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return "";
}

function parseDozens(primary: string, secondary: string): number | null {
  const candidates = [primary, secondary];
  for (const candidate of candidates) {
    const direct = Number(candidate);
    if (Number.isInteger(direct) && direct > 0) {
      return direct;
    }

    const matched = candidate.match(/(\d+)/);
    if (matched) {
      const parsed = Number(matched[1]);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return null;
}

export function normalizeFormPayload(input: unknown):
  | { ok: true; data: FormSubmissionPayload }
  | { ok: false; error: string; details?: unknown } {
  const maybeRecord = asRecord(input);
  if (!maybeRecord) {
    return { ok: false, error: "Payload is not an object" };
  }

  const normalizedAttempt = formSubmissionSchema.safeParse(input);
  if (normalizedAttempt.success) {
    return { ok: true, data: normalizedAttempt.data };
  }

  const timestamp = asText(maybeRecord["Timestamp"]);
  const email = asText(maybeRecord["Email Address"]);
  const firstName = asText(maybeRecord["First Name"]);
  const middleName = asText(maybeRecord["Middle Name"]);
  const lastName = asText(maybeRecord["Last Name"]);
  const phone = asText(maybeRecord["WhatsApp Mobile Number"]);
  const jainRaw = asText(maybeRecord["Are you Jain?"]).toLowerCase();
  const dozenPrimary = asText(maybeRecord["Select Number of Dozen"]);
  const dozenSecondary = asText(maybeRecord["Select Number of Dozen 2"]);
  const grade = asText(maybeRecord["Current Standard/Grade"]);
  const address = asText(maybeRecord["Short Address"]);
  const marksheet = asText(
    maybeRecord[
      "Upload recent Marksheet (If current year result is not available then please upload previous year result)"
    ],
  );

  const dozens = parseDozens(dozenPrimary, dozenSecondary);
  if (!phone || !firstName || !timestamp || !dozens) {
    return {
      ok: false,
      error: "Missing required Google Form fields",
      details: {
        timestamp,
        firstName,
        phone,
        dozenPrimary,
        dozenSecondary,
      },
    };
  }

  const name = [firstName, middleName, lastName].filter(Boolean).join(" ");
  const isJain = jainRaw === "yes" || jainRaw === "true";
  const responseKey = [timestamp, phone, email || name].filter(Boolean).join("|");
  const notes = [
    email ? `Email: ${email}` : "",
    grade ? `Grade: ${grade}` : "",
    address ? `Address: ${address}` : "",
    marksheet ? `Marksheet: ${marksheet}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const finalParse = formSubmissionSchema.safeParse({
    responseKey,
    name,
    phone,
    isJain,
    dozens,
    notes: notes || undefined,
  });

  if (!finalParse.success) {
    return {
      ok: false,
      error: "Normalized payload did not pass validation",
      details: finalParse.error.flatten(),
    };
  }

  return { ok: true, data: finalParse.data };
}
