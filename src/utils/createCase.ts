import { randomBytes } from "crypto";
import { db } from "@/db";
import { cases } from "@/db/schema";
import type { InferInsertModel } from "drizzle-orm";

type CaseAction = InferInsertModel<typeof cases>["action"];

export async function createCase(data: {
    action: CaseAction;
    targetUserId: string;
    moderatorUserId: string;
    reason: string;
    attachment?: string | null;
    duration?: number | null;
}) {
    const caseId = randomBytes(4).toString("hex");

    await db.insert(cases).values({
        id: caseId,
        action: data.action,
        targetUserId: data.targetUserId,
        moderatorUserId: data.moderatorUserId,
        reason: data.reason,
        attachment: data.attachment ?? null,
        duration: data.duration ?? null,
    });

    return caseId;
}
