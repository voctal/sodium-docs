import { KindTextElement } from "@/lib/docs/types";
import { Alert } from "../Alert";
import { CommentNode } from "./CommentNode";

export async function UnstableNode({
    unstableBlock,
    version,
}: {
    readonly unstableBlock: KindTextElement[];
    readonly version: string;
}) {
    return (
        <Alert title="Unstable" type="danger">
            <p className="wrap-break-words">
                <CommentNode node={unstableBlock} version={version} />
            </p>
        </Alert>
    );
}
