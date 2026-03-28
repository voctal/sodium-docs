import Link from "next/link";
import { FaGithub, FaDiscord } from "react-icons/fa";
import { BookIcon, RssIcon } from "lucide-react";
import VoctalIcon from "@/icons/brands/VoctalIcon";
import { DISCORD_URL, GITHUB_URL, VOCTAL_URL, STATUS_URL } from "@/lib/constants";

export default () => {
    return (
        <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 sm:p-20">
            <main className="row-start-2 flex flex-col items-center gap-8 sm:items-start">
                <div className="mx-auto flex items-center gap-2">
                    <VoctalIcon className="size-24" />
                    <span className="text-4xl font-semibold">Voctal Docs</span>
                </div>

                <ol className="text-md/6 list-inside text-center font-mono sm:text-left">
                    <li className="mb-2 tracking-[-.01em]">The official docs of all Voctal packages</li>
                </ol>

                <div className="mx-auto flex flex-col items-center gap-4 sm:flex-row">
                    <Link
                        prefetch={false}
                        className="bg-foreground text-background flex h-10 items-center justify-center gap-2 rounded-full border border-solid border-transparent px-4 text-sm font-medium transition-colors hover:bg-[#383838] sm:h-12 sm:w-auto sm:px-5 sm:text-base dark:hover:bg-[#ccc]"
                        href="/docs"
                        rel="noopener noreferrer"
                    >
                        <BookIcon />
                        Read the docs
                    </Link>
                    <Link
                        prefetch={false}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-solid border-black/8 px-4 text-sm font-medium transition-colors hover:border-transparent hover:bg-[#f2f2f2] sm:h-12 sm:w-auto sm:px-5 sm:text-base dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <FaGithub className="size-6" />
                        View our GitHub
                    </Link>
                </div>
            </main>

            <footer className="row-start-3 flex flex-wrap items-center justify-center gap-6">
                <Link
                    prefetch={false}
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href={VOCTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <VoctalIcon />
                    Voctal
                </Link>
                <Link
                    prefetch={false}
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href={STATUS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <RssIcon />
                    Status
                </Link>
                <Link
                    prefetch={false}
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <FaDiscord />
                    Discord
                </Link>
            </footer>
        </div>
    );
};
