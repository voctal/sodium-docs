import { VscSymbolField } from "react-icons/vsc";
import { Parameter } from "@/lib/docs/types";
import { resolveNodeKindSpanClass } from "@/lib/kind";
import { cn } from "@/lib/utils";
import { CommentNode } from "./CommentNode";

export async function ParameterCommentNode({
    padding = false,
    node,
    version,
}: {
    readonly node: Parameter[];
    readonly padding?: boolean;
    readonly version: string;
}) {
    const parameters = node.filter(p => p.description?.length);
    if (!parameters.length) return null;

    return (
        <div>
            {parameters.map((p, i) => (
                <div key={`${p.name}-${i}`} className={cn("wrap-break-words -my-1", padding ? "pl-4" : "")}>
                    <span
                        className={cn(
                            "font-semibold underline inline-flex items-center gap-1 underline-offset-2 mr-2",
                            resolveNodeKindSpanClass("Keyword"),
                        )}
                    >
                        <VscSymbolField size={16} className="relative top-0.5" />
                        {p.name}:
                    </span>
                    <CommentNode node={p.description!} version={version} className="inline-block" />
                </div>
            ))}
        </div>
    );
}
