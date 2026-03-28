import { VscSymbolMethod } from "@react-icons/all-files/vsc/VscSymbolMethod";
import { ChevronDown, ChevronUp, Code2, LinkIcon } from "lucide-react";
import Link from "next/link";
import { Method, MethodOverload } from "@/lib/docs/types";
import { resolveNodeKindSpanClass } from "@/lib/kind";
import { cn } from "@/lib/utils";
import { Badges } from "../Badges";
import { ContentSeparator } from "../ContentSeparator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { DeprecatedNode } from "./DeprecatedNode";
import { ExampleNode } from "./ExampleNode";
import { ExcerptNode } from "./ExcerptNode";
import { InheritedFromNode } from "./InheritedFromNode";
import { OverloadNode } from "./OverloadNode";
import { ParameterCommentNode } from "./ParameterCommentNode";
import { ParameterNode } from "./ParameterNode";
import { ReturnNode } from "./ReturnNode";
import { SeeNode } from "./SeeNode";
import { SummaryNode } from "./SummaryNode";
import { ThrowsNode } from "./ThrowsNode";
import { TypeParameterNode } from "./TypeParameterNode";
import { UnstableNode } from "./UnstableNode";

export async function MethodNode({
    node,
    packageName,
    version,
}: {
    readonly node: Method[];
    readonly packageName: string;
    readonly version: string;
}) {
    return (
        <Collapsible className="flex flex-col gap-4" defaultOpen>
            <CollapsibleTrigger className="group flex place-content-between place-items-center rounded-md p-2 hover:bg-[#e7e7e9] dark:hover:bg-[#242428]">
                <h2 className="flex place-items-center gap-2 text-xl font-bold">
                    <VscSymbolMethod aria-hidden className={cn("shrink-0")} size={24} /> Methods
                </h2>
                <ChevronDown aria-hidden className='group-data-[state="open"]:hidden' size={24} />
                <ChevronUp aria-hidden className='group-data-[state="closed"]:hidden' size={24} />
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="flex flex-col gap-4">
                    {node.map(method =>
                        method.overloads.length ? (
                            <OverloadNode
                                key={`${method.displayName}-${method.overloadIndex}`}
                                overloads={method.overloads}
                                displayOverload={overload => (
                                    <MethodBodyNode
                                        method={overload}
                                        overload
                                        packageName={packageName}
                                        version={version}
                                    />
                                )}
                            />
                        ) : (
                            <MethodBodyNode
                                key={`${method.displayName}-${method.overloadIndex}`}
                                method={method}
                                packageName={packageName}
                                version={version}
                            />
                        ),
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

async function MethodBodyNode({
    method,
    packageName,
    version,
    overload = false,
}: {
    readonly method: Method | MethodOverload;
    readonly overload?: boolean;
    readonly packageName: string;
    readonly version: string;
}) {
    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex place-content-between place-items-center gap-1">
                    <h3
                        className={`${overload ? "scroll-mt-16" : "scroll-mt-8"} group px-2 font-mono font-semibold break-all`}
                        id={method.displayName}
                    >
                        <Badges node={method} />
                        <span className={resolveNodeKindSpanClass(method.kind)}>{method.displayName}</span>
                        <span>
                            <Link
                                className="float-left -ml-6 hidden pr-2 pb-2 group-hover:block"
                                href={`#${method.displayName}`}
                            >
                                <LinkIcon aria-hidden size={16} />
                            </Link>
                            {method.typeParameters?.length ? (
                                <>
                                    {"<"}
                                    <TypeParameterNode node={method.typeParameters} version={version} />
                                    {">"}
                                </>
                            ) : null}
                            (
                            {method.parameters?.length ? (
                                <ParameterNode node={method.parameters} version={version} />
                            ) : null}
                            ) : <ExcerptNode node={method.returnTypeExcerpt} version={version} />
                        </span>
                    </h3>

                    <Link
                        prefetch={false}
                        aria-label="Open source file in new tab"
                        className="min-w-min"
                        href={method.sourceLine !== -1 ? `${method.sourceURL}#L${method.sourceLine}` : method.sourceURL}
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

                {method.summary?.deprecatedBlock.length ? (
                    <DeprecatedNode deprecatedBlock={method.summary.deprecatedBlock} version={version} />
                ) : null}

                {method.summary?.unstableBlock?.length ? (
                    <UnstableNode unstableBlock={method.summary.unstableBlock} version={version} />
                ) : null}

                {method.summary?.summarySection.length ? (
                    <SummaryNode node={method.summary.summarySection} padding version={version} />
                ) : null}

                {method.summary?.exampleBlocks.length ? (
                    <ExampleNode node={method.summary.exampleBlocks} version={version} />
                ) : null}

                <ParameterCommentNode node={method.parameters} version={version} padding />

                {method.summary?.returnsBlock.length ? (
                    <ReturnNode node={method.summary.returnsBlock} padding version={version} />
                ) : null}

                {method.summary?.throwsBlocks?.length ? (
                    <ThrowsNode node={method.summary.throwsBlocks} padding version={version} />
                ) : null}

                {method.inheritedFrom ? (
                    <InheritedFromNode node={method.inheritedFrom} packageName={packageName} version={version} />
                ) : null}

                {method.summary?.seeBlocks.length ? (
                    <SeeNode node={method.summary.seeBlocks} padding version={version} />
                ) : null}
            </div>

            <ContentSeparator />
        </>
    );
}
