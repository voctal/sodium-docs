import { unstable_cache } from "next/cache";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PACKAGES, NPM_USER } from "../constants";
import { PackageDependencies } from "./types";
import { isValidPackage } from "./validation";

export async function fetchDependencies(options: { readonly packageName: string; readonly version: string }) {
    return fetchDependenciesCached(options);
}

const fetchDependenciesCached = unstable_cache(
    async ({ packageName, version }: { readonly packageName: string; readonly version: string }) => {
        if (!isValidPackage(packageName, version)) return [];

        try {
            const file = await readFile(
                join(process.cwd(), "docs", packageName, version, "chunks", "dependencies.api.json"),
                "utf8",
            );

            const parsedDependencies: PackageDependencies = JSON.parse(file);

            return Object.entries(parsedDependencies)
                .filter(([key]) => PACKAGES.some(p => key === `${p.user ? `${p.user}/` : ""}${p}`))
                .map(
                    ([key, value]) =>
                        `${key.replace(`${NPM_USER}/`, "").replaceAll(".", "-")}-${sanitizeVersion(value)}`,
                );
        } catch (err) {
            console.error(err);
            return [];
        }
    },
    undefined,
    { revalidate: 60 * 1 },
);

function sanitizeVersion(version: string) {
    return version.replaceAll(".", "-").replace(/^[\^~]/, "");
}
