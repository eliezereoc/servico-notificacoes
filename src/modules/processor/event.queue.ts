import { prisma } from "../../shared/infra/prisma.js";

const MAX_ATTEMPTS = 5;

export async function getNextPendingEvent() {
  return await prisma.event.findFirst({
    where: {
      status: 'PENDING',
      attempts: { lt: MAX_ATTEMPTS }
    },
    orderBy: { createdAt: 'asc' }
  });
}
