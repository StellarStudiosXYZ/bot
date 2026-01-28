import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function buildPaginationRow(
    namespace: string,
    page: number,
    totalPages: number,
) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`${namespace}:first:1`)
            .setEmoji("<:double_backward:1464980608420679958>")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),

        new ButtonBuilder()
            .setCustomId(`${namespace}:prev:${page - 1}`)
            .setEmoji("<:backward:1464980240278491415>")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),

        new ButtonBuilder()
            .setCustomId(`${namespace}:next:${page + 1}`)
            .setEmoji("<:forward:1464980242421645486>")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages),

        new ButtonBuilder()
            .setCustomId(`${namespace}:last:${totalPages}`)
            .setEmoji("<:double_forward:1464980610526216293>")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages),
    );
}
