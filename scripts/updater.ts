import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateSplitDocumentation } from "./chunk-docs";
import { existsSync } from "node:fs";

let started = false;

export function startUpdaterInterval() {
    if (started) return;
    started = true;

    if (process.env.NODE_ENV !== "production") {
        console.warn("Detected dev environment. The updater will not start.");
        return;
    }

    console.log("Starting the updater");

    const callback = async () => {
        try {
            await syncArtifactsDocs();
        } catch (e) {
            console.error(e);
        }
    };

    setInterval(callback, 6 * 60 * 1000);

    if (!existsSync(path.join(process.cwd(), "docs"))) {
        setTimeout(callback, 15_000);
    }
}

startUpdaterInterval();

type GitHubTreeResponse = {
    tree: Array<{
        path: string;
        type: "blob" | "tree";
        sha: string;
    }>;
    truncated: boolean;
};

type PackageVersionsMap = Map<string, Set<string>>;

const GITHUB_OWNER = "voctal";
const GITHUB_REPO = "artifacts";
const GITHUB_BRANCH = "main";

const DOCS_ROOT = path.join(process.cwd(), "docs");

/**
 * Syncs docs from the artifacts repo into /docs
 */
export async function syncArtifactsDocs(): Promise<void> {
    console.log("[docs-sync] Starting sync");

    const tree = await fetchRepoTree();
    const remotePackages = extractPackagesFromTree(tree);

    const changedPackages: Map<string, Set<string>> = new Map();

    for (const [pkg, versions] of remotePackages) {
        for (const version of versions) {
            const localDir = path.join(DOCS_ROOT, pkg, version);

            const missingFiles = await getMissingFiles(localDir);

            if (missingFiles.length === 0) continue;

            console.log(`[docs-sync] Start downloading ${pkg}/${version}`);

            await mkdir(localDir, { recursive: true });

            for (const file of missingFiles) {
                const remotePath = `docs/packages/${pkg}/${version}/${file}`;

                try {
                    const content = await fetchRawFile(remotePath);
                    await writeFile(path.join(localDir, file), content);
                } catch (err) {
                    console.error(`[docs-sync] Failed to download ${pkg}/${version}/${file}`, err);
                }
            }

            if (!changedPackages.has(pkg)) {
                changedPackages.set(pkg, new Set());
            }
            changedPackages.get(pkg)!.add(version);
        }
    }

    if (changedPackages.size > 0) {
        console.log("[docs-sync] Generating documentation");

        await generateSplitDocumentation(
            Array.from(changedPackages.entries()).map(([packageName, versions]) => ({
                packageName,
                versions: Array.from(versions),
            })),
        );
    }

    console.log("[docs-sync] Sync completed");
}

// GitHub helpers

async function fetchRepoTree(): Promise<GitHubTreeResponse> {
    const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                ...(process.env.GITHUB_TOKEN && {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                }),
            },
        },
    );

    if (!res.ok) {
        throw new Error(`[docs-sync] Failed to fetch repo tree (${res.status}, ${res.statusText})`);
    }

    const json = (await res.json()) as GitHubTreeResponse;

    if (json.truncated) {
        console.warn("[docs-sync] GitHub tree response was truncated");
    }

    return json;
}

function extractPackagesFromTree(tree: GitHubTreeResponse): PackageVersionsMap {
    const map: PackageVersionsMap = new Map();

    for (const item of tree.tree) {
        if (item.type !== "blob") continue;

        const match = item.path.match(/^docs\/packages\/([^/]+)\/([^/]+)\/(README\.md|docs\.api\.json)$/);

        if (!match) continue;

        const [, pkg, version] = match;

        if (!map.has(pkg)) map.set(pkg, new Set());
        map.get(pkg)!.add(version);
    }

    return map;
}

// Filesystem helpers

async function getMissingFiles(dir: string): Promise<string[]> {
    const required = ["README.md", "docs.api.json"];
    try {
        const existing = new Set(await readdir(dir));
        return required.filter(f => !existing.has(f));
    } catch {
        // Directory does not exist
        return required;
    }
}

// RAW GitHub fetch

async function fetchRawFile(remotePath: string): Promise<string> {
    const res = await fetch(
        `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${remotePath}`,
    );

    if (!res.ok) {
        throw new Error(`RAW fetch failed (${res.status}) for ${remotePath}`);
    }

    return await res.text();
}
