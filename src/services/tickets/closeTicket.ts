import {
    Guild,
    GuildTextBasedChannel,
    TextChannel,
    AttachmentBuilder,
    FileBuilder,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    time,
    TimestampStyles,
} from "discord.js";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { createTranscript, ExportReturnType } from "discord-html-transcripts";

export async function closeTicket({
    guild,
    channel,
    ticket,
    actor,
    client,
}: {
    guild: Guild;
    channel: GuildTextBasedChannel;
    ticket: any;
    actor: any;
    client: any;
}) {
    await db
        .update(tickets)
        .set({ status: "CLOSING" })
        .where(eq(tickets.id, ticket.id));

    await channel.send({
        components: [
            new ContainerBuilder()
                .setAccentColor(env.ACCENT_COLOR)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            (t) => t.setContent(`### Ticket Closed`),
                            (t) =>
                                t.setContent(
                                    `<:channel:1315248776398766161> **Ticket ID**\n\`${ticket.id}\``,
                                ),
                            (t) =>
                                t.setContent(
                                    `<:member:1315248772527423551> **Creator**\n<@${ticket.discordUserId}> - \`${ticket.discordUserId}\`\n` +
                                        `<:shield:1466354394563088395> **Closed By**\n${actor} - \`${actor.id}\``,
                                ),
                        )
                        .setThumbnailAccessory((th) =>
                            th.setURL(
                                guild.iconURL({ size: 128 }) ??
                                    "https://cdn.discordapp.com/embed/avatars/0.png",
                            ),
                        ),
                )
                .addTextDisplayComponents((t) =>
                    t.setContent(
                        `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                    ),
                ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] },
    });

    let transcriptAttachment: AttachmentBuilder | null = null;
    let transcriptFileComponent: FileBuilder | null = null;

    try {
        const buffer = await createTranscript(channel as TextChannel, {
            limit: -1,
            returnType: ExportReturnType.Buffer,
            saveImages: true,
            poweredBy: false,
        });

        const fileName = `ticket-${ticket.id}.html`;

        transcriptAttachment = new AttachmentBuilder(buffer).setName(fileName);
        transcriptFileComponent = new FileBuilder().setURL(
            `attachment://${fileName}`,
        );

        logger.info(
            `[TICKET_TRANSCRIPT] Generated transcript for ticket #${ticket.id}`,
        );
    } catch (err) {
        logger.error(
            err,
            `[TICKET_TRANSCRIPT] Failed to generate transcript for ticket #${ticket.id}`,
        );
    }

    const dumpChannel = guild.channels.cache.get(
        env.TRANSCRIPT_DUMPING_CHANNEL,
    );

    if (dumpChannel?.isTextBased() && transcriptAttachment) {
        const dumpMessage = await dumpChannel.send({
            content: `**Transcript of \`${ticket.id}\`**`,
            files: [transcriptAttachment],
        });

        const transcriptUrl = dumpMessage.attachments.first()?.url;

        if (transcriptUrl) {
            await db
                .update(tickets)
                .set({ transcriptUrl })
                .where(eq(tickets.id, ticket.id));
        }
    }

    if (transcriptAttachment && transcriptFileComponent) {
        try {
            const user = await client.users.fetch(ticket.discordUserId);

            await user.send({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(env.ACCENT_COLOR)
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(
                                    (t) =>
                                        t.setContent(
                                            `### Your Ticket Was Closed`,
                                        ),
                                    (t) =>
                                        t.setContent(
                                            `<:channel:1315248776398766161> **Ticket ID**\n\`${ticket.id}\``,
                                        ),
                                    (t) =>
                                        t.setContent(
                                            `<:shield:1466354394563088395> **Closed By**\n${actor} - \`${actor.id}\``,
                                        ),
                                )
                                .setThumbnailAccessory((th) =>
                                    th.setURL(
                                        channel.guild?.iconURL({
                                            size: 128,
                                        }) ??
                                            "https://cdn.discordapp.com/embed/avatars/0.png",
                                    ),
                                ),
                        )
                        .addTextDisplayComponents((t) =>
                            t.setContent(
                                `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                            ),
                        ),
                    transcriptFileComponent,
                ],
                files: [transcriptAttachment],
                flags: MessageFlags.IsComponentsV2,
            });
        } catch (err) {
            logger.warn(
                `[TICKET_TRANSCRIPT] Failed to DM transcript of ticket #${ticket.id} to user ${ticket.discordUserId}`,
            );
        }

        const logsChannel = guild.channels.cache.get(env.TICKET_LOGS_CHANNEL);
        if (logsChannel?.isTextBased()) {
            await logsChannel.send({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(env.ACCENT_COLOR)
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(
                                    (t) => t.setContent(`### Ticket Closed`),
                                    (t) =>
                                        t.setContent(
                                            `<:channel:1315248776398766161> **Ticket ID**\n\`${ticket.id}\``,
                                        ),
                                    (t) =>
                                        t.setContent(
                                            `<:member:1315248772527423551> **Creator**\n<@${ticket.discordUserId}> - \`$${ticket.discordUserId}\`\n` +
                                                `<:shield:1466354394563088395> **Closed By**\n${actor} - \`${actor.id}\``,
                                        ),
                                )
                                .setThumbnailAccessory((th) =>
                                    th.setURL(
                                        channel.guild?.iconURL({
                                            size: 128,
                                        }) ??
                                            "https://cdn.discordapp.com/embed/avatars/0.png",
                                    ),
                                ),
                        )
                        .addTextDisplayComponents((t) =>
                            t.setContent(
                                `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                            ),
                        ),
                    transcriptFileComponent,
                ],
                files: [transcriptAttachment],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] },
            });
        }
    }

    await channel.delete(`Ticket closed & archived (ID: ${ticket.id})`);

    await db
        .update(tickets)
        .set({ status: "CLOSED", closedAt: new Date() })
        .where(eq(tickets.id, ticket.id));

    logger.info(
        `[TICKET_CLOSE] Ticket #${ticket.id} closed by ${actor.username} (${actor.id})`,
    );
}
