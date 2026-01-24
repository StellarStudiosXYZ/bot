import crypto from "node:crypto";
import { commands } from "./index";

export function getCommandPayload() {
    return commands.map((cmd) => cmd.data.toJSON());
}

export function getCommandsHash() {
    const payload = JSON.stringify(getCommandPayload());
    return crypto.createHash("sha256").update(payload).digest("hex");
}
