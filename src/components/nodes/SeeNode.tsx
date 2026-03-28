import { KindTextElement } from "@/lib/docs/types";
import { cn } from "@/lib/utils";
import { CommentNode } from "./CommentNode";

export async function SeeNode({
    padding = false,
    node,
    version,
}: {
    readonly node: KindTextElement[];
    readonly padding?: boolean;
    readonly version: string;
}) {
    return (
        <div className={cn("wrap-break-words", padding ? "pl-4" : "")}>
            <span className="font-semibold">See also:</span>
            <CommentNode node={node} version={version} />
        </div>
    );
}
