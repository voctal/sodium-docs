import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unstable_cache } from "next/cache";
// import { PACKAGES_WITH_ENTRY_POINTS } from "../constants";
import { Node } from "./types";
import { isValidItemName, isValidPackage } from "./validation";

export async function fetchNode(options: {
    readonly entryPoint?: string | undefined;
    readonly item: string;
    readonly packageName: string;
    readonly version: string;
}) {
    return fetchNodeCached(options);
}

const fetchNodeCached = unstable_cache(
    async ({
        // entryPoint,
        item,
        packageName,
        version,
    }: {
        readonly entryPoint?: string | undefined;
        readonly item: string;
        readonly packageName: string;
        readonly version: string;
    }): Promise<Node | null> => {
        if (!isValidPackage(packageName, version)) return null;
        // const hasEntryPoint = PACKAGES_WITH_ENTRY_POINTS.find(([n]) => n === packageName);
        // const normalizedEntryPoint = hasEntryPoint && entryPoint ? `${entryPoint}.` : "";
        const normalizeItem = item.replaceAll(":", ".").toLowerCase();

        if (!isValidItemName(normalizeItem)) return null;

        try {
            const file = await readFile(
                join(
                    process.cwd(),
                    "docs",
                    packageName,
                    version,
                    "chunks",
                    // `${normalizedEntryPoint}${normalizeItem}.api.json`,
                    `${normalizeItem}.api.json`,
                ),
                "utf8",
            );

            return JSON.parse(file);
        } catch (err) {
            console.error(err);
            return null;
        }
    },
    undefined,
    { revalidate: 60 * 1 },
);
