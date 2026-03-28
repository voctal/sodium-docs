"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2Icon } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { parseDocsPathParams } from "@/lib/docs/parseDocsPathParams";
import { PackageSitemap } from "@/lib/docs/types";
import { resolveNodeKindColor } from "@/lib/kind";
import { DocsParams } from "@/lib/types";
import { NavigationItem } from "./NavigationItem";

export function Navigation() {
    const params = useParams<DocsParams>();

    const { entryPoints: parsedEntrypoints } = parseDocsPathParams(params.item);

    const {
        data: node,
        status,
        isLoading,
    } = useQuery<PackageSitemap[]>({
        queryKey: ["sitemap", params.packageName, params.version, parsedEntrypoints.join(".")],
        queryFn: async () => {
            const response = await fetch(
                `/api/docs/sitemap?packageName=${params.packageName}&version=${params.version}&entryPoint=${parsedEntrypoints.join(".")}`,
            );

            return response.json();
        },
    });

    if ((status === "success" && !node) || status === "error") {
        notFound();
    }

    if (isLoading) {
        return <Loader2Icon className="mx-auto h-10 w-10 animate-spin" />;
    }

    if (!node) {
        notFound();
    }

    const groupedNodes = node.reduce(
        (acc, node) => {
            (acc[node.kind.toLowerCase()] ||= []).push(node);
            return acc;
        },
        {} as Record<string, PackageSitemap[]>,
    );

    return (
        <nav className="flex flex-col gap-2 pl-4 pr-4">
            <NavigationKindItems
                label="Classes"
                nodes={groupedNodes.class}
                packageName={params.packageName}
                version={params.version}
            />
            <NavigationKindItems
                label="Functions"
                nodes={groupedNodes.function}
                packageName={params.packageName}
                version={params.version}
            />
            <NavigationKindItems
                label="Enums"
                nodes={groupedNodes.enum}
                packageName={params.packageName}
                version={params.version}
            />
            <NavigationKindItems
                label="Interfaces"
                nodes={groupedNodes.interface}
                packageName={params.packageName}
                version={params.version}
            />
            <NavigationKindItems
                label="Types"
                nodes={groupedNodes.typealias}
                packageName={params.packageName}
                version={params.version}
            />
            <NavigationKindItems
                label="Variables"
                nodes={groupedNodes.variable}
                packageName={params.packageName}
                version={params.version}
            />
        </nav>
    );
}

function NavigationKindItems({
    label,
    nodes,
    packageName,
    version,
}: {
    readonly label: string;
    readonly nodes: PackageSitemap[] | undefined;
    readonly packageName: string;
    readonly version: string;
}) {
    if (!nodes?.length) return null;

    return (
        <Collapsible className="flex flex-col gap-2" defaultOpen>
            <CollapsibleTrigger className="group flex place-content-between place-items-center rounded-md p-2 hover:bg-[#e7e7e9] dark:hover:bg-[#242428]">
                <h4 className="font-semibold text-md">{label}</h4>
                <ChevronDown aria-hidden className='group-data-[state="open"]:hidden' size={24} />
                <ChevronUp aria-hidden className='group-data-[state="closed"]:hidden' size={24} />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="flex flex-col">
                    {nodes.map((node, idx) => {
                        const color = resolveNodeKindColor(node.kind);
                        return (
                            <NavigationItem
                                key={`${node.name}-${idx}`}
                                node={node}
                                packageName={packageName}
                                version={version}
                            >
                                <div
                                    className={`inline-block size-6 rounded-full text-center ${color.background} ${color.text}`}
                                >
                                    {node.kind[0]}
                                </div>{" "}
                                <span className="font-sans">{node.name}</span>
                            </NavigationItem>
                        );
                    })}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
