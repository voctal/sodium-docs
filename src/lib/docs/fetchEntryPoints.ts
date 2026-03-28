import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unstable_cache } from "next/cache";
import { PACKAGES_WITH_ENTRY_POINTS } from "../constants";
import { PackageEntryPoint } from "./types";
import { isValidPackage } from "./validation";

export async function fetchEntryPoints(packageName: string, version: string) {
    return fetchEntryPointsCached(packageName, version);
}

const fetchEntryPointsCached = unstable_cache(
    async (packageName: string, version: string): Promise<PackageEntryPoint[] | null> => {
        if (!isValidPackage(packageName, version)) return [];
        const hasEntryPoint = PACKAGES_WITH_ENTRY_POINTS.find(([n]) => n === packageName);

        if (!hasEntryPoint) {
            return [];
        }

        try {
            const file = await readFile(
                join(process.cwd(), "docs", packageName, version, "chunks", `entrypoints.api.json`),
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
