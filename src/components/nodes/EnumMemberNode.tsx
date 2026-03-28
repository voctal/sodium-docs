import { VscSymbolEnumMember } from "@react-icons/all-files/vsc/VscSymbolEnumMember";
import { Code2, LinkIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { EnumMember } from "@/lib/docs/types";
import { resolveNodeKindSpanClass } from "@/lib/kind";
import { Badges } from "../Badges";
import { ContentSeparator } from "../ContentSeparator";
import { DeprecatedNode } from "./DeprecatedNode";
import { ExampleNode } from "./ExampleNode";
import { ExcerptNode } from "./ExcerptNode";
import { ReturnNode } from "./ReturnNode";
import { SeeNode } from "./SeeNode";
import { SummaryNode } from "./SummaryNode";
import { UnstableNode } from "./UnstableNode";

export async function EnumMemberNode({ node, version }: { readonly node: EnumMember[]; readonly version: string }) {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="flex place-items-center gap-2 p-2 text-xl font-bold">
                <VscSymbolEnumMember aria-hidden className="shrink-0" size={24} />
                Members
            </h2>

            <div className="flex flex-col gap-4">
                {node.map((member, idx: number) => (
                    <Fragment key={`${member.displayName}-${idx}`}>
                        <div className="flex flex-col gap-4">
                            <div className="flex place-content-between place-items-center gap-1">
                                <h3
                                    className={"scroll-mt-16 group px-2 font-mono font-semibold break-all"}
                                    id={member.displayName}
                                >
                                    <Badges node={member} />

                                    <span>
                                        <Link
                                            className="float-left -ml-6 hidden pr-2 pb-2 group-hover:block"
                                            href={`#${member.displayName}`}
                                        >
                                            <LinkIcon aria-hidden size={16} />
                                        </Link>
                                        <span className={resolveNodeKindSpanClass("EnumMember")}>
                                            {member.displayName}
                                        </span>
                                        {member.initializerExcerpt ? (
                                            <>
                                                {" = "}
                                                <ExcerptNode node={member.initializerExcerpt} version={version} />
                                            </>
                                        ) : null}
                                    </span>
                                </h3>

                                <Link
                                    prefetch={false}
                                    aria-label="Open source file in new tab"
                                    className="min-w-min"
                                    href={
                                        member.sourceLine !== -1
                                            ? `${member.sourceURL}#L${member.sourceLine}`
                                            : member.sourceURL
                                    }
                                    rel="external noreferrer noopener"
                                    target="_blank"
                                >
                                    <Code2
                                        aria-hidden
                                        className="dark:text-neutral-400 dark:hover:text-neutral-300"
                                        size={20}
                                    />
                                </Link>
                            </div>

                            {member.summary?.deprecatedBlock.length ? (
                                <DeprecatedNode deprecatedBlock={member.summary.deprecatedBlock} version={version} />
                            ) : null}

                            {member.summary?.unstableBlock?.length ? (
                                <UnstableNode unstableBlock={member.summary.unstableBlock} version={version} />
                            ) : null}

                            {member.summary?.summarySection.length ? (
                                <SummaryNode node={member.summary.summarySection} padding version={version} />
                            ) : null}

                            {member.summary?.exampleBlocks.length ? (
                                <ExampleNode node={member.summary.exampleBlocks} version={version} />
                            ) : null}

                            {member.summary?.returnsBlock.length ? (
                                <ReturnNode node={member.summary.returnsBlock} padding version={version} />
                            ) : null}

                            {member.summary?.seeBlocks.length ? (
                                <SeeNode node={member.summary.seeBlocks} padding version={version} />
                            ) : null}
                        </div>

                        <ContentSeparator />
                    </Fragment>
                ))}
            </div>
        </div>
    );
}
