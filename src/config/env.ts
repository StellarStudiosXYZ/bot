import { z } from "zod";
import "dotenv/config";

export const env = z
    .object({
        DISCORD_BOT_ENV: z.string(),
        DISCORD_BOT_TOKEN: z.string(),
        DISCORD_CLIENT_ID: z.string(),
        DISCORD_GUILD_ID: z.string(),

        DATABASE_URL: z.string(),

        SOURCEXCHANGE_TOKEN: z.string().optional(),
        BUILTBYBIT_TOKEN: z.string().optional(),

        TICKET_CATEGORY: z.string(),

        CUSTOMER_ROLE: z.string(),
        SUPPORT_ROLE: z.string(),
        MODERATOR_ROLE: z.string(),
    })
    .parse(process.env);
