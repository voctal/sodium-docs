import { KindTextElement } from "@/lib/docs/types";
import { Alert } from "../Alert";
import { CommentNode } from "./CommentNode";

export async function DeprecatedNode({
    deprecatedBlock,
    version,
}: {
    readonly deprecatedBlock: KindTextElement[];
    readonly version: string;
}) {
    return (
        <Alert title="Deprecated" type="danger">
            <div className="wrap-break-words">
                <CommentNode node={deprecatedBlock} version={version} />
            </div>
        </Alert>
    );
}
