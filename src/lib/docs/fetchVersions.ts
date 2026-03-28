import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { unstable_cache } from "next/cache";
import { PackageVersion } from "./types";
import { isValidPackage } from "./validation";

export async function fetchVersions(packageName: string) {
    return fetchVersionsCached(packageName);
}

const fetchVersionsCached = unstable_cache(
    async (packageName: string): Promise<PackageVersion[]> => {
        if (!isValidPackage(packageName)) return [];

        try {
            const dirents = await readdir(join(process.cwd(), "docs", packageName), { withFileTypes: true });
            return dirents
                .filter(d => d.isDirectory())
                .map(d => d.name)
                .map(v => ({ version: v }));
        } catch {
            return [];
        }
    },
    undefined,
    { revalidate: 60 * 1 },
);
