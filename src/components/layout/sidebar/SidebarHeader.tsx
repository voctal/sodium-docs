"use client";

import { VscGithubInverted } from "@react-icons/all-files/vsc/VscGithubInverted";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FaDiscord } from "react-icons/fa";
import { DISCORD_URL, GITHUB_URL, PACKAGES_WITH_ENTRY_POINTS } from "@/lib/constants";
import { PackageEntryPoint, PackageVersion } from "@/lib/docs/types";
import { DocsParams } from "@/lib/types";
import { EntryPointSelect } from "./EntrypointSelect";
import { PackageSelect } from "./PackageSelect";
import { SearchButton } from "./SearchButton";
import { Settings } from "./Settings";
import { VersionSelect } from "./VersionSelect";

export function SidebarHeader() {
    const params = useParams<DocsParams>();
    const hasEntryPoints = PACKAGES_WITH_ENTRY_POINTS.find(([n]) => n === params.packageName);

    const { data: entryPoints, isLoading: isLoadingEntryPoints } = useQuery<PackageEntryPoint[]>({
        queryKey: ["entryPoints", params.packageName, params.version],
        queryFn: async () => {
            const response = await fetch(
                `/api/docs/entrypoints?packageName=${params.packageName}&version=${params.version}`,
            );

            return response.json();
        },
    });

    const { data: versions, isLoading: isLoadingVersions } = useQuery<PackageVersion[]>({
        queryKey: ["versions", params.packageName],
        queryFn: async () => {
            const response = await fetch(`/api/docs/versions?packageName=${params.packageName}`);

            return response.json();
        },
    });

    return (
        <div className="bg-[#f3f3f4] p-4 dark:bg-[#121214]">
            <div className="flex flex-col gap-2">
                <div className="flex place-content-between place-items-center p-1">
                    <Link
                        className="text-xl font-bold"
                        href={`/docs/packages/${params.packageName}/${params.version}${hasEntryPoints ? `/${entryPoints?.[0]?.entryPoint ?? ""}` : ""}`}
                    >
                        {params.packageName}
                    </Link>
                    <div className="flex place-items-center gap-2">
                        <Link
                            prefetch={false}
                            aria-label="Discord"
                            href={DISCORD_URL}
                            rel="external noopener noreferrer"
                            target="_blank"
                        >
                            <FaDiscord aria-hidden data-slot="icon" size={18} />
                        </Link>
                        <Link
                            prefetch={false}
                            aria-label="GitHub"
                            href={GITHUB_URL}
                            rel="external noopener noreferrer"
                            target="_blank"
                        >
                            <VscGithubInverted aria-hidden data-slot="icon" size={18} />
                        </Link>
                    </div>
                </div>

                <PackageSelect />
                <VersionSelect isLoading={isLoadingVersions} versions={versions ?? []} />
                {hasEntryPoints ? (
                    <EntryPointSelect entryPoints={entryPoints ?? []} isLoading={isLoadingEntryPoints} />
                ) : null}
                <SearchButton />

                <Settings />
            </div>
        </div>
    );
}
