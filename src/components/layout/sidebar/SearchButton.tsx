"use client";

import { useSetAtom } from "jotai";
import { Command, Search } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { isCmdKOpenAtom } from "@/stores/docs";

export function SearchButton() {
    const { setOpenMobile } = useSidebar();
    const setIsOpen = useSetAtom(isCmdKOpenAtom);

    return (
        <button
            aria-label="Open search"
            className="bg-zinc-100 dark:bg-zinc-800 transition dark:hover:bg-[#212124] cursor-pointer flex place-content-between place-items-center rounded-sm p-2"
            onClick={() => {
                setOpenMobile(false);
                setIsOpen(true);
            }}
            type="button"
        >
            <span className="flex place-items-center gap-2 text-zinc-300">
                <Search aria-hidden size={18} />
                Search...
            </span>
            <span className="hidden text-zinc-300 place-items-center gap-1 md:flex">
                <Command aria-hidden size={18} /> K
            </span>
        </button>
    );
}
