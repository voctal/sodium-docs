export const BASE_URL =
    process.env.NODE_ENV === "production" ? "https://docs.voctal.dev" : `http://localhost:${process.env.PORT ?? 3000}`;

export const DESCRIPTION = "The documentation of the Voctal packages";

export const VOCTAL_URL = "https://voctal.dev";

export const STATUS_URL = "https://status.voctal.dev";

export const GITHUB_NAME = "voctal";

export const GITHUB_URL = "https://github.com/voctal";

export const DISCORD_URL = "https://voctal.dev/discord";

export const NPM_USER = "@voctal";

export const PACKAGES = [
    { user: VOCTAL_URL, name: "plume-api", repository: "voctal/plume-api.js" },
    { user: VOCTAL_URL, name: "plume-url", repository: "voctal/plume-url.js" },
    { user: VOCTAL_URL, name: "gamecord" },
    { user: VOCTAL_URL, name: "gdapi" },
    { user: VOCTAL_URL, name: "pelican" },
    { user: VOCTAL_URL, name: "ms", monorepo: "utilities" },
    { user: VOCTAL_URL, name: "cache", monorepo: "utilities" },
    { user: VOCTAL_URL, name: "snowflake", monorepo: "utilities" },
    { user: VOCTAL_URL, name: "duration", monorepo: "utilities" },
];

/**
 * [name, ["entrypoint", "path"]]
 */
export const PACKAGES_WITH_ENTRY_POINTS: [string, string[]][] = [];
