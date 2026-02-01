import axios from "axios";
import { env } from "@/config/env";

export const sourceXchange = axios.create({
    baseURL: "https://www.sourcexchange.net/api",
    headers: {
        Authorization: `Bearer ${env.SOURCEXCHANGE_TOKEN}`,
        Accept: "application/json",
    },
});
