import { VscSymbolMethod } from "@react-icons/all-files/vsc/VscSymbolMethod";
import { Code2, LinkIcon } from "lucide-react";
import Link from "next/link";
import { Constructor } from "@/lib/docs/types";
import { resolveNodeKindSpanClass } from "@/lib/kind";
import { Badges } from "../Badges";
import { ContentSeparator } from "../ContentSeparator";
import { ExampleNode } from "./ExampleNode";
import { ParameterCommentNode } from "./ParameterCommentNode";
import { ParameterNode } from "./ParameterNode";
import { SeeNode } from "./SeeNode";
import { SummaryNode } from "./SummaryNode";

export async function ConstructorNode({ node, version }: { readonly node: Constructor; readonly version: string }) {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="flex place-items-center gap-2 p-2 text-xl font-bold">
                <VscSymbolMethod aria-hidden className="shrink-0" size={24} />
                Constructors
            </h2>

            <div className="flex place-content-between place-items-center gap-1">
                <h3 className="scroll-mt-16 group px-2 font-mono font-semibold break-all" id="constructor">
                    <Badges node={node} />
                    <div>
                        <Link className="float-left -ml-6 hidden pr-2 pb-2 group-hover:block" href="#constructor">
                            <LinkIcon aria-hidden size={16} />
                        </Link>
                        <span className={resolveNodeKindSpanClass("Constructor")}>constructor</span>(
                        {node.parameters.length ? <ParameterNode node={node.parameters} version={version} /> : null})
                    </div>
                </h3>

                <Link
                    prefetch={false}
                    aria-label="Open source file in new tab"
                    className="min-w-min"
                    href={node.sourceLine !== -1 ? `${node.sourceURL}#L${node.sourceLine}` : node.sourceURL}
                    rel="external noreferrer noopener"
                    target="_blank"
                >
                    <Code2
                        aria-hidden
                        className="text-neutral-500 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-300"
                        size={20}
                    />
                </Link>
            </div>

            {node.summary?.summarySection.length ? (
                <SummaryNode node={node.summary.summarySection} padding version={version} />
            ) : null}

            {node.summary?.exampleBlocks.length ? (
                <ExampleNode node={node.summary.exampleBlocks} version={version} />
            ) : null}

            <ParameterCommentNode node={node.parameters} version={version} padding />

            {node.summary?.seeBlocks.length ? (
                <SeeNode node={node.summary.seeBlocks} padding version={version} />
            ) : null}

            <ContentSeparator />
        </div>
    );
}
