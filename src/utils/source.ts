import { sourceEnum } from "@/db/schema";

type Source = (typeof sourceEnum.enumValues)[number];

const SOURCE_META: Record<Source, { label: string; icon: string }> = {
    BUILTBYBIT: {
        label: "BuiltByBit",
        icon: "<:bbb:1291789674083389531>",
    },
    SOURCEXCHANGE: {
        label: "SourceXchange",
        icon: "<:sxc:1291789674687500441>",
    },
    GITHUB: {
        label: "GitHub",
        icon: "<:github:1464628042310746244>",
    },
};

export function formatSource(source: Source) {
    const meta = SOURCE_META[source];

    return {
        label: meta.label,
        icon: meta.icon,
        text: `${meta.icon} ${meta.label}`.trim(),
    };
}
