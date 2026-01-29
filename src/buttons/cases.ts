import {
    ButtonInteraction,
    ContainerBuilder,
    SectionBuilder,
    time,
    TimestampStyles,
    MessageFlags,
} from "discord.js";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { buildPaginationRow } from "@/utils/pagination";
import { env } from "@/config/env";

const PAGE_SIZE = 1;

export async function handleCasesButton(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith("cases:")) return;

    await interaction.deferUpdate();
    const guild = interaction.guild;

    const [, , pageStr] = interaction.customId.split(":");
    const page = Math.max(1, Number(pageStr) || 1);

    const footer = interaction.message.components
        .flatMap((r: any) => r.components)
        .find((c: any) => c.content?.startsWith("-# User ID:"));

    const userId = footer?.content?.replace("-# User ID:", "").trim();
    if (!userId) return;

    const offset = (page - 1) * PAGE_SIZE;

    const total = await db
        .select({ count: count(cases.id) })
        .from(cases)
        .where(eq(cases.targetUserId, userId))
        .then((r) => r[0].count);

    const [result] = await db
        .select()
        .from(cases)
        .where(eq(cases.targetUserId, userId))
        .orderBy(desc(cases.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset);

    if (!result) return;

    const container = new ContainerBuilder()
        .setAccentColor(env.ACCENT_COLOR)
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    (t) =>
                        t.setContent(
                            `<:judgement:1466353777387901032> **Action**\n\`${result.action}\`\n` +
                                `<:channel:1315248776398766161> **Case ID**\n\`${result.id}\``,
                        ),
                    (t) =>
                        t.setContent(
                            `<:member:1315248772527423551> **User**\n<@${result.targetUserId}>\n` +
                                `<:shield:1466354394563088395> **Moderator**\n<@${result.moderatorUserId}>`,
                        ),
                    (t) =>
                        t.setContent(
                            (result.duration
                                ? `\`⏱️\` **Duration**\n${result.duration}s\n`
                                : "") +
                                `\`⏱️\` **Action Time**\n${time(
                                    result.createdAt,
                                    TimestampStyles.FullDateShortTime,
                                )}\n` +
                                `<:content:1465235859874910269> **Reason**\n\`\`\`${result.reason}\`\`\`` +
                                (result.attachment
                                    ? `<:camera:1466384904064467101> **Attachment**\n${result.attachment}`
                                    : ""),
                        ),
                )
                .setThumbnailAccessory((th) =>
                    th.setURL(
                        guild?.iconURL() ?? interaction.user.displayAvatarURL(),
                    ),
                ),
        )
        .addTextDisplayComponents((t) => t.setContent(`-# User ID: ${userId}`));

    const paginationRow = buildPaginationRow(
        "cases",
        page,
        Math.ceil(total / PAGE_SIZE),
    );

    await interaction.editReply({
        components: [container, paginationRow],
        flags: MessageFlags.IsComponentsV2,
    });
}
