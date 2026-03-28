import { IconType } from "@react-icons/all-files/lib";
import { VscListSelection } from "@react-icons/all-files/vsc/VscListSelection";
import { VscSymbolEvent } from "@react-icons/all-files/vsc/VscSymbolEvent";
import { VscSymbolMethod } from "@react-icons/all-files/vsc/VscSymbolMethod";
import { VscSymbolProperty } from "@react-icons/all-files/vsc/VscSymbolProperty";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Member, Node } from "@/lib/docs/types";
import { resolveNodeKindLinkClass } from "@/lib/kind";
import { cn } from "@/lib/utils";
import { ContentSeparator } from "./ContentSeparator";

export async function Outline({ node }: { readonly node: Node }) {
    const properties = "members" in node && "properties" in node.members ? node.members.properties : [];
    const methods = "members" in node && "methods" in node.members ? node.members.methods : [];
    const events = "members" in node && "events" in node.members ? node.members.events : [];
    const hasAny = properties.length || methods.length || events.length;

    if (!hasAny) {
        return null;
    }

    return (
        <Collapsible className="flex flex-col gap-4" defaultOpen>
            <CollapsibleTrigger className="group flex place-content-between place-items-center rounded-md p-2 hover:bg-[#e7e7e9] dark:hover:bg-[#242428]">
                <h2 className="flex place-items-center gap-2 text-xl font-bold">
                    <VscListSelection aria-hidden className="shrink-0" size={24} /> Table of contents
                </h2>
                <ChevronDown aria-hidden className='group-data-[state="open"]:hidden' size={24} />
                <ChevronUp aria-hidden className='group-data-[state="closed"]:hidden' size={24} />
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="flex flex-col gap-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                        {properties.length ? (
                            <MembersList label="Properties" icon={VscSymbolProperty} members={properties} />
                        ) : null}

                        {methods.length ? (
                            <MembersList label="Methods" icon={VscSymbolMethod} members={methods} />
                        ) : null}

                        {events.length ? <MembersList label="Events" icon={VscSymbolEvent} members={events} /> : null}
                    </div>

                    <ContentSeparator />
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

function MembersList({
    label,
    icon: Icon,
    members,
}: {
    readonly label: string;
    readonly icon: IconType;
    readonly members: Member[];
}) {
    return (
        <Collapsible className="flex flex-col gap-2" defaultOpen>
            <CollapsibleTrigger className="group flex place-content-between place-items-center rounded-md p-2 hover:bg-[#e7e7e9] dark:hover:bg-[#242428]">
                <h2 className="flex place-items-center gap-2 text-xl font-bold">
                    <Icon aria-hidden className="shrink-0" size={24} /> {label}
                </h2>
                <ChevronDown aria-hidden className='group-data-[state="open"]:hidden' size={24} />
                <ChevronUp aria-hidden className='group-data-[state="closed"]:hidden' size={24} />
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="flex flex-col px-4">
                    {members.map((member, idx) => (
                        <Fragment key={`${member.displayName}-${idx}`}>
                            <div className="flex flex-col gap-4">
                                <div className="flex place-content-between place-items-center">
                                    <Link
                                        className={cn(
                                            "max-w-[25ch] grow truncate rounded-md p-2 font-mono transition-colors md:max-w-none md:py-1",
                                            member.kind === "Event" ? "" : resolveNodeKindLinkClass(member.kind),
                                        )}
                                        href={`#${member.displayName}`}
                                    >
                                        {member.displayName}
                                    </Link>
                                </div>
                            </div>
                        </Fragment>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
