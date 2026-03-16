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

function formatUptime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

export const command = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Ping Pong!"),

  async execute(interaction: ChatInputCommandInteraction) {
    const start = Date.now();
    const discord = Date.now() - interaction.createdTimestamp;
    const websocket = interaction.client.ws.ping;
    await interaction.deferReply();
    const user = Date.now() - start;
    const dbStart = performance.now();
    await db.execute(sql`select 1`);
    const database = performance.now() - dbStart;

    const uptime = interaction.client.uptime ?? process.uptime() * 1000;

    const container = new ContainerBuilder()
      .setAccentColor(env.ACCENT_COLOR)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents((t) => t.setContent(`🏓 **Pong!**`))
          .addTextDisplayComponents((t) =>
            t.setContent(
              `**User**\n\`${user}ms\`\n` +
                `**Discord**\n\`${discord}ms\`\n` +
                `**Websocket**\n\`${websocket}ms\`\n` +
                `**Database**\n\`${database.toFixed(2)}ms\`\n` +
                `**Uptime**\n\`${formatUptime(uptime)}\``,
            ),
          )
          .setThumbnailAccessory((th) =>
            th.setURL(interaction.client.user.displayAvatarURL()),
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
