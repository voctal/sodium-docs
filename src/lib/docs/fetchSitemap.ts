import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unstable_cache } from "next/cache";
// import { PACKAGES_WITH_ENTRY_POINTS } from "../constants";
import { PackageSitemap } from "./types";
import { isValidPackage } from "./validation";

export async function fetchSitemap(options: {
    readonly entryPoint?: string | null | undefined;
    readonly packageName: string;
    readonly version: string;
}) {
    return fetchSitemapCached(options);
}

const fetchSitemapCached = unstable_cache(
    async ({
        // entryPoint,
        packageName,
        version,
    }: {
        readonly entryPoint?: string | null | undefined;
        readonly packageName: string;
        readonly version: string;
    }): Promise<PackageSitemap[] | null> => {
        if (!isValidPackage(packageName, version)) return null;
        // const hasEntryPoint = PACKAGES_WITH_ENTRY_POINTS.find(([n]) => n === packageName);
        // const normalizedEntryPoint = hasEntryPoint && entryPoint ? `${entryPoint}.` : "";

        try {
            const file = await readFile(
                join(
                    process.cwd(),
                    "docs",
                    packageName,
                    version,
                    "chunks",
                    "sitemap.api.json",
                    // `${normalizedEntryPoint}sitemap.api.json`,
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
