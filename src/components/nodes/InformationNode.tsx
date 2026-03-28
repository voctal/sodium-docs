import { FileCode2 } from "lucide-react";
import Link from "next/link";
import { Node } from "@/lib/docs/types";
import { Badges } from "../Badges";
import { NodeKindDisplay } from "../NodeKindDisplay";
import { InheritanceNode } from "./InheritanceNode";

export async function InformationNode({ node, version }: { readonly node: Node; readonly version: string }) {
    return (
        <div className="flex place-content-between gap-1">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl">
                    <NodeKindDisplay node={node} /> <span className="font-bold break-all">{node.displayName}</span>
                </h1>

                {"extends" in node && node.extends?.length ? (
                    <InheritanceNode node={node.extends} text="extends" version={version} />
                ) : null}
                {"implements" in node && node.implements?.length ? (
                    <InheritanceNode node={node.implements} text="implements" version={version} />
                ) : null}

                <Badges node={node} />
            </div>

            <Link
                prefetch={false}
                aria-label="Open source file in new tab"
                className="min-w-min mt-2"
                href={node.sourceLine !== -1 ? `${node.sourceURL}#L${node.sourceLine}` : node.sourceURL}
                rel="external noreferrer noopener"
                target="_blank"
            >
                <FileCode2 aria-hidden className="text-neutral-400 hover:text-neutral-300" size={20} />
            </Link>
        </div>
    );
}
