"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseDocsPathParams } from "@/lib/docs/parseDocsPathParams";
import { PackageEntryPoint } from "@/lib/docs/types";
import { DocsParams } from "@/lib/types";

export function EntryPointSelect({
    entryPoints,
    isLoading,
}: {
    readonly entryPoints: PackageEntryPoint[];
    readonly isLoading: boolean;
}) {
    const router = useRouter();
    const params = useParams<DocsParams>();

    const { entryPoints: parsedEntrypoints } = parseDocsPathParams(params.item);

    return (
        <Select
            disabled={isLoading}
            aria-label={isLoading ? "Loading entrypoints..." : "Select an entrypoint"}
            value={parsedEntrypoints.join("/")}
            key={parsedEntrypoints.join("/")}
        >
            <SelectTrigger className="bg-[#f3f3f4] dark:bg-[#121214]">
                {isLoading ? (
                    <Loader2Icon
                        aria-hidden
                        className="size-6 shrink-0 animate-spin duration-200 forced-colors:text-[ButtonText] forced-colors:group-disabled:text-[GrayText]"
                        size={24}
                        strokeWidth={1.5}
                    />
                ) : (
                    <SelectValue />
                )}
            </SelectTrigger>
            <SelectContent position="popper">
                {entryPoints.map(item => (
                    <SelectItem key={item.entryPoint} value={item.entryPoint} asChild>
                        <Link
                            className="dark:pressed:bg-[#313135] bg-[#f3f3f4] dark:bg-[#28282d] dark:hover:bg-[#313135]"
                            href={`/docs/packages/${params.packageName}/${params.version}/${item.entryPoint}`}
                            key={item.entryPoint}
                            onMouseEnter={() =>
                                router.prefetch(
                                    `/docs/packages/${params.packageName}/${params.version}/${item.entryPoint}`,
                                )
                            }
                        >
                            {item.entryPoint}
                        </Link>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
