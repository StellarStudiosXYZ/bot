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
import { sql } from "drizzle-orm";
import { env } from "@/config/env";

export const command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping Pong!"),

    async execute(interaction: ChatInputCommandInteraction) {
        const start = Date.now();
        await interaction.deferReply();

        const apiLatency = Date.now() - start;

        let dbLatency: number | "Unavailable";
        try {
            const dbStart = Date.now();
            await db.execute(sql`select 1`);
            dbLatency = Date.now() - dbStart;
        } catch {
            dbLatency = "Unavailable";
        }

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) => t.setContent(`🏓 **Pong!**`),
                        (t) => t.setContent(`**Discord**\n\`${apiLatency}ms\``),
                        (t) =>
                            t.setContent(
                                `**Database**\n\`${
                                    typeof dbLatency === "number"
                                        ? `${dbLatency}ms`
                                        : dbLatency
                                }\``,
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            interaction.guild!.iconURL() ??
                                "https://cdn.discordapp.com/embed/avatars/0.png",
                        ),
                    ),
            )
            .addTextDisplayComponents((t) =>
                t.setContent(
                    `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                ),
            );

        await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
