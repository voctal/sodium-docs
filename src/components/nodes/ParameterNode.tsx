import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { Parameter } from "@/lib/docs/types";
import { resolveNodeKindSpanClass } from "@/lib/kind";
import { Badges } from "../Badges";
import { ContentSeparator } from "../ContentSeparator";
import { CommentNode } from "./CommentNode";
import { ExcerptNode } from "./ExcerptNode";

export async function ParameterNode({
    description = false,
    node,
    version,
}: {
    readonly description?: boolean;
    readonly node: Parameter[];
    readonly version: string;
}) {
    return (
        <div className={description ? "flex flex-col gap-4" : "inline"}>
            {node.map((parameter, idx) => (
                <Fragment key={`${parameter.name}-${idx}`}>
                    <div
                        className={
                            description ? "group" : 'inline after:content-[",_"] last-of-type:after:content-none'
                        }
                    >
                        <span className="font-mono font-semibold">
                            {description ? (
                                <Link
                                    className="float-left -ml-6 hidden pr-2 pb-2 group-hover:block"
                                    href={`#${parameter.name}`}
                                >
                                    <LinkIcon aria-hidden size={16} />
                                </Link>
                            ) : null}
                            {description ? <Badges node={parameter} /> : null}
                            <span className={resolveNodeKindSpanClass("Unknown")}>{parameter.name}</span>
                            {parameter.isOptional ? "?" : ""}:{" "}
                            <ExcerptNode node={parameter.typeExcerpt} version={version} />
                            {parameter.defaultValue ? ` = ${parameter.defaultValue}` : ""}
                        </span>
                        {description && parameter.description?.length ? (
                            <div className="mt-4 pl-4">
                                <CommentNode node={parameter.description} version={version} />
                            </div>
                        ) : null}
                    </div>
                </Fragment>
            ))}

            {description ? <ContentSeparator /> : null}
        </div>
    );
}
