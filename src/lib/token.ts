import { Prisma, type PrismaClient } from "@prisma/client";

function buildToken(prefix: "J" | "N", sequence: number): string {
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

export async function allocateToken(
  tx: Prisma.TransactionClient | PrismaClient,
  isJain: boolean,
): Promise<string> {
  const counterId = isJain ? "J" : "N";
  const nextCounter = await tx.counter.upsert({
    where: { id: counterId },
    create: { id: counterId, value: 1 },
    update: { value: { increment: 1 } },
  });

  return buildToken(counterId as "J" | "N", nextCounter.value);
}
