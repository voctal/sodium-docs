"use client";

import { VscSymbolMethod } from "@react-icons/all-files/vsc/VscSymbolMethod";
import { useParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { PACKAGES } from "@/lib/constants";
import { DocsParams } from "@/lib/types";

export function PackageSelect() {
    const router = useRouter();
    const params = useParams<DocsParams>();

    return (
        <Select
            aria-label="Select a package"
            value={params.packageName}
            onValueChange={name => {
                router.push(`/docs/packages/${name}/stable`);
            }}
            key={params.packageName}
        >
            <SelectTrigger className="bg-[#f3f3f4] text-md h-10! pl-2 py-1 dark:bg-[#121214] w-full">
                <VscSymbolMethod className="bg-primary/15 size-6 p-1 text-primary border border-primary rounded" />
                <span>{params.packageName}</span>
                <span className="ml-auto"></span>
            </SelectTrigger>
            <SelectContent position="popper">
                {PACKAGES.map(item => (
                    <SelectItem value={item.name} key={item.name}>
                        <span onMouseEnter={() => router.prefetch(`/docs/packages/${item.name}/stable`)}>
                            {item.name}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
