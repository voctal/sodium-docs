import { VscSymbolEvent } from "@react-icons/all-files/vsc/VscSymbolEvent";
import { ChevronDown, ChevronUp, Code2, LinkIcon } from "lucide-react";
import Link from "next/link";
import { Event } from "@/lib/docs/types";
import { Badges } from "../Badges";
import { ContentSeparator } from "../ContentSeparator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { DeprecatedNode } from "./DeprecatedNode";
import { ExampleNode } from "./ExampleNode";
import { ExcerptNode } from "./ExcerptNode";
import { InheritedFromNode } from "./InheritedFromNode";
import { ReturnNode } from "./ReturnNode";
import { SeeNode } from "./SeeNode";
import { SummaryNode } from "./SummaryNode";
import { TypeParameterNode } from "./TypeParameterNode";
import { UnstableNode } from "./UnstableNode";

export async function EventNode({
    node,
    packageName,
    version,
}: {
    readonly node: Event[];
    readonly packageName: string;
    readonly version: string;
}) {
    return (
        <Collapsible className="flex flex-col gap-4" defaultOpen>
            <CollapsibleTrigger className="group flex place-content-between place-items-center rounded-md p-2 hover:bg-[#e7e7e9] dark:hover:bg-[#242428]">
                <h2 className="flex place-items-center gap-2 text-xl font-bold">
                    <VscSymbolEvent aria-hidden className="shrink-0" size={24} /> Events
                </h2>
                <ChevronDown aria-hidden className='group-data-[state="open"]:hidden' size={24} />
                <ChevronUp aria-hidden className='group-data-[state="closed"]:hidden' size={24} />
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="flex flex-col gap-4">
                    {node.map(event => (
                        <EventBodyNode
                            event={event}
                            key={`${event.displayName}`}
                            packageName={packageName}
                            version={version}
                        />
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

async function EventBodyNode({
    event,
    packageName,
    version,
    overload = false,
}: {
    readonly event: Event;
    readonly overload?: boolean;
    readonly packageName: string;
    readonly version: string;
}) {
    let params = event.parameters[1].typeExcerpt;
    params = params.slice(0, params.findIndex(p => p.text.includes("=>")) + 1);
    params[params.length - 1] = { ...params.at(-1), text: params.at(-1)!.text.slice(0, -4) };

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex place-content-between place-items-center gap-1">
                    <h3
                        className={`${overload ? "scroll-mt-24" : "scroll-mt-16"} group px-2 font-mono font-semibold break-all`}
                        id={event.displayName}
                    >
                        <Badges node={event} /> {event.displayName}
                        <span>
                            <Link
                                className="float-left -ml-6 hidden pr-2 pb-2 group-hover:block"
                                href={`#${event.displayName}`}
                            >
                                <LinkIcon aria-hidden size={16} />
                            </Link>

                            {event.typeParameters?.length ? (
                                <>
                                    {"<"}
                                    <TypeParameterNode node={event.typeParameters} version={version} />
                                    {">"}
                                </>
                            ) : null}

                            <ExcerptNode node={params} version={version} />
                        </span>
                    </h3>

                    <Link
                        prefetch={false}
                        aria-label="Open source file in new tab"
                        className="min-w-min"
                        href={event.sourceLine !== -1 ? `${event.sourceURL}#L${event.sourceLine}` : event.sourceURL}
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

                {event.summary?.deprecatedBlock.length ? (
                    <DeprecatedNode deprecatedBlock={event.summary.deprecatedBlock} version={version} />
                ) : null}

                {event.summary?.unstableBlock?.length ? (
                    <UnstableNode unstableBlock={event.summary.unstableBlock} version={version} />
                ) : null}

                {event.summary?.summarySection.length ? (
                    <SummaryNode node={event.summary.summarySection} padding version={version} />
                ) : null}

                {event.summary?.exampleBlocks.length ? (
                    <ExampleNode node={event.summary.exampleBlocks} version={version} />
                ) : null}

                {event.summary?.returnsBlock.length ? (
                    <ReturnNode node={event.summary.returnsBlock} padding version={version} />
                ) : null}

                {event.inheritedFrom ? (
                    <InheritedFromNode node={event.inheritedFrom} packageName={packageName} version={version} />
                ) : null}

                {event.summary?.seeBlocks.length ? (
                    <SeeNode node={event.summary.seeBlocks} padding version={version} />
                ) : null}
            </div>

            <ContentSeparator />
        </>
    );
}
