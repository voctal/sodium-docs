import { Scrollbars } from "@/components/OverlayScrollbars";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Navigation } from "./Navigation";
import { SidebarHeader } from "./SidebarHeader";

export function DocSidebar() {
    return (
        <Sidebar>
            <SidebarContent className="h-screen! p-2 pb-6 bg-[#121214]">
                <SidebarHeader />
                <Scrollbars className="h-full">
                    <Navigation />
                </Scrollbars>
            </SidebarContent>
        </Sidebar>
    );
}
