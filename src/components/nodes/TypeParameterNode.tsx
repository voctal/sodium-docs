import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { TypeParameter } from "@/lib/docs/types";
import { resolveNodeKindSpanClass } from "@/lib/kind";
import { cn } from "@/lib/utils";
import { Badges } from "../Badges";
import { ContentSeparator } from "../ContentSeparator";
import { CommentNode } from "./CommentNode";
import { ExcerptNode } from "./ExcerptNode";

export async function TypeParameterNode({
    description = false,
    node,
    version,
}: {
    readonly description?: boolean;
    readonly node: TypeParameter[];
    readonly version: string;
}) {
    return (
        <div className={description ? "flex flex-col gap-4" : "inline-block"}>
            {node.map((typeParameter, idx) => (
                <Fragment key={`${typeParameter.name}-${idx}`}>
                    <div className={description ? "" : 'inline after:content-[",_"] last-of-type:after:content-none'}>
                        <h3
                            className={cn(
                                "scroll-mt-8",
                                "group inline font-mono font-semibold wrap-break-words",
                                description ? "inline-block px-2" : "",
                            )}
                            id={typeParameter.name}
                        >
                            {description ? <Badges node={typeParameter} /> : null}
                            <span>
                                {description ? (
                                    <Link
                                        className="float-left -ml-6 hidden pr-2 pb-2 group-hover:block"
                                        href={`#${typeParameter.name}`}
                                    >
                                        <LinkIcon aria-hidden size={16} />
                                    </Link>
                                ) : null}
                                <span className={resolveNodeKindSpanClass("TypeAlias")}>{typeParameter.name}</span>
                                {typeParameter.isOptional ? "?" : ""}
                                {typeParameter.constraintsExcerpt.length ? (
                                    <>
                                        {" extends "}
                                        <ExcerptNode node={typeParameter.constraintsExcerpt} version={version} />
                                    </>
                                ) : null}
                                {typeParameter.defaultExcerpt.length ? (
                                    <>
                                        {" = "}
                                        <ExcerptNode node={typeParameter.defaultExcerpt} version={version} />
                                    </>
                                ) : null}
                            </span>
                        </h3>

                        {description && typeParameter.description?.length ? (
                            <div className="pl-4">
                                <CommentNode node={typeParameter.description} version={version} />
                            </div>
                        ) : null}
                    </div>
                </Fragment>
            ))}

            {description ? <ContentSeparator /> : null}
        </div>
    );
}
