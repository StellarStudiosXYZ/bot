import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), ".commands.hash");

export function getLastHash(): string | null {
    return fs.existsSync(FILE) ? fs.readFileSync(FILE, "utf8") : null;
}

export function setLastHash(hash: string) {
    fs.writeFileSync(FILE, hash);
}
