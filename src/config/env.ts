import { z } from "zod";
import "dotenv/config";

export const env = z
    .object({
        DISCORD_BOT_ENV: z.string(),
        DISCORD_BOT_TOKEN: z.string(),
        DISCORD_CLIENT_ID: z.string(),
        DISCORD_GUILD_ID: z.string(),

        DATABASE_URL: z.string(),

        SOURCEXCHANGE_TOKEN: z.string(),
        BUILTBYBIT_TOKEN: z.string(),

        TICKET_CATEGORY: z.string(),

        DEMO_LOGS_CHANNEL: z.string(),
        SERVER_LOGS_CHANNEL: z.string(),
        TICKET_LOGS_CHANNEL: z.string(),

        MEMBER_ROLE: z.string(),
        CUSTOMER_ROLE: z.string(),
        SUPPORT_ROLE: z.string(),
        MODERATOR_ROLE: z.string(),
        OWNER_ROLE: z.string(),

        ACCENT_COLOR: z.string().transform((val) => parseInt(val, 16)),
    })
    .parse(process.env);
