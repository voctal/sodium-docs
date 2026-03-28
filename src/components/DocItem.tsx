import { VscSymbolParameter } from "@react-icons/all-files/vsc/VscSymbolParameter";
import { Node } from "@/lib/docs/types";
import { ConstructorNode } from "./nodes/ConstructorNode";
import { DeprecatedNode } from "./nodes/DeprecatedNode";
import { EnumMemberNode } from "./nodes/EnumMemberNode";
import { EventNode } from "./nodes/EventNode";
import { ExampleNode } from "./nodes/ExampleNode";
import { InformationNode } from "./nodes/InformationNode";
import { MethodNode } from "./nodes/MethodNode";
import { ParameterCommentNode } from "./nodes/ParameterCommentNode";
import { ParameterNode } from "./nodes/ParameterNode";
import { PropertyNode } from "./nodes/PropertyNode";
import { RemarksNode } from "./nodes/RemarksNode";
import { ReturnNode } from "./nodes/ReturnNode";
import { SeeNode } from "./nodes/SeeNode";
import { SummaryNode } from "./nodes/SummaryNode";
import { ThrowsNode } from "./nodes/ThrowsNode";
import { TypeParameterNode } from "./nodes/TypeParameterNode";
import { UnionMember } from "./nodes/UnionMember";
import { UnstableNode } from "./nodes/UnstableNode";
import { Outline } from "./Outline";
import { Scrollbars } from "./OverlayScrollbars";
import { SyntaxHighlighter } from "./SyntaxHighlighter";
import { Tab, TabList, TabPanel, Tabs } from "./ui/tabs";

async function OverloadNode({
    node,
    packageName,
    version,
}: {
    readonly node: any;
    readonly packageName: string;
    readonly version: string;
}) {
    return (
        <Tabs className="flex flex-col gap-4">
            <TabList className="flex flex-wrap gap-2">
                {node.overloads.map((overload: any) => (
                    <Tab
                        className="cursor-pointer rounded-full bg-neutral-800/10 px-2 py-1 font-sans text-sm leading-none font-normal whitespace-nowrap text-neutral-800 hover:bg-neutral-800/20 data-selected:bg-neutral-500 data-selected:text-neutral-100 dark:bg-neutral-200/10 dark:text-neutral-200 dark:hover:bg-neutral-200/20 dark:data-selected:bg-neutral-500/70"
                        id={`overload-${overload.displayName}-${overload.overloadIndex}`}
                        key={`overload-tab-${overload.displayName}-${overload.overloadIndex}`}
                    >
                        <span>Overload {overload.overloadIndex}</span>
                    </Tab>
                ))}
            </TabList>
            {node.overloads.map((overload: any) => (
                <TabPanel
                    className="flex flex-col gap-4"
                    id={`overload-${overload.displayName}-${overload.overloadIndex}`}
                    key={`overload-tab-panel-${overload.displayName}-${overload.overloadIndex}`}
                >
                    <DocItem node={overload} packageName={packageName} version={version} />
                </TabPanel>
            ))}
        </Tabs>
    );
}

export async function DocItem({
    node,
    packageName,
    version,
}: {
    readonly node: Node;
    readonly packageName: string;
    readonly version: string;
}) {
    if ("overloads" in node && node.overloads?.length) {
        return <OverloadNode node={node} packageName={packageName} version={version} />;
    }

    return (
        <>
            <InformationNode node={node} version={version} />

            <Scrollbars className="maw-w-full border-neutral-600 bg-neutral-900 rounded-sm border">
                <SyntaxHighlighter
                    className="min-w-max py-4 text-sm bg-[#121214]"
                    code={node.sourceExcerpt}
                    lang="typescript"
                />
            </Scrollbars>

            {node.summary?.deprecatedBlock.length ? (
                <DeprecatedNode deprecatedBlock={node.summary.deprecatedBlock} version={version} />
            ) : null}

            {node.summary?.unstableBlock?.length ? (
                <UnstableNode unstableBlock={node.summary.unstableBlock} version={version} />
            ) : null}

            {node.summary?.summarySection.length ? (
                <SummaryNode node={node.summary.summarySection} version={version} />
            ) : null}

            {node.summary?.remarksBlock.length ? (
                <RemarksNode node={node.summary.remarksBlock} version={version} />
            ) : null}

            {node.summary?.exampleBlocks.length ? (
                <ExampleNode node={node.summary.exampleBlocks} version={version} />
            ) : null}

            {"parameters" in node ? <ParameterCommentNode node={node.parameters} version={version} /> : null}

            {node.summary?.returnsBlock.length ? (
                <ReturnNode node={node.summary.returnsBlock} version={version} />
            ) : null}

            {node.summary?.throwsBlocks?.length ? (
                <ThrowsNode node={node.summary.throwsBlocks} version={version} />
            ) : null}

            {node.summary?.seeBlocks.length ? <SeeNode node={node.summary.seeBlocks} version={version} /> : null}

            <Outline node={node} />

            {"construct" in node && node.construct ? <ConstructorNode node={node.construct} version={version} /> : null}

            {"typeParameters" in node && node.typeParameters.length ? (
                <div className="flex flex-col gap-4">
                    <h2 className="flex place-items-center gap-2 p-2 text-xl font-bold">
                        <VscSymbolParameter aria-hidden className="shrink-0" size={24} />
                        Type Parameters
                    </h2>
                    <TypeParameterNode description node={node.typeParameters} version={version} />
                </div>
            ) : null}

            {"parameters" in node && node.parameters.length ? (
                <div className="flex flex-col gap-4">
                    <h2 className="flex place-items-center gap-2 p-2 text-xl font-bold">
                        <VscSymbolParameter aria-hidden className="shrink-0" size={24} />
                        Parameters
                    </h2>
                    <ParameterNode description node={node.parameters} version={version} />
                </div>
            ) : null}

            {"members" in node && "properties" in node.members && node.members.properties.length ? (
                <PropertyNode node={node.members.properties} packageName={packageName} version={version} />
            ) : null}

            {"members" in node && "methods" in node.members && node.members.methods.length ? (
                <div>
                    <MethodNode node={node.members.methods} packageName={packageName} version={version} />
                </div>
            ) : null}

            {"members" in node && "events" in node.members && node.members.events?.length ? (
                <div>
                    <EventNode node={node.members.events} packageName={packageName} version={version} />
                </div>
            ) : null}

            {node.kind === "Enum" && "members" in node && node.members.length ? (
                <EnumMemberNode node={node.members} version={version} />
            ) : null}

            {"unionMembers" in node && node.unionMembers.length ? (
                <UnionMember node={node.unionMembers} version={version} />
            ) : null}
        </>
    );
}
