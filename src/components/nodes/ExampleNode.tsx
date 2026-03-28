import { KindTextElement } from "@/lib/docs/types";
import { cn } from "@/lib/utils";
import { CommentNode } from "./CommentNode";

export async function ExampleNode({
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
            <span className="font-semibold">Examples:</span>
            <CommentNode node={node} version={version} />
        </div>
    );
}
