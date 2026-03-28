import Link from "next/link";
import { Fragment } from "react";
import { PACKAGES } from "@/lib/constants";
import { BuiltinDocumentationLinks } from "@/lib/docs/builtinLinks";
import { ExcerptElement } from "@/lib/docs/types";
import { resolveNodeKindLinkClass } from "@/lib/kind";
import { cn } from "@/lib/utils";

export async function ExcerptNode({
    node,
    isInheritance,
    version,
}: {
    readonly node?: ExcerptElement[] | ExcerptElement[][];
    readonly isInheritance?: boolean;
    readonly version: string;
}) {
    const createExcerpt = (gexcerpts: ExcerptElement | ExcerptElement[], idx: number) => {
        let excerpts: ExcerptElement[] = Array.isArray(gexcerpts) ? gexcerpts : [gexcerpts];

        return (
            <span
                className={isInheritance ? 'after:content-[",_"] last-of-type:after:content-none' : ""}
                key={`${excerpts.map(e => e.text).join("-")}-${idx}`}
            >
                {excerpts.map((excerpt, idx) => {
                    if (excerpt.resolvedItem) {
                        let href;
                        if (PACKAGES.find(p => p.name === excerpt.resolvedItem?.packageName)) {
                            href = `/docs/packages/${excerpt.resolvedItem.packageName}/${excerpt.resolvedItem.version ?? version}/${excerpt.resolvedItem.uri}`;
                        } else if (excerpt.resolvedItem.packageName.includes("discord")) {
                            href = `https://discord.js.org/docs/packages/${excerpt.resolvedItem.packageName}/${excerpt.resolvedItem.version ?? "stable"}/${excerpt.resolvedItem.uri}`;
                        }

                        if (href) {
                            return (
                                <Link
                                    prefetch={href.startsWith("/docs")}
                                    className={cn("transition", resolveNodeKindLinkClass(excerpt.resolvedItem.kind))}
                                    href={href}
                                    target={href.startsWith("/docs") ? "_self" : "_blank"}
                                    key={`${excerpt.resolvedItem.displayName}-${idx}`}
                                    // @ts-expect-error - unstable_dynamicOnHover is not part of the public types
                                    unstable_dynamicOnHover
                                >
                                    {excerpt.text}
                                </Link>
                            );
                        }
                    }

                    if (excerpt.href) {
                        return (
                            <Link
                                prefetch={false}
                                className="text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                                href={excerpt.href}
                                key={`${excerpt.text}-${idx}`}
                                rel="external noreferrer noopener"
                                target="_blank"
                            >
                                {excerpt.text}
                            </Link>
                        );
                    }

                    if (excerpt.text in BuiltinDocumentationLinks) {
                        const href = BuiltinDocumentationLinks[excerpt.text as keyof typeof BuiltinDocumentationLinks];

                        return (
                            <Link
                                prefetch={false}
                                className="text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                                href={href}
                                key={`${excerpt.text}-${idx}`}
                                rel="external noreferrer noopener"
                                target="_blank"
                            >
                                {excerpt.text}
                            </Link>
                        );
                    }

                    return <Fragment key={`${excerpt.text}-${idx}`}>{excerpt.text}</Fragment>;
                })}
            </span>
        );
    };

    return node?.map(createExcerpt) ?? null;
}
