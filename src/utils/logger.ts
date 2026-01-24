import pino from "pino";
import { env } from "@/config/env";

export const logger = pino({
    level: env.DISCORD_BOT_ENV === "production" ? "info" : "debug",
    transport:
        env.DISCORD_BOT_ENV !== "production"
            ? {
                  target: "pino-pretty",
                  options: {
                      colorize: true,
                      translateTime: "SYS:standard",
                      ignore: "pid,hostname",
                  },
              }
            : undefined,
});
