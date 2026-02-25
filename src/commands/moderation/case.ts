import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { errorContainer } from "@/utils/errorContainer";
import { buildPaginationRow } from "@/utils/pagination";
import { env } from "@/config/env";

const PAGE_SIZE = 1;

export const command = {
    data: new SlashCommandBuilder()
        .setName("case")
        .setDescription("Moderation case commands")
        .addSubcommand((sub) =>
            sub
                .setName("view")
                .setDescription("View moderation cases")
                .addStringOption((opt) =>
                    opt
                        .setName("id")
                        .setDescription("Case ID"),
                )
                .addUserOption((opt) =>
                    opt
                        .setName("user")
                        .setDescription("View all cases for a user"),
                ),
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const id = interaction.options.getString("id");
        const user = interaction.options.getUser("user");

        if (!id && !user) {
            return interaction.followUp(
                errorContainer("Provide either a Case ID or a User."),
            );
        }

        if (id && user) {
            return interaction.followUp(
                errorContainer("Provide only one: Case ID or User."),
            );
        }

        if (id) {
            const result = await db.query.cases.findFirst({
                where: eq(cases.id, id),
            });

            if (!result) {
                return interaction.editReply(errorContainer("No case found."));
            }

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
                                            ? `<:camera:1466384904064467101> **Attachment**\n${result.attachment}\n`
                                            : ""),
                                ),
                        )
                        .setThumbnailAccessory((th) =>
                            th.setURL(
                                guild?.iconURL() ??
                                    interaction.user.displayAvatarURL(),
                            ),
                        ),
                );

            return interaction.editReply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const page = 1;
        const offset = (page - 1) * PAGE_SIZE;

        const total = await db
            .select({ count: count(cases.id) })
            .from(cases)
            .where(eq(cases.targetUserId, user!.id))
            .then((r) => r[0].count);

        if (total === 0) {
            return interaction.editReply(
                errorContainer("This user has no cases."),
            );
        }

        const [result] = await db
            .select()
            .from(cases)
            .where(eq(cases.targetUserId, user!.id))
            .orderBy(desc(cases.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset);

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
                                        ? `<:camera:1466384904064467101> **Attachment**\n${result.attachment}\n`
                                        : ""),
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            guild?.iconURL() ??
                                interaction.user.displayAvatarURL(),
                        ),
                    ),
            )
            .addTextDisplayComponents((t) =>
                t.setContent(`-# User ID: ${user!.id}`),
            );

        const totalPages = Math.ceil(total / PAGE_SIZE);

        const paginationRow = buildPaginationRow("cases", page, totalPages);

        await interaction.editReply({
            components: [container, paginationRow],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
