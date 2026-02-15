import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping Pong!"),

    async execute(interaction: ChatInputCommandInteraction) {
        const start = Date.now();
        await interaction.deferReply();

        const wsPing = interaction.client.ws.ping;
        const apiLatency = Date.now() - start;
        let dbLatency: number | string;

        try {
            const dbStart = Date.now();
            await db.execute(sql`select 1`);
            dbLatency = Date.now() - dbStart;
        } catch {
            dbLatency = "Error";
        }

        const embed = new EmbedBuilder()
            .setTitle("🏓 Pong!")
            .setColor(0x7040ff)
            .addFields(
                {
                    name: "Discord",
                    value: `${apiLatency}ms`,
                    inline: true,
                },
                {
                    name: "Database",
                    value:
                        typeof dbLatency === "number"
                            ? `${dbLatency}ms`
                            : "Unavailable",
                    inline: true,
                },
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
