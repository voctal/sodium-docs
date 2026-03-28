import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unstable_cache } from "next/cache";
import { isValidPackage } from "./validation";

export async function fetchHome(options: { readonly packageName: string; readonly version: string }) {
    return fetchHomeCached(options);
}

const fetchHomeCached = unstable_cache(
    async ({
        packageName,
        version,
    }: {
        readonly packageName: string;
        readonly version: string;
    }): Promise<string | null> => {
        if (!isValidPackage(packageName, version)) return null;

        try {
            const file = await readFile(join(process.cwd(), "docs", packageName, version, "README.md"), "utf8");

            return file;
        } catch (err) {
            console.error(err);
            return null;
        }
    },
    undefined,
    { revalidate: 60 * 1 },
);
