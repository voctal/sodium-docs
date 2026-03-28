import Link from "next/link";
import { BASE_URL, DISCORD_URL, GITHUB_URL, VOCTAL_URL } from "@/lib/constants";

export function Footer() {
    return (
        <footer className="md:pr-12 md:pl-12">
            <div className="flex flex-col flex-wrap place-content-center gap-6 pt-12 sm:flex-row md:gap-12">
                <div className="flex flex-col gap-6 place-self-center sm:flex-row md:gap-12">
                    <div className="flex max-w-max flex-col gap-2">
                        <div className="text-lg font-semibold">Community</div>
                        <div className="flex flex-col gap-1">
                            <Link
                                prefetch={false}
                                className="rounded"
                                href={DISCORD_URL}
                                rel="external noopener noreferrer"
                                target="_blank"
                            >
                                Discord
                            </Link>
                            <Link
                                prefetch={false}
                                className="rounded"
                                href={GITHUB_URL}
                                rel="external noopener noreferrer"
                                target="_blank"
                            >
                                GitHub
                            </Link>
                        </div>
                    </div>
                    <div className="flex max-w-max flex-col gap-2">
                        <div className="text-lg font-semibold">Project</div>
                        <div className="flex flex-col gap-1">
                            <Link
                                prefetch={false}
                                className="rounded"
                                href={VOCTAL_URL}
                                rel="external noopener noreferrer"
                                target="_blank"
                            >
                                Voctal
                            </Link>
                            <Link
                                prefetch={false}
                                className="rounded"
                                href={`${BASE_URL}/docs`}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                Voctal Docs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
