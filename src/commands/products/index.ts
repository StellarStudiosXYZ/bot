import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { logger } from "@/utils/logger";

import { command as list } from "@/commands/products/list";
import { command as linked } from "@/commands/products/linked";
import { command as link } from "@/commands/products/link";
import { command as linksourceXchange } from "@/commands/products/link-sourcexchange";
import { command as linkBuiltByBit } from "@/commands/products/link-builtbybit";

const subcommands = {
    list,
    linked,
    link,
    "link-sourcexchange": linksourceXchange,
    "link-builtbybit": linkBuiltByBit,
};

export const command = {
    data: new SlashCommandBuilder()
        .setName("product")
        .setDescription("Product related commands")
        .addSubcommand(list.data)
        .addSubcommand(linked.data)
        .addSubcommand(link.data)
        .addSubcommand(linksourceXchange.data)
        .addSubcommand(linkBuiltByBit.data),

    async execute(interaction: ChatInputCommandInteraction) {
        const sub = interaction.options.getSubcommand();

        const handler = subcommands[sub as keyof typeof subcommands];

        if (!handler) {
            logger.warn(`[PRODUCT_COMMAND] Unknown subcommand: ${sub}`);
            return;
        }

        return handler.execute(interaction);
    },
};
